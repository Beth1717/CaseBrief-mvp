'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {createServer}=require('../server.cjs');

async function withServer(server,fn){
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 try{return await fn(server.address().port)}finally{
  server.closeAllConnections?.();
  await new Promise(resolve=>server.close(()=>resolve()));
 }
}
function request(port,path,{method='GET',headers={},body}={}){
 return new Promise((resolve,reject)=>{
  const req=http.request({hostname:'127.0.0.1',port,path,method,headers},res=>{
   let data='';res.setEncoding('utf8');res.on('data',chunk=>data+=chunk);res.on('end',()=>resolve({status:res.statusCode,text:data,json:()=>JSON.parse(data)}));
  });
  req.on('error',reject);if(body)req.write(body);req.end();
 });
}

test('Replit preview mode binds requests to the exact configured HTTPS host and origin',async()=>{
 const previewHost='casebrief-demo.replit.dev';
 const server=createServer({previewHost,reviewDbPath:':memory:'});
 await withServer(server,async port=>{
  const health=await request(port,'/api/health',{headers:{host:previewHost}});
  assert.equal(health.status,200);const main=await request(port,'/',{headers:{host:previewHost}});assert.equal(main.status,200);assert.match(main.text,/data-analysis-host="true"/);
  const session=health.json();
  assert.equal(session.syntheticOnly,true);
  assert.equal(session.umgConfigured,false);
  const wrongHost=await request(port,'/api/health',{headers:{host:'attacker.example'}});
  assert.equal(wrongHost.status,403);
  assert.equal(wrongHost.json().error,'PREVIEW_HOST_REQUIRED');
  const payload=JSON.stringify({syntheticOnly:true,engine:'rules',clientRunId:'preview-origin-negative',documents:[
   {title:'Fictional report',text:'The fictional event occurred at 21:14.'},
   {title:'Fictional statement',text:'The fictional event occurred at 22:19.'}
  ]});
  const wrongOrigin=await request(port,'/api/analyse',{method:'POST',headers:{host:previewHost,origin:'https://attacker.example','content-type':'application/json','x-casebrief-token':session.token},body:payload});
  assert.equal(wrongOrigin.status,403);
  assert.equal(wrongOrigin.json().error,'LOCAL_SESSION_REQUIRED');
  const goodOrigin=await request(port,'/api/analyse',{method:'POST',headers:{host:previewHost,origin:`https://${previewHost}`,'content-type':'application/json','x-casebrief-token':session.token},body:JSON.stringify({...JSON.parse(payload),clientRunId:'preview-origin-positive'})});
  assert.equal(goodOrigin.status,200);
  const result=goodOrigin.json();
  assert.equal(result.status,'PENDING_HUMAN_REVIEW');
  assert.equal(result.umg.status,'NOT_CONFIGURED');
  assert.ok(result.result.findings.every(f=>f.reviewState==='HUMAN_REVIEW_REQUIRED'));
 });
});

test('Replit preview configuration rejects malformed hosts and production mode',()=>{
 assert.throws(()=>createServer({previewHost:'https://attacker.example'}),/Invalid or unsafe Replit preview host/);
 const prior=process.env.NODE_ENV;
 process.env.NODE_ENV='production';
 try{assert.throws(()=>createServer({previewHost:'casebrief-demo.replit.dev'}),/Invalid or unsafe Replit preview host/);}
 finally{if(prior===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=prior;}
});
