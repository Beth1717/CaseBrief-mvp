const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const api=require('../umg-runtime-rev2.cjs');
const base='../runtime-contract-v2/fixtures/';
const pairs=['supported-contradiction','unsupported-claim','wrong-matter-denial','missing-expected-record'].map(name=>({name,request:require(base+name+'.request.json'),response:require(base+name+'.response.json')}));
for(const {name,request,response} of pairs){assert.equal(api.validateRequest(request).valid,true,name);assert.equal(api.validateResponse(response,request).valid,true,name)}
const {request,response}=pairs[0];
const built=api.buildRequest({syntheticOnly:true,hostContext:request.hostContext,sources:request.sources,expectedRecords:request.expectedRecords,candidateFindings:request.candidateFindings});
assert.equal(new Set([built.requestId,built.correlationId,built.auditId]).size,3);
const denied=api.buildRequest({syntheticOnly:true,hostContext:{...request.hostContext,authorization:{...request.hostContext.authorization,status:'DENY'}},sources:request.sources,expectedRecords:request.expectedRecords,candidateFindings:request.candidateFindings});
assert.equal(denied.sources.length+denied.expectedRecords.length+denied.candidateFindings.length,0);
for(const mutate of [
 r=>r.contractRevision=1,r=>r.syntheticOnly=false,r=>r.sources[0].matterId='other',r=>r.sources.push(structuredClone(r.sources[0])),r=>r.expectedRecords[0].basisSourceIds=['unknown'],r=>r.hostContext.authorization.expiresAt='2000-01-01T00:00:00Z',r=>r.constraints.externalEffectsAllowed=true,r=>r.hostContext.actor.role='made_up'
]){const bad=structuredClone(request);mutate(bad);assert.equal(api.validateRequest(bad).valid,false)}
for(const mutate of [
 r=>r.contractRevision=1,r=>r.requestId='different',r=>r.correlationId='different',r=>r.authorization.matterId='other',r=>r.authorization.decisionId='other',r=>r.sleeve.revision=9,r=>r.status='UNKNOWN',r=>r.effects.dispatchCount=1,r=>r.effects.executed=[{}],r=>r.result.acceptedFindings[0].sourceRefs=['unknown'],r=>r.result.acceptedFindings[0].sourceRefs=[],r=>r.result.acceptedFindings[0].reviewState='REVIEWED',r=>r.provenance.sourceIds=['unknown'],r=>r.auditEvents=[{context:{privateReasoning:'secret'}}],r=>r.result.expectations[0].recordId='other',r=>r.result.expectations[0].basisSourceIds=['unknown'],r=>{r.result.expectations[0].status='resolved_by_human_review';r.result.expectations[0].decisionRef='invented'},r=>r.runtime.runtimeHash=null,r=>r.status='DENIED',r=>r.provenance.synthetic=false
]){const bad=structuredClone(response);mutate(bad);assert.equal(api.validateResponse(bad,request).valid,false)}
assert.equal(api.validateResponse(api.localFallback(request,'TEST','Local fallback'),request).valid,true);
assert.equal(api.validateResponse(api.localFallback(denied,'TEST','Local fallback'),denied).valid,true);
(async()=>{
 const server=http.createServer((req,res)=>{
  let text='';req.on('data',b=>text+=b);req.on('end',()=>{
   const incoming=JSON.parse(text);const out=structuredClone(response);out.requestId=incoming.requestId;out.correlationId=incoming.correlationId;
   if(incoming.auditId==='timeout'){setTimeout(()=>{res.end(JSON.stringify(out))},100);return}
   if(incoming.auditId==='invalid')out.effects.dispatchCount=1;
   res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(out));
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const endpoint=`http://127.0.0.1:${server.address().port}/v0.1/record-consistency`;
 try{
  assert.throws(()=>api.invokeLocal(request,{endpoint:'https://example.com/v0.1/record-consistency'}),/loopback/);
  assert.throws(()=>api.invokeLocal(request,{timeoutMs:30001}),/timeout/);
  const good=await api.invokeLocal(request,{endpoint});assert.equal(good.status,'SUCCEEDED');
  const invalid=await api.invokeLocal({...request,auditId:'invalid'},{endpoint});assert.equal(invalid.error.code,'INVALID_RESPONSE');
  const timeout=await api.invokeLocal({...request,auditId:'timeout'},{endpoint,timeoutMs:10});assert.equal(timeout.error.code,'FRAMEWORK_TIMEOUT');
  await new Promise(resolve=>setTimeout(resolve,130));assert.equal(timeout.status,'FALLBACK');
  const snapshot=structuredClone(request),pending=api.invokeLocal(snapshot,{endpoint});snapshot.requestId='changed';snapshot.sources=[];assert.equal((await pending).status,'SUCCEEDED');
  const noScope=structuredClone(request);noScope.hostContext.authorization.scopes=['case_view'];assert.equal((await api.invokeLocal(noScope,{endpoint})).error.code,'HOST_SCOPE_MISSING');
 }finally{await new Promise(resolve=>server.close(resolve))}
 const down=await api.invokeLocal(request,{endpoint});assert.equal(down.error.code,'FRAMEWORK_UNAVAILABLE');
 console.log('PASS UMG revision 2: four real replay pairs, schemas, opaque IDs, denial redaction, source/expectation binding, proposals, nested reasoning rejection, zero effects, loopback-only transport, scope gate, immutable in-flight snapshot, timeout/late-result rejection and fallback.');
})().catch(e=>{console.error(e);process.exitCode=1});
