const assert=require('node:assert/strict'),http=require('node:http');
const api=require('../umg-runtime-rev2.cjs');
const request=require('../runtime-contract-v2/fixtures/supported-contradiction.request.json');
const response=require('../runtime-contract-v2/fixtures/supported-contradiction.response.json');
const clone=structuredClone;
for(const mutate of [
 r=>r.result.acceptedFindings.push(clone(r.result.acceptedFindings[0])),
 r=>r.result.expectations.push(clone(r.result.expectations[0])),
 r=>r.result.acceptedFindings[0].reviewState='CANDIDATE',
 r=>{r.result.quarantinedFindings=[r.result.acceptedFindings.pop()];r.result.quarantinedFindings[0].reviewState='REVIEWED'},
 r=>r.auditEvents.push({effectsDispatched:1}),
 r=>r.auditEvents.push({'private.reasoning':'hidden'}),
]){const bad=clone(response);mutate(bad);assert.equal(api.validateResponse(bad,request).valid,false)}
for(const field of ['expectedRecords','candidateFindings']){const bad=clone(request);bad[field].push(clone(bad[field][0]));assert.equal(api.validateRequest(bad).valid,false)}
for(const status of ['DENIED','BLOCKED','ERROR','FALLBACK'])for(const mutate of [
 r=>r.result.unresolvedItems=['source-derived text'],
 r=>r.provenance.sourceIds=['doc-1'],
 r=>{r.runtime=clone(response.runtime)}
]){const bad=api.localFallback(request,'TEST','test');bad.status=status;mutate(bad);assert.equal(api.validateResponse(bad,request).valid,false,status)}
(async()=>{
 let count=0;
 const server=http.createServer((req,res)=>{
  count++;req.resume();req.on('end',()=>{
   if(req.headers['x-never'])return;
   const out=clone(response);out.result.acceptedFindings[0].statement='Fictional passage 🦉 café';
   const body=Buffer.from(JSON.stringify(out)),split=body.indexOf(Buffer.from('🦉'))+1;
   res.writeHead(200,{'content-type':'application/json'});res.write(body.subarray(0,split));setTimeout(()=>res.end(body.subarray(split)),5);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const endpoint=`http://127.0.0.1:${server.address().port}/v0.1/record-consistency`;
 try{
  const actual=await api.invokeLocal(request,{endpoint});assert.equal(actual.status,'SUCCEEDED');assert.equal(actual.result.acceptedFindings[0].statement,'Fictional passage 🦉 café');
  const big=clone(request);big.sources[0].extract='x'.repeat(2*1024*1024);const prior=count;
  assert.equal((await api.invokeLocal(big,{endpoint})).error.code,'REQUEST_TOO_LARGE');assert.equal(count,prior);
 }finally{await new Promise(resolve=>server.close(resolve))}
 console.log('PASS stricter boundary: pending human proposals, all failure payloads empty, no claimed effects, punctuation-normalized private keys, bounded requests before transport and split UTF-8 responses.');
})().catch(e=>{console.error(e);process.exitCode=1});
