'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {randomBytes}=require('node:crypto');
const adapter=require('../integration/umg-runtime-rev2.cjs');
const {buildRequest,invokeLocal}=adapter;
const {analyse,rulesProvider,hash,AnalysisError}=require('./engine.cjs');
const {createOllamaProvider}=require('./ollama.cjs');
const {PersistentAnalysisReview}=require('./persistent-review.cjs');
const ROOT=path.resolve(__dirname,'..');
const demoFiles=new Set(['index.html',...fs.readdirSync(ROOT).filter(name=>/\.(js|css)$/.test(name)),'integration/host-controls.js']);
const allowed=new Map([['/analysis/', ['analysis/workbench.html','text/html']],['/analysis/workbench.js',['analysis/workbench.js','text/javascript']],['/analysis/workbench.css',['analysis/workbench.css','text/css']]]);
function createServer({model=process.env.CASEBRIEF_OLLAMA_MODEL,modelEndpoint=process.env.CASEBRIEF_OLLAMA_ENDPOINT,umgEndpoint=process.env.CASEBRIEF_UMG_ENDPOINT,reviewDbPath=process.env.CASEBRIEF_REVIEW_DB||path.join(ROOT,'readiness','results','casebrief-synthetic-review.sqlite')}={}){
 if(reviewDbPath!==':memory:')fs.mkdirSync(path.dirname(path.resolve(reviewDbPath)),{recursive:true});
 const sessionTokens=new Map(),reviewHost=new PersistentAnalysisReview({filename:reviewDbPath,syntheticOnly:true});let active=0;
 const issueSessionToken=()=>{const now=Date.now();for(const [key,expiry] of sessionTokens)if(expiry<=now)sessionTokens.delete(key);const value=randomBytes(32).toString('hex');sessionTokens.set(value,now+30*60*1000);while(sessionTokens.size>100)sessionTokens.delete(sessionTokens.keys().next().value);return value;};
 const server=http.createServer(async(req,res)=>{
  const origin=`http://127.0.0.1:${server.address().port}`;
  const send=(status,data)=>{if(res.destroyed)return;res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data))};
  const localSession=()=>{const provided=req.headers['x-casebrief-token'],expiry=sessionTokens.get(provided);if(!expiry||expiry<=Date.now()){if(expiry)sessionTokens.delete(provided);return false}return (!req.headers.origin||req.headers.origin===origin)&&typeof provided==='string'&&/^[0-9a-f]{64}$/.test(provided)};
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  if(req.headers.host!==new URL(origin).host)return send(403,{error:'LOOPBACK_HOST_REQUIRED'});
  const route=req.url.split('?')[0];
  if(req.method==='GET'){
   const demoPath=route==='/'?'index.html':route.slice(1);
   if(demoFiles.has(demoPath)){
    res.setHeader('Content-Security-Policy',"default-src 'self' blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const mime=demoPath.endsWith('.html')?'text/html':demoPath.endsWith('.css')?'text/css':'text/javascript';
    res.writeHead(200,{'content-type':mime,'cache-control':'no-store'});return res.end(fs.readFileSync(path.join(ROOT,demoPath)));
   }
  }
  if(req.method==='GET'&&allowed.has(route)){
   const [name,mime]=allowed.get(route);res.writeHead(200,{'content-type':mime,'cache-control':'no-store'});return res.end(fs.readFileSync(path.join(ROOT,name)));
  }
  if(req.method==='GET'&&route==='/api/health')return send(200,{syntheticOnly:true,token:issueSessionToken(),modelConfigured:!!model,model:model||null,umgConfigured:!!umgEndpoint,storedInvocations:reviewHost.list().length,persistence:'LOCAL_SQLITE_SYNTHETIC_ONLY',productionAuthentication:false});
  if(req.method==='GET'&&route==='/api/reviews'){
   if(!localSession())return send(403,{error:'LOCAL_SESSION_REQUIRED'});return send(200,{reviews:reviewHost.list(req.headers['x-casebrief-token'])});
  }
  if(req.method==='GET'&&route.startsWith('/api/reviews/')){
   if(!localSession())return send(403,{error:'LOCAL_SESSION_REQUIRED'});
   try{return send(200,asWorkbenchRow(reviewHost.get(decodeURIComponent(route.slice('/api/reviews/'.length)),req.headers['x-casebrief-token'])))}catch(e){return send(404,{error:e.message||'INVOCATION_NOT_FOUND'})}
  }
  if(req.method!=='POST'||!['/api/analyse','/api/review','/api/invalidate'].includes(route))return send(404,{error:'NOT_FOUND'});
  if(req.headers.origin!==origin||req.headers['content-type']!=='application/json'||!localSession())return send(403,{error:'LOCAL_SESSION_REQUIRED'});
  if(active>=2)return send(429,{error:'BUSY'});
  active++;let size=0;const chunks=[];let timer;
  try{
   const input=await new Promise((resolve,reject)=>{
    timer=setTimeout(()=>{reject(new AnalysisError('REQUEST_TIMEOUT'));req.destroy()},10000);
    req.on('data',chunk=>{size+=chunk.length;if(size>64000){reject(new AnalysisError('REQUEST_TOO_LARGE'));req.destroy()}else chunks.push(chunk)});
    req.on('end',()=>{clearTimeout(timer);try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(new AnalysisError('INVALID_JSON'))}});
    req.on('error',()=>reject(new AnalysisError('REQUEST_INTERRUPTED')));
   });
   if(route==='/api/invalidate')return send(200,reviewHost.invalidateClientRun(input.clientRunId,req.headers['x-casebrief-token']));
   if(route==='/api/review'){
    const updated=reviewHost.review({...input,sessionToken:req.headers['x-casebrief-token']});const row=reviewHost.get(input.invocationId,req.headers['x-casebrief-token']);
    return send(200,{version:row.version,events:row.events,findings:row.findings,hostAudit:row.hostAudit});
   }
   if(input.syntheticOnly!==true||!['rules','ollama'].includes(input.engine)||!Array.isArray(input.documents)||input.documents.length<2||input.documents.length>12||typeof input.clientRunId!=='string'||!input.clientRunId)throw new AnalysisError('FICTIONAL_DOCUMENTS_REQUIRED');
   const matterId='fictional-'+require('node:crypto').randomUUID(),now=Date.now();
   const sources=input.documents.map((doc,i)=>{
    if(typeof doc.text!=='string'||!doc.text.trim()||Buffer.byteLength(doc.text)>20000||typeof doc.title!=='string'||!doc.title.trim()||doc.title.length>120)throw new AnalysisError('INVALID_DOCUMENT');
    return {sourceId:'source-'+(i+1),matterId,kind:'fictional_text',locator:'synthetic:source-'+(i+1),extract:doc.text,contentHash:hash(doc.text),reviewedByHost:true};
   });
   const request=buildRequest({syntheticOnly:true,hostContext:{host:'CaseBrief',tenantId:'local-synthetic-workbench',matterId,operation:'record_consistency_review',actor:{id:'local-workbench-user',type:'human',role:'case_owner_lead_attorney',verifiedByHost:true},authorization:{decisionId:require('node:crypto').randomUUID(),status:'ALLOW',scopes:['case_view','ai_use'],authority:'CaseBrief',expiresAt:new Date(now+120000).toISOString()}},sources});
   const provider=input.engine==='rules'?rulesProvider():createOllamaProvider({model,endpoint:modelEndpoint});
   const result=await analyse(request,{provider});
   if(reviewHost.invalidatedRuns.has(input.clientRunId))throw new AnalysisError('STALE_CLIENT_RUN');
   const candidateFindings=result.findings.map(f=>({findingId:f.findingId,category:f.category,statement:f.statement,sourceIds:f.sourceRefs}));
   const hostRequest={...request,candidateFindings};
   const requestCheck=adapter.validateRequest(hostRequest);if(!requestCheck.valid)throw new AnalysisError('INVALID_HOST_REQUEST');
   reviewHost.begin({request:hostRequest,analysisResult:result,documents:input.documents,clientRunId:input.clientRunId,sessionToken:req.headers['x-casebrief-token']});
   let umg={status:'NOT_CONFIGURED',acceptedCount:0,quarantinedCount:0,dispatchCount:0,reason:'No UMG endpoint configured. These are CaseBrief proposals only; UMG has not validated them.'},responseDigest=null,errorCode=null;
   if(umgEndpoint){
    try{
     const response=await invokeLocal(hostRequest,{endpoint:umgEndpoint});
     const validation=adapter.validateResponse(response,hostRequest);
     if(!validation.valid)throw new AnalysisError('INVALID_UMG_RESPONSE');
     responseDigest=hash(JSON.stringify(response));
     umg={status:response.status,acceptedCount:response.result.acceptedFindings.length,quarantinedCount:response.result.quarantinedFindings.length,dispatchCount:response.effects.dispatchCount,runtime:response.runtime,
      quarantinedFindings:response.result.quarantinedFindings.map(f=>({findingId:f.findingId,reason:f.quarantineReason||'UMG policy quarantine'})),
      reason:response.result.quarantinedFindings.length?'UMG completed the supported governance operation but quarantined one or more fresh findings. CaseBrief proposals remain separate and require human review; this is not UMG semantic validation.':'UMG response passed the revision-2 response validator. This is not attorney approval.'};
     if(response.status!=='SUCCEEDED')errorCode='UMG_'+response.status;
    }catch(e){errorCode=e instanceof AnalysisError?e.code:'UMG_TRANSPORT_OR_VALIDATION_FAILED';umg={status:'ERROR',acceptedCount:0,quarantinedCount:0,dispatchCount:0,errorCode,errorDetail:String(e.message||e).slice(0,240),reason:'UMG did not return a validated promotable response. No UMG findings were accepted.'}}
   }
   const completed=reviewHost.complete(result.invocationId,{umg,responseDigest,errorCode});
   const row=reviewHost.get(result.invocationId,req.headers['x-casebrief-token']);
   return send(200,asWorkbenchRow(row));
  }catch(e){return send(e instanceof AnalysisError?400:409,{error:e.code||e.message||'ANALYSIS_FAILED'})}finally{clearTimeout(timer);active--}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;server.maxConnections=12;server.reviewHost=reviewHost;server.on('close',()=>reviewHost.close());
 return server;
}
function asWorkbenchRow(record){
 const result={...record.analysis,invocationId:record.id,findings:record.findings||[]};
 return {result,umg:record.umg,events:record.events||[],decisions:record.decisions||[],version:record.revision,readOnly:record.readOnly===true,hostAudit:record.hostAudit||[],sourceSnapshotDigest:record.sourceSnapshotDigest,documents:record.documents||[],status:record.status,errorCode:record.errorCode};
}
if(require.main===module){
 const port=Number(process.env.CASEBRIEF_ANALYSIS_PORT||8780);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid local port');
 const server=createServer();server.listen(port,'127.0.0.1',()=>console.log(`CaseBrief fictional document workbench: http://127.0.0.1:${port}/analysis/`));
}
module.exports={createServer,asWorkbenchRow};
