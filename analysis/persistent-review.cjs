'use strict';
const {createHash}=require('node:crypto');
const {SyntheticReviewStore}=require('../integration/host/synthetic-review-store.cjs');
const {verification}=require('./verification.cjs');
const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const clone=value=>structuredClone(value);
class PersistentAnalysisReview{
 constructor({filename,syntheticOnly=true}={}){
  this.store=new SyntheticReviewStore({filename:filename||':memory:',syntheticOnly});
  this.contexts=new Map();this.clientRuns=new Map();this.invalidatedRuns=new Set();
 }
 scope(request){return {tenantId:request.hostContext.tenantId,matterId:request.hostContext.matterId,actorId:request.hostContext.actor.id}}
 snapshot(request){
  const sources=request.sources.map(s=>({sourceId:s.sourceId,version:'sha256:'+hash(s.extract),digest:hash({sourceId:s.sourceId,matterId:s.matterId,locator:s.locator,extract:s.extract})}));
  return {sources,digest:hash({tenantId:request.hostContext.tenantId,matterId:request.hostContext.matterId,actor:request.hostContext.actor,authorization:request.hostContext.authorization,sources})};
 }
 begin({request,analysisResult,documents,clientRunId}){
  if(request.syntheticOnly!==true||!clientRunId)throw new Error('SYNTHETIC_RUN_REQUIRED');
  const scope=this.scope(request),snapshot=this.snapshot(request),id=analysisResult.invocationId;
  if(this.invalidatedRuns.has(clientRunId))throw new Error('STALE_CLIENT_RUN');
  const record={id,tenantId:scope.tenantId,matterId:scope.matterId,actorId:scope.actorId,syntheticOnly:true,status:'RUNNING',revision:0,version:0,
   requestDigest:hash(request),sourceSnapshotDigest:snapshot.digest,sourceSnapshot:snapshot.sources,contextDigest:snapshot.digest,
   correlationId:request.correlationId,auditId:request.auditId,findings:[],decisions:[],events:[],analysis:clone(analysisResult),
   documents:clone(documents.map((d,i)=>({sourceId:request.sources[i].sourceId,title:d.title}))),
   umg:{status:'PENDING',acceptedCount:0,quarantinedCount:0,dispatchCount:0,reason:'UMG result not yet received.'},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),errorCode:null};
  this.store.create(record);
  this.contexts.set(id,{scope,contextDigest:snapshot.digest,clientRunId,active:true,expiresAt:request.hostContext.authorization.expiresAt});
  this.clientRuns.set(clientRunId,id);
  return clone(record);
 }
 complete(id,{umg,responseDigest=null,errorCode=null}={}){
  const context=this.contexts.get(id),record=this.rawGet(id);
  if(!context)throw new Error('HOST_CONTEXT_UNAVAILABLE');
  const scope=context.scope;
  return this.store.update(id,scope,current=>{
   let status='REJECTED',findings=[],event='result.rejected',code=errorCode;
   const expired=context.expiresAt&&Date.parse(context.expiresAt)<=Date.now();
   if(!context.active||this.invalidatedRuns.has(context.clientRunId)||expired){status='INVALIDATED';event='result.invalidated';code='HOST_CONTEXT_CHANGED'}
   else if(!code&&umg?.status==='SUCCEEDED'){status='PENDING_HUMAN_REVIEW';event='result.pending_review';findings=clone(current.analysis.findings).map(f=>({...f,reviewState:'HUMAN_REVIEW_REQUIRED'}))}
   else if(!code)code='UMG_'+(umg?.status||'NOT_RUN');
   const next={...current,status,revision:current.revision+1,version:current.revision+1,findings,umg:clone(umg||{status:'ERROR',dispatchCount:0}),responseDigest,errorCode:code,updatedAt:new Date().toISOString()};
   return {record:next,event,data:{code,responseDigest,sourceSnapshotDigest:current.sourceSnapshotDigest,proposalCount:findings.length,umgStatus:next.umg.status,dispatchCount:next.umg.dispatchCount||0}};
  });
 }
 rawGet(id){
  const row=this.store.db.prepare('SELECT body FROM invocations WHERE id=?').get(id);
  if(!row)throw new Error('INVOCATION_NOT_FOUND');return JSON.parse(row.body);
 }
 get(id){
  const record=this.rawGet(id),context=this.contexts.get(id);
  if(record.tenantId!=='local-synthetic-workbench'||record.actorId!=='local-workbench-user')throw new Error('INVOCATION_NOT_AUTHORIZED');
  const active=!!context?.active&&context.contextDigest===record.contextDigest&&!(context.expiresAt&&Date.parse(context.expiresAt)<=Date.now())&&record.status==='PENDING_HUMAN_REVIEW';
  const events=this.store.events(id,{tenantId:record.tenantId,matterId:record.matterId,actorId:record.actorId});
  return {...record,events:clone(record.events||[]),version:record.revision,readOnly:!active,hostAudit:events,findings:record.status==='INVALIDATED'?[]:record.findings};
 }
 list(){
  return this.store.db.prepare('SELECT body FROM invocations WHERE tenant=? AND actor=? ORDER BY rowid DESC LIMIT 20').all('local-synthetic-workbench','local-workbench-user').map(row=>{const r=JSON.parse(row.body);return {invocationId:r.id,matterId:r.matterId,status:r.status,proposalCount:r.findings?.length||0,createdAt:r.createdAt,updatedAt:r.updatedAt,readOnly:!this.contexts.get(r.id)?.active}});
 }
 invalidateClientRun(clientRunId){
  if(typeof clientRunId!=='string'||!clientRunId)throw new Error('CLIENT_RUN_REQUIRED');
  this.invalidatedRuns.add(clientRunId);const id=this.clientRuns.get(clientRunId);
  if(!id)return {invalidated:true,invocationId:null};
  const context=this.contexts.get(id);if(context)context.active=false;
  const record=this.rawGet(id);if(record.status==='INVALIDATED'||record.status==='REJECTED')return {invalidated:true,invocationId:id};
  const scope={tenantId:record.tenantId,matterId:record.matterId,actorId:record.actorId};
  this.store.update(id,scope,current=>({record:{...current,status:'INVALIDATED',revision:current.revision+1,version:current.revision+1,findings:[],errorCode:'HOST_CONTEXT_CHANGED',updatedAt:new Date().toISOString()},event:'result.invalidated',data:{code:'HOST_CONTEXT_CHANGED',sourceSnapshotDigest:current.sourceSnapshotDigest}}));
  return {invalidated:true,invocationId:id};
 }
 review({invocationId,findingId,action,reason,assessment,version}){
  const context=this.contexts.get(invocationId);if(!context?.active)throw new Error('SOURCE_CONTEXT_UNAVAILABLE');
  if(context.expiresAt&&Date.parse(context.expiresAt)<=Date.now())throw new Error('AUTHORIZATION_EXPIRED');
  const scope=context.scope,record=this.store.get(invocationId,scope);
  if(record.status!=='PENDING_HUMAN_REVIEW')throw new Error('RESULT_NOT_REVIEWABLE');
  if(!Number.isInteger(version)||version!==record.revision)throw new Error('REVIEW_CONFLICT');
  if(typeof reason!=='string'||!reason.trim()||reason.length>1000)throw new Error('REVIEW_REASON_REQUIRED');
  if(!['SUPPORT_ASSESSED','CONFIRMED','DISMISSED','REOPENED'].includes(action))throw new Error('INVALID_REVIEW_ACTION');
  const finding=record.findings.find(f=>f.findingId===findingId);if(!finding)throw new Error('UNKNOWN_FINDING');
  const prior=verification(finding,record.events||[]);
  if(action==='SUPPORT_ASSESSED'&&!['SUPPORTED','NOT_SUPPORTED','UNCERTAIN'].includes(assessment))throw new Error('SUPPORT_ASSESSMENT_REQUIRED');
  if(action==='CONFIRMED'&&prior.propositionSupport!=='SUPPORTED')throw new Error('SUPPORTED_PASSAGES_REQUIRED');
  if((record.events||[]).length>=98)throw new Error('REVIEW_HISTORY_LIMIT');
  const at=new Date().toISOString(),event={id:require('node:crypto').randomUUID(),at,actor:scope.actorId,findingId,action,reason:reason.trim(),...(action==='SUPPORT_ASSESSED'?{assessment}:{})};
  return this.store.update(invocationId,scope,current=>{
   const events=[...(current.events||[]),event];
   if(action==='SUPPORT_ASSESSED'&&prior.disposition==='CONFIRMED')events.push({id:require('node:crypto').randomUUID(),at:new Date().toISOString(),actor:'local-workbench-system',findingId,action:'REOPENED',reason:'Passage assessment changed; confirmation must be recorded again.'});
   const target=current.findings.find(f=>f.findingId===findingId);target.verification=verification(target,events);
   const next={...current,events,decisions:[...(current.decisions||[]),{...event,reasonDigest:hash(event.reason)}],revision:current.revision+1,version:current.revision+1,updatedAt:new Date().toISOString()};
   return {record:next,event:'finding.'+action.toLowerCase(),data:{findingId,revision:next.revision,reasonDigest:hash(event.reason),assessment:action==='SUPPORT_ASSESSED'?assessment:undefined}};
  });
 }
 close(){this.store.close()}
}
module.exports={PersistentAnalysisReview,hash};
