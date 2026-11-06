'use strict';
const assert=require('node:assert/strict');
const {createServer}=require('../server.cjs');

const endpoint=process.env.CASEBRIEF_UMG_ENDPOINT;
if(!endpoint)throw new Error('Set CASEBRIEF_UMG_ENDPOINT to the verified November 4 loopback service endpoint.');
const target=new URL(endpoint);
if(target.protocol!=='http:'||target.hostname!=='127.0.0.1'||target.pathname!=='/v0.1/record-consistency')throw new Error('Only the explicit 127.0.0.1 revision-2 endpoint is permitted.');
const readyUrl=new URL('/ready',target);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
 const ready=await fetch(readyUrl);assert.equal(ready.status,200,'UMG /ready must return HTTP 200');
 const health=await ready.json();assert.equal(health.status,'READY');assert.equal(health.contractRevision,2);assert.equal(health.syntheticDataOnly,true);assert.equal(health.effectsEnabled,false);assert.equal(health.dispatchCount,0);
 const server=createServer({umgEndpoint:endpoint,reviewDbPath:':memory:'});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const session=await fetch(base+'/api/health').then(r=>r.json());
  const request={syntheticOnly:true,engine:'rules',clientRunId:'live-umg-'+Date.now(),documents:[
   {title:'Fictional officer report',text:'The traffic stop began at 22:14. The officer requested a second unit.'},
   {title:'Fictional witness statement',text:'The traffic stop began at 21:55. The witness watched from the pavement.'}
  ]};
  const response=await fetch(base+'/api/analyse',{method:'POST',headers:{origin:base,'content-type':'application/json','x-casebrief-token':session.token},body:JSON.stringify(request)});
  const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));
  assert.equal(result.status,'PENDING_HUMAN_REVIEW');
  assert.equal(result.umg.status,'SUCCEEDED');
  assert.equal(result.umg.acceptedCount,0,'fresh arbitrary finding must not be claimed as UMG-accepted');
  assert.ok(result.umg.quarantinedCount>=1,'fresh arbitrary finding should remain UMG-quarantined');
  assert.equal(result.umg.dispatchCount,0);
  assert.equal(result.result.effects.dispatchCount,0);
  assert.ok(result.result.findings.length>=1,'CaseBrief proposal remains separate from UMG semantic acceptance');
  assert.ok(result.result.findings.every(f=>f.reviewState==='HUMAN_REVIEW_REQUIRED'));
  const stored=await fetch(base+'/api/reviews/'+encodeURIComponent(result.result.invocationId),{headers:{'x-casebrief-token':session.token}}).then(r=>r.json());
  assert.equal(stored.status,'PENDING_HUMAN_REVIEW');assert.equal(stored.umg.acceptedCount,0);assert.ok(stored.umg.quarantinedCount>=1);
  assert.equal(server.reviewHost.store.verifyAuditChain(),true);
  console.log(JSON.stringify({status:'PASS',umgStatus:result.umg.status,umgAccepted:result.umg.acceptedCount,umgQuarantined:result.umg.quarantinedCount,casebriefProposals:result.result.findings.length,reviewState:result.result.findings[0]?.reviewState,dispatchCount:result.umg.dispatchCount,auditChain:'VALID'},null,2));
 }finally{
  await new Promise(resolve=>server.close(()=>resolve()));
  server.closeAllConnections?.();
 }
}
main().catch(error=>{console.error(error);process.exitCode=1});
