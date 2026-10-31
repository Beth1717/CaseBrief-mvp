'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {randomBytes,randomUUID,timingSafeEqual}=require('node:crypto');
const {buildRequest,invokeLocal}=require('../integration/umg-runtime-rev2.cjs');
const {analyse,rulesProvider,hash,AnalysisError}=require('./engine.cjs');
const {createOllamaProvider}=require('./ollama.cjs');
const ROOT=path.resolve(__dirname,'..');
const demoFiles=new Set(['index.html',...fs.readdirSync(ROOT).filter(name=>/\.(js|css)$/.test(name)),'integration/host-controls.js']);
const allowed=new Map([['/analysis/', ['analysis/workbench.html','text/html']],['/analysis/workbench.js',['analysis/workbench.js','text/javascript']],['/analysis/workbench.css',['analysis/workbench.css','text/css']]]);
function createServer({model=process.env.CASEBRIEF_OLLAMA_MODEL,modelEndpoint=process.env.CASEBRIEF_OLLAMA_ENDPOINT,umgEndpoint=process.env.CASEBRIEF_UMG_ENDPOINT}={}){
 const token=randomBytes(32).toString('hex'),records=new Map();let active=0;
 const server=http.createServer(async(req,res)=>{
  const origin=`http://127.0.0.1:${server.address().port}`;
  const send=(status,data)=>{if(res.destroyed)return;res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data))};
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  if(req.headers.host!==new URL(origin).host)return send(403,{error:'LOOPBACK_HOST_REQUIRED'});
  const route=req.url;
  if(req.method==='GET'){
   const demoPath=route==='/'?'index.html':route.split('?')[0].slice(1);
   if(demoFiles.has(demoPath)){
    res.setHeader('Content-Security-Policy',"default-src 'self' blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const mime=demoPath.endsWith('.html')?'text/html':demoPath.endsWith('.css')?'text/css':'text/javascript';
    res.writeHead(200,{'content-type':mime,'cache-control':'no-store'});
    return res.end(fs.readFileSync(path.join(ROOT,demoPath)));
   }
  }
  if(req.method==='GET'&&allowed.has(route)){
   const [name,mime]=allowed.get(route);res.writeHead(200,{'content-type':mime,'cache-control':'no-store'});return res.end(fs.readFileSync(path.join(ROOT,name)));
  }
  if(req.method==='GET'&&route==='/api/health')return send(200,{syntheticOnly:true,token,modelConfigured:!!model,model:model||null,umgConfigured:!!umgEndpoint,storedInvocations:records.size});
  if(req.method!=='POST'||!['/api/analyse','/api/review'].includes(route))return send(404,{error:'NOT_FOUND'});
  const provided=req.headers['x-casebrief-token'];
  if(req.headers.origin!==origin||req.headers['content-type']!=='application/json'||typeof provided!=='string'||!/^[0-9a-f]{64}$/.test(provided)||!timingSafeEqual(Buffer.from(provided),Buffer.from(token)))return send(403,{error:'LOCAL_SESSION_REQUIRED'});
  if(active>=2)return send(429,{error:'BUSY'});
  active++;let size=0;const chunks=[];let timer;
  try{
   const input=await new Promise((resolve,reject)=>{
    timer=setTimeout(()=>{reject(new AnalysisError('REQUEST_TIMEOUT'));req.destroy()},10000);
    req.on('data',chunk=>{size+=chunk.length;if(size>64000){reject(new AnalysisError('REQUEST_TOO_LARGE'));req.destroy()}else chunks.push(chunk)});
    req.on('end',()=>{clearTimeout(timer);try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(new AnalysisError('INVALID_JSON'))}});
    req.on('error',()=>reject(new AnalysisError('REQUEST_INTERRUPTED')));
   });
   if(route==='/api/review'){
    const row=records.get(input.invocationId);
    if(!row||!Number.isInteger(input.version)||input.version!==row.version||!row.result.findings.some(f=>f.findingId===input.findingId)||!['CONFIRMED','DISMISSED','REOPENED'].includes(input.action)||typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>1000)throw new AnalysisError('INVALID_REVIEW_OR_STALE_VERSION');
    // Local explicit user event only; no attorney qualification is implied.
    if(row.events.length>=100)throw new AnalysisError('REVIEW_HISTORY_LIMIT');
    row.events.push({at:new Date().toISOString(),actor:'local-workbench-user',findingId:input.findingId,action:input.action,reason:input.reason.trim()});row.version++;
    return send(200,{version:row.version,events:row.events});
   }
   if(input.syntheticOnly!==true||!['rules','ollama'].includes(input.engine)||!Array.isArray(input.documents)||input.documents.length<2||input.documents.length>12)throw new AnalysisError('FICTIONAL_DOCUMENTS_REQUIRED');
   if(records.size>=100)throw new AnalysisError('LOCAL_SESSION_FULL_RESTART_TO_CLEAR');
   const matterId='fictional-'+randomUUID(),now=Date.now();
   const sources=input.documents.map((doc,i)=>{
    if(typeof doc.text!=='string'||!doc.text.trim()||typeof doc.title!=='string'||!doc.title.trim()||doc.title.length>120)throw new AnalysisError('INVALID_DOCUMENT');
    return {sourceId:'source-'+(i+1),matterId,kind:'fictional_text',locator:'synthetic:source-'+(i+1),extract:doc.text,contentHash:hash(doc.text),reviewedByHost:true};
   });
   const request=buildRequest({syntheticOnly:true,hostContext:{host:'CaseBrief',tenantId:'local-synthetic-workbench',matterId,operation:'record_consistency_review',actor:{id:'local-workbench-user',type:'human',role:'case_owner_lead_attorney',verifiedByHost:true},authorization:{decisionId:randomUUID(),status:'ALLOW',scopes:['case_view','ai_use'],authority:'CaseBrief',expiresAt:new Date(now+120000).toISOString()}},sources});
   const provider=input.engine==='rules'?rulesProvider():createOllamaProvider({model,endpoint:modelEndpoint});
   const result=await analyse(request,{provider});
   let umg={status:'NOT_RUN',reason:'No UMG endpoint configured. Findings are CaseBrief analysis proposals; UMG has not approved them.'};
   if(umgEndpoint){
    const candidateFindings=result.findings.map(f=>({findingId:f.findingId,category:f.category,statement:f.statement,sourceIds:f.sourceRefs}));
    const wireRequest={...request,candidateFindings};
    const response=await invokeLocal(wireRequest,{endpoint:umgEndpoint});
    umg={status:response.status,runtime:response.runtime,acceptedCount:response.result.acceptedFindings.length,quarantinedCount:response.result.quarantinedFindings.length,errorCode:response.error?.code||null,reason:'The supplied UMG service validates a pinned synthetic configuration. Fresh findings may be quarantined; a compiler receipt does not establish factual correctness.'};
   }
   // No authoritative case mutation. Receipts are mutable memory snapshots until durable backend work lands.
   const row={result,umg,events:[],version:0};records.set(result.invocationId,row);
   send(200,{...row,documents:input.documents.map((doc,i)=>({sourceId:sources[i].sourceId,title:doc.title}))});
  }catch(e){send(400,{error:e instanceof AnalysisError?e.code:'ANALYSIS_FAILED'})}finally{clearTimeout(timer);active--}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;server.maxConnections=12;
 return server;
}
if(require.main===module){
 const port=Number(process.env.CASEBRIEF_ANALYSIS_PORT||8780);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid local port');
 const server=createServer();server.listen(port,'127.0.0.1',()=>console.log(`CaseBrief fictional document workbench: http://127.0.0.1:${port}/analysis/`));
}
module.exports={createServer};
