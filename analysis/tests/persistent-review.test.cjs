'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createServer}=require('../server.cjs');
const adapter=require('../../integration/umg-runtime-rev2.cjs');
const fixture=require('../../integration/runtime-contract-v2/fixtures/supported-contradiction.response.json');
const clone=structuredClone;
function listen(server){return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)))}
function close(server){return new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))}
function makeUmg({mode='success',delay=0,onRequest=()=>{}}={}){
 return http.createServer((req,res)=>{let raw='';req.setEncoding('utf8');req.on('data',x=>raw+=x);req.on('end',()=>{
  const request=JSON.parse(raw);onRequest(request);
  let response=clone(fixture);response.requestId=request.requestId;response.correlationId=request.correlationId;
  response.authorization.matterId=request.hostContext.matterId;response.authorization.decisionId=request.hostContext.authorization.decisionId;
  response.authorization.status=request.hostContext.authorization.status;
  response.result.acceptedFindings=response.result.acceptedFindings.slice(0,1).map(f=>({...f,findingId:request.candidateFindings[0]?.findingId||f.findingId,category:request.candidateFindings[0]?.category||f.category,statement:request.candidateFindings[0]?.statement||f.statement,sourceRefs:request.sources.map(s=>s.sourceId),reviewState:'HUMAN_REVIEW_REQUIRED'}));
  response.result.quarantinedFindings=[];response.result.expectations=[];response.result.unresolvedItems=[];response.provenance.sourceIds=request.sources.map(s=>s.sourceId);response.auditEvents=response.auditEvents.map(e=>({...e,requestId:request.requestId,auditId:request.auditId}));
  response.effects={dispatchCount:0,executed:[],proposed:[]};const validation=adapter.validateResponse(response,request);if(!validation.valid)console.error('MOCK_UMG_RESPONSE_INVALID',validation.errors);
  if(mode==='wrong-id')response.requestId='wrong-request-id';
  if(mode==='needs-input'){response.status='NEEDS_INPUT';response.result.acceptedFindings=[];response.result.quarantinedFindings=[];response.result.unresolvedItems=[];response.provenance.sourceIds=[];}
  if(mode==='delay')return setTimeout(()=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(response))},delay);
  res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(response));
 });});
}
async function post(base,token,pathName,body){
 const r=await fetch(base+pathName,{method:'POST',headers:{origin:base,'content-type':'application/json','x-casebrief-token':token},body:JSON.stringify(body)});
 const value=await r.json();return {status:r.status,value};
}
async function startWork({db,umgEndpoint}){
 const server=createServer({umgEndpoint,reviewDbPath:db});const port=await listen(server),base=`http://127.0.0.1:${port}`;
 const health=await fetch(base+'/api/health').then(r=>r.json());return {server,base,token:health.token};
}
function input(clientRunId){return {syntheticOnly:true,engine:'rules',clientRunId,documents:[
 {title:'Fictional incident report',text:'The traffic stop began at 22:14. The officer requested a second unit.'},
 {title:'Fictional witness statement',text:'The traffic stop began at 21:55. The witness watched from the pavement.'}
]}}
test('host review persists decisions, verifies UMG response, invalidates stale runs and fails closed after restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'casebrief-persistent-review-')),db=path.join(dir,'review.sqlite');
 let receivedResolve;const received=new Promise(resolve=>receivedResolve=resolve);
 const umg=makeUmg({mode:'success',onRequest:receivedResolve}),umgPort=await listen(umg),endpoint=`http://127.0.0.1:${umgPort}/v0.1/record-consistency`;
 let app;
 try{
  app=await startWork({db,umgEndpoint:endpoint});
  const runId='run-persist-1',first=await post(app.base,app.token,'/api/analyse',input(runId));
  assert.equal(first.status,200);assert.equal(first.value.status,'PENDING_HUMAN_REVIEW',JSON.stringify(first.value.umg));
  assert.equal(first.value.result.findings.length,1);assert.equal(first.value.umg.status,'SUCCEEDED');assert.equal(first.value.umg.dispatchCount,0);
  const invocationId=first.value.result.invocationId,findingId=first.value.result.findings[0].findingId;
  assert.equal(first.value.result.findings[0].reviewState,'HUMAN_REVIEW_REQUIRED');
  const support=await post(app.base,app.token,'/api/review',{invocationId,findingId,action:'SUPPORT_ASSESSED',assessment:'SUPPORTED',reason:'Both fictional source passages were checked.',version:1});
  assert.equal(support.status,200);assert.equal(support.value.version,2);
  const confirm=await post(app.base,app.token,'/api/review',{invocationId,findingId,action:'CONFIRMED',reason:'The passages support this limited factual proposal.',version:2});
  assert.equal(confirm.status,200);assert.equal(confirm.value.version,3);
  assert.equal(confirm.value.findings[0].verification.propositionSupport,'SUPPORTED');
  assert.equal(confirm.value.findings[0].verification.disposition,'CONFIRMED');
  assert.equal(app.server.reviewHost.store.verifyAuditChain(),true);
  const audit=await fetch(app.base+'/api/reviews/'+invocationId,{headers:{'x-casebrief-token':app.token}}).then(r=>r.json());
  assert.equal(audit.decisions.length,2);assert.equal(audit.hostAudit.length,4);
  assert.ok(!JSON.stringify(audit.hostAudit).includes('Both fictional source passages were checked.'));
  const invalidated=await post(app.base,app.token,'/api/invalidate',{clientRunId:runId});
  assert.equal(invalidated.status,200);
  const hidden=await fetch(app.base+'/api/reviews/'+invocationId,{headers:{'x-casebrief-token':app.token}}).then(r=>r.json());
  assert.equal(hidden.status,'INVALIDATED');assert.deepEqual(hidden.result.findings,[]);assert.equal(hidden.decisions.length,2);
  await close(app.server);app=null;
  app=await startWork({db,umgEndpoint:endpoint});
  const afterRestart=await fetch(app.base+'/api/reviews/'+invocationId,{headers:{'x-casebrief-token':app.token}}).then(r=>r.json());
  assert.equal(afterRestart.status,'INVALIDATED');assert.equal(afterRestart.readOnly,true);assert.equal(afterRestart.decisions.length,2);
  const forbiddenReview=await post(app.base,app.token,'/api/review',{invocationId,findingId,action:'DISMISSED',reason:'Should fail after restart',version:4});
  assert.equal(forbiddenReview.status,409);assert.equal(forbiddenReview.value.error,'SOURCE_CONTEXT_UNAVAILABLE');
  assert.equal(app.server.reviewHost.store.verifyAuditChain(),true);
 }finally{if(app)await close(app.server);await close(umg);fs.rmSync(dir,{recursive:true,force:true})}
});
test('wrong-identity UMG responses and NEEDS_INPUT never create promotable proposals',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'casebrief-umg-negative-')),db=path.join(dir,'review.sqlite');
 for(const mode of ['wrong-id','needs-input']){
  const umg=makeUmg({mode}),port=await listen(umg),app=await startWork({db:db+'-'+mode,umgEndpoint:`http://127.0.0.1:${port}/v0.1/record-consistency`});
  try{
   const result=await post(app.base,app.token,'/api/analyse',input('negative-'+mode));
   assert.equal(result.status,200);
   assert.equal(result.value.result.findings.length,0);
   assert.ok(['REJECTED','INVALIDATED'].includes(result.value.status));
   assert.equal(result.value.readOnly,true);
   assert.equal(result.value.umg.dispatchCount,0);
  }finally{await close(app.server);await close(umg)}
 }
 fs.rmSync(dir,{recursive:true,force:true});
});
test('a source edit during an asynchronous UMG call invalidates the late result before human review',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'casebrief-late-response-')),db=path.join(dir,'review.sqlite');
 let signal;const seen=new Promise(resolve=>signal=resolve);
 const umg=makeUmg({mode:'delay',delay:100,onRequest:signal}),port=await listen(umg),app=await startWork({db,umgEndpoint:`http://127.0.0.1:${port}/v0.1/record-consistency`});
 try{
  const pending=post(app.base,app.token,'/api/analyse',input('late-result-run'));await seen;
  const invalidation=await post(app.base,app.token,'/api/invalidate',{clientRunId:'late-result-run'});assert.equal(invalidation.status,200);
  const result=await pending;assert.equal(result.status,200);assert.equal(result.value.status,'INVALIDATED');assert.deepEqual(result.value.result.findings,[]);
 }finally{await close(app.server);await close(umg);fs.rmSync(dir,{recursive:true,force:true})}
});
