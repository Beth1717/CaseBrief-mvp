const {test}=require('node:test'),assert=require('node:assert/strict');
const {createServer}=require('../server.cjs');
test('quotes do not assert semantic support; confirmation requires explicit support; reassessment reopens',async()=>{
 const server=createServer({reviewDbPath:':memory:'});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const {token}=await (await fetch(base+'/api/health')).json();
  const headers={'content-type':'application/json',origin:base,'x-casebrief-token':token};
  const post=async(path,input)=>{const response=await fetch(base+path,{method:'POST',headers,body:JSON.stringify(input)});return {status:response.status,data:await response.json()}};
  const {data:row}=await post('/api/analyse',{syntheticOnly:true,engine:'rules',clientRunId:'verification-run',documents:[{title:'A',text:'The stop began at 10:15.'},{title:'B',text:'The stop began at 10:45.'}]});
  const finding=row.result.findings[0];assert.equal(finding.verification.propositionSupport,'UNASSESSED');assert.equal(finding.verification.attorneyValidation,'NOT_ESTABLISHED');
  const review={invocationId:row.result.invocationId,findingId:finding.findingId,version:row.version,reason:'Test-only review reason'};
  assert.equal((await post('/api/review',{...review,action:'CONFIRMED'})).status,409);
  assert.equal((await post('/api/review',{...review,action:'SUPPORT_ASSESSED',assessment:'ATTORNEY_VERIFIED'})).status,409);
  let response=await post('/api/review',{...review,action:'SUPPORT_ASSESSED',assessment:'UNCERTAIN'});assert.equal(response.status,200);assert.equal(response.data.version,2);
  assert.equal((await post('/api/review',{...review,version:2,action:'CONFIRMED'})).status,409);
  response=await post('/api/review',{...review,version:2,action:'SUPPORT_ASSESSED',assessment:'SUPPORTED'});assert.equal(response.data.version,3);
  response=await post('/api/review',{...review,version:3,action:'CONFIRMED'});assert.equal(response.status,200);assert.equal(response.data.version,4);
  assert.equal(response.data.findings[0].verification.attorneyValidation,'NOT_ESTABLISHED');
  response=await post('/api/review',{...review,version:4,action:'SUPPORT_ASSESSED',assessment:'NOT_SUPPORTED'});
  assert.equal(response.data.version,5);assert.equal(response.data.findings[0].verification.disposition,'REOPENED');assert.equal(response.data.findings[0].verification.propositionSupport,'NOT_SUPPORTED');
  assert.equal(new Set(response.data.events.map(e=>e.id)).size,response.data.events.length);
  assert.equal((await post('/api/review',{...review,version:4,action:'CONFIRMED'})).status,409,'stale versions fail');
 }finally{await new Promise(r=>{server.close(r);server.closeAllConnections()})}
});
