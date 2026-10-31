const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {createOllamaProvider}=require('../ollama.cjs');const {createServer}=require('../server.cjs');
const listen=s=>new Promise(r=>s.listen(0,'127.0.0.1',r));const close=s=>new Promise(r=>{s.close(r);s.closeAllConnections()});
test('Ollama transport uses bounded structured output, ignores private thinking and fails closed',async()=>{
 let mode='good',captured;
 const server=http.createServer((req,res)=>{let raw='';req.on('data',b=>raw+=b);req.on('end',()=>{captured=JSON.parse(raw);if(mode==='timeout')return setTimeout(()=>res.end('{}'),100);if(mode==='http'){res.writeHead(500);return res.end('private detail')}
 const output={model:'test:local',done:true,done_reason:'stop',message:{role:'assistant',content:JSON.stringify({status:'NEEDS_INPUT',findings:[]}),thinking:'not persisted'}};
 if(mode==='truncated')output.done_reason='length';if(mode==='badjson')output.message.content='not-json';if(mode==='tools')output.message.tool_calls=[{}];
 res.end(JSON.stringify(output));});});await listen(server);
 const endpoint=`http://127.0.0.1:${server.address().port}/api/chat`;
 try{const p=createOllamaProvider({model:'test:local',endpoint});assert.deepEqual(await p.run([{sourceId:'x',extract:'fictional'}]),{status:'NEEDS_INPUT',findings:[]});assert.equal(captured.stream,false);assert.equal(captured.think,false);assert.equal(captured.tools,undefined);assert.equal(captured.format.additionalProperties,false);assert.match(captured.messages[0].content,/untrusted/);
 for(const m of ['http','truncated','badjson','tools']){mode=m;await assert.rejects(p.run([]))}mode='timeout';await assert.rejects(createOllamaProvider({model:'test:local',endpoint,timeoutMs:10}).run([]),/MODEL_TIMEOUT/);
 assert.throws(()=>createOllamaProvider({model:'x',endpoint:'https://example.com/api/chat'}));assert.throws(()=>createOllamaProvider({}));assert.throws(()=>createOllamaProvider({model:'x:cloud'}));
 }finally{await close(server)}
});
test('local browser flow discovers fresh findings, rejects CSRF and records versioned human decisions',async()=>{
 const server=createServer({});await listen(server);const base=`http://127.0.0.1:${server.address().port}`;
 try{
 const health=await (await fetch(base+'/api/health')).json();const headers={'content-type':'application/json','x-casebrief-token':health.token,origin:base};
 const documents=[{title:'A',text:'The interview began at 12:17.'},{title:'B',text:'The interview began at 12:49.'}];
 const body=JSON.stringify({syntheticOnly:true,engine:'rules',documents});
 assert.equal((await fetch(base+'/api/analyse',{method:'POST',headers:{'content-type':'application/json'},body})).status,403);
 assert.equal((await fetch(base+'/api/analyse',{method:'POST',headers:{...headers,origin:'https://evil.example'},body})).status,403);
 const response=await fetch(base+'/api/analyse',{method:'POST',headers,body});assert.equal(response.status,200);const row=await response.json();assert.equal(row.result.findings.length,1);assert.equal(row.umg.status,'NOT_RUN');
 const review={invocationId:row.result.invocationId,version:0,findingId:row.result.findings[0].findingId,action:'CONFIRMED',reason:'I checked both source passages.'};
 const confirmed=await fetch(base+'/api/review',{method:'POST',headers,body:JSON.stringify(review)});assert.equal(confirmed.status,200);assert.equal((await confirmed.json()).version,1);
 assert.equal((await fetch(base+'/api/review',{method:'POST',headers,body:JSON.stringify(review)})).status,400);
 assert.equal((await fetch(base+'/.git/config')).status,404);
 assert.equal((await fetch(base+'/analysis/')).status,200);
 const nonSynthetic=JSON.stringify({syntheticOnly:false,engine:'rules',documents});assert.equal((await fetch(base+'/api/analyse',{method:'POST',headers,body:nonSynthetic})).status,400);
 }finally{await close(server)}
});
