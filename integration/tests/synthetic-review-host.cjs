const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {SyntheticReviewStore}=require('../host/synthetic-review-store.cjs');
const {createSyntheticCoordinator}=require('../host/synthetic-review-coordinator.cjs');
const fixture=require('../runtime-contract-v2/fixtures/supported-contradiction.request.json');
const answer=require('../runtime-contract-v2/fixtures/supported-contradiction.response.json');
const clone=structuredClone,scope={tenantId:'synthetic-tenant',matterId:'matter-001',actorId:'demo-reviewer'};
function context(){return {...clone(fixture),sourceVersions:Object.fromEntries(fixture.sources.map(s=>[s.sourceId,'v1']))}}
function response(request){const r=clone(answer);r.requestId=request.requestId;r.correlationId=request.correlationId;r.authorization.decisionId=request.hostContext.authorization.decisionId;return r}
(async()=>{
 assert.throws(()=>new SyntheticReviewStore(),/syntheticOnly/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'casebrief-host-test-')),filename=path.join(dir,'synthetic.sqlite');let store;
 try{
  let ctx=context(),calls=0,failEvent=null;
  store=new SyntheticReviewStore({filename,syntheticOnly:true,beforeAuditWrite:type=>{if(type===failEvent)throw new Error('AUDIT_WRITE_FAILED')}});
  const create=(invoke=async req=>{calls++;return response(req)})=>createSyntheticCoordinator({store,readContext:()=>ctx,invoke});
  const host=create(),good=await host.run(scope);
  assert.equal(good.status,'PENDING_HUMAN_REVIEW');assert.equal(good.findings[0].reviewState,'HUMAN_REVIEW_REQUIRED');assert.equal(calls,1);
  assert.equal(store.events(good.id,scope).length,2);assert.equal(store.verifyAuditChain(),true);
  for(const wrong of [{...scope,tenantId:'other'},{...scope,matterId:'other'},{...scope,actorId:'other'}])assert.throws(()=>store.get(good.id,wrong),/NOT_AUTHORIZED/);
  const confirm=host.review({scope,id:good.id,findingId:'i1',decision:'confirm',reason:'Checked both fictional source passages',expectedRevision:1});
  assert.equal(confirm.findings[0].reviewState,'CONFIRMED_BY_HUMAN');
  assert.throws(()=>host.review({scope,id:good.id,findingId:'i1',decision:'dismiss',reason:'conflict',expectedRevision:1}),/CONFLICT/);
  assert.throws(()=>host.review({scope,id:good.id,findingId:'i1',decision:'dismiss',reason:' ',expectedRevision:2}),/EXPLICIT/);
  const reopen=host.review({scope,id:good.id,findingId:'i1',decision:'reopen',reason:'Second review needed',expectedRevision:2});
  assert.equal(reopen.findings[0].reviewState,'HUMAN_REVIEW_REQUIRED');
  const auditText=JSON.stringify(store.events(good.id,scope));assert.ok(!auditText.includes(fixture.sources[0].extract));assert.ok(!auditText.includes('Checked both fictional'));
  store.close();store=new SyntheticReviewStore({filename,syntheticOnly:true,beforeAuditWrite:type=>{if(type===failEvent)throw new Error('AUDIT_WRITE_FAILED')}});
  assert.equal(store.get(good.id,scope).decisions.length,2);assert.equal(store.verifyAuditChain(),true);
  assert.throws(()=>store.db.exec('DELETE FROM events'),/cannot be deleted/);assert.throws(()=>store.db.exec("UPDATE events SET hash='changed'"),/cannot be updated/);
  const restarted=create();ctx.sources[0].extract+=' changed';
  const stale=restarted.get(scope,good.id);assert.equal(stale.status,'INVALIDATED');assert.deepEqual(stale.findings,[]);assert.deepEqual(stale.decisions,[]);
  assert.throws(()=>restarted.review({scope,id:good.id,findingId:'i1',decision:'confirm',reason:'bad',expectedRevision:4}),/NOT_REVIEWABLE/);
  ctx=context();ctx.hostContext.authorization.status='DENY';const beforeCalls=calls;
  assert.equal((await create().run(scope)).errorCode,'HOST_AUTHORIZATION_REQUIRED');assert.equal(calls,beforeCalls);
  ctx=context();delete ctx.sourceVersions['doc-1'];await assert.rejects(create().run(scope),/SOURCE_VERSION_REQUIRED/);
  ctx=context();ctx.syntheticOnly=false;await assert.rejects(create().run(scope),/SYNTHETIC/);
  ctx=context();ctx.hostContext.tenantId='other';await assert.rejects(create().run(scope),/HOST_IDENTITY_MISMATCH/);
  for(const mutation of [c=>c.sources[0].extract+='changed',c=>c.sourceVersions['doc-1']='v2',c=>c.hostContext.authorization.scopes=['case_view'],c=>c.hostContext.authorization.decisionId='new',c=>c.hostContext.authorization.expiresAt='2000-01-01T00:00:00Z',c=>c.sources.pop()]){
   ctx=context();const changed=create(async req=>{mutation(ctx);return response(req)});const result=await changed.run(scope);assert.equal(result.status,'REJECTED');assert.deepEqual(result.findings,[]);
  }
  ctx=context();const cross=create(async req=>{const r=response(req);r.correlationId='other-tenant-invocation';return r});assert.equal((await cross.run(scope)).errorCode,'INVALID_RESPONSE');
  ctx=context();const bad=create(async()=>{throw new Error('secret runtime details')});assert.equal((await bad.run(scope)).errorCode,'RUNTIME_FALLBACK');
  ctx=context();failEvent='invocation.started';const noDispatch=calls;await assert.rejects(create().run(scope),/AUDIT_WRITE_FAILED/);assert.equal(calls,noDispatch);
  failEvent=null;const waiting=create();const pending=await waiting.run(scope),eventCount=store.events(pending.id,scope).length;
  failEvent='finding.confirm';assert.throws(()=>waiting.review({scope,id:pending.id,findingId:'i1',decision:'confirm',reason:'not saved',expectedRevision:1}),/AUDIT_WRITE_FAILED/);
  assert.equal(store.get(pending.id,scope).revision,1);assert.equal(store.get(pending.id,scope).decisions.length,0);assert.equal(store.events(pending.id,scope).length,eventCount);
  let pendingId;failEvent='result.pending_review';await assert.rejects(create(async req=>{pendingId=req.requestId;return response(req)}).run(scope),/AUDIT_WRITE_FAILED/);
  assert.equal(store.get(pendingId,scope).status,'RUNNING');assert.deepEqual(store.get(pendingId,scope).findings,[]);
  failEvent=null;ctx=context();ctx.hostContext.authorization.scopes=['case_view'];assert.throws(()=>create().get(scope,pending.id),/READ_NOT_AUTHORIZED/);
  assert.equal(store.verifyAuditChain(),true);
  console.log('PASS synthetic host: persistent restart, tenant/matter/actor isolation, source versions and in-flight changes, authorization revocation, stale-read invalidation, reasoned review, conflicts, audit rollback and zero dispatch before audit.');
 }finally{store?.close();fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
