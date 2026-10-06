// Synthetic/local revision-2 adapter. Never imported by the public browser demo.
const Ajv2020=require('ajv/dist/2020');
const http=require('node:http');
const {randomUUID}=require('node:crypto');
const ajv=new Ajv2020({allErrors:true,strict:false});
const requestSchema=require('./runtime-contract-v2/schemas/record-consistency-request.schema.json');
const responseSchema=require('./runtime-contract-v2/schemas/record-consistency-response.schema.json');
const requestShape=ajv.compile(requestSchema),responseShape=ajv.compile(responseSchema);
const clone=v=>structuredClone(v);
const forbidden=new Set(['chainofthought','privatechainofthought','privatereasoning','hiddenreasoning','rawchainofthought']);
function hasPrivateReasoning(value){
 if(!value||typeof value!=='object')return false;
 return Object.entries(value).some(([key,v])=>forbidden.has(key.replaceAll('_','').toLowerCase())||hasPrivateReasoning(v));
}
function shapeErrors(validator,value){return validator(value)?[]:validator.errors.map(e=>`${e.instancePath||'/'} ${e.message}`)}
function validateRequest(request){
 const errors=shapeErrors(requestShape,request);
 if(errors.length)return {valid:false,errors};
 if(request.syntheticOnly!==true)errors.push('this adapter permits synthetic data only');
 const ids=new Set();
 for(const source of request.sources){
  if(source.matterId!==request.hostContext.matterId)errors.push('source/matter mismatch');
  if(ids.has(source.sourceId))errors.push('duplicate source ID');ids.add(source.sourceId);
 }
 for(const expected of request.expectedRecords)if(expected.basisSourceIds.some(id=>!ids.has(id)))errors.push('unauthorised expectation basis');
 if(request.hostContext.authorization.status!=='ALLOW'&&(request.sources.length||request.expectedRecords.length||request.candidateFindings?.length))errors.push('non-ALLOW request contains protected payload');
 const expires=request.hostContext.authorization.expiresAt;
 if(expires!==null&&expires!==undefined&&(!Number.isFinite(Date.parse(expires))||Date.parse(expires)<=Date.now()))errors.push('stale or malformed authorization expiry');
 if(hasPrivateReasoning(request))errors.push('private reasoning payload');
 return {valid:errors.length===0,errors};
}
function buildRequest(input){
 const request={schemaVersion:requestSchema.properties.schemaVersion.const,contractRevision:2,
  requestId:input.requestId||randomUUID(),correlationId:input.correlationId||randomUUID(),auditId:input.auditId||randomUUID(),
  syntheticOnly:input.syntheticOnly===true,mode:input.mode||'READ_ONLY_ANALYSIS',hostContext:clone(input.hostContext),
  sleeve:{id:'SLV.CASEBRIEF.LEGALANALYSIS.v0.1',revision:1,profile:'umg.project-lab.sleeve/1.0'},
  sources:clone(input.sources||[]),expectedRecords:clone(input.expectedRecords||[]),candidateFindings:clone(input.candidateFindings||[]),
  constraints:{externalEffectsAllowed:false,requireCitations:true,requireHumanReview:true}};
 if(input.runtimeRequest)request.runtimeRequest=clone(input.runtimeRequest);
 if(request.hostContext?.authorization?.status!=='ALLOW'){request.sources=[];request.expectedRecords=[];request.candidateFindings=[]}
 const checked=validateRequest(request);if(!checked.valid)throw new Error(checked.errors.join('; '));return request;
}
function validateResponse(response,request){
 const errors=shapeErrors(responseShape,response),validRequest=validateRequest(request);
 errors.push(...validRequest.errors.map(e=>'request: '+e));
 if(errors.length)return {valid:false,errors};
 if(response.requestId!==request.requestId||response.correlationId!==request.correlationId)errors.push('invocation identity mismatch');
 if(response.authorization.matterId!==request.hostContext.matterId)errors.push('response matter mismatch');
 if(response.authorization.decisionId!==request.hostContext.authorization.decisionId)errors.push('authorization decision mismatch');
 if(response.sleeve.id!==request.sleeve.id||response.sleeve.revision!==request.sleeve.revision||response.sleeve.profile!==request.sleeve.profile)errors.push('sleeve identity mismatch');
 if(response.provenance.synthetic!==true)errors.push('non-synthetic response');
 if(hasPrivateReasoning(response))errors.push('private reasoning payload');
 const ids=new Set(request.sources.map(s=>s.sourceId));
 for(const finding of [...response.result.acceptedFindings,...response.result.quarantinedFindings]){
  if(finding.sourceRefs.some(id=>!ids.has(id)))errors.push('unauthorised finding source');
  if(response.result.acceptedFindings.includes(finding)&&(!finding.sourceRefs.length||finding.reviewState==='REVIEWED'))errors.push('accepted result must be cited and remain a human review proposal');
 }
 if(response.provenance.sourceIds.some(id=>!ids.has(id)))errors.push('unauthorised provenance source');
 const expected=new Map(request.expectedRecords.map(e=>[e.expectationId,e]));
 for(const row of response.result.expectations){
  const original=expected.get(row.expectationId);
  if(!original||original.recordId!==row.recordId||row.basisSourceIds.some(id=>!ids.has(id)||!original.basisSourceIds.includes(id)))errors.push('expectation identity or source mismatch');
  // UMG never creates a CaseBrief human disposition merely by returning a status.
  if(['resolved_by_human_review','dismissed_by_human_review'].includes(row.status)&&(!original?.hostDecisionRef||row.decisionRef!==original.hostDecisionRef))errors.push('unattested human expectation decision');
 }
 if(request.hostContext.authorization.status!=='ALLOW'&&response.status!=='DENIED'&&response.status!=='BLOCKED'&&response.status!=='NEEDS_INPUT')errors.push('unauthorised response status');
 if(['DENIED','BLOCKED','ERROR','FALLBACK'].includes(response.status)&&(response.result.acceptedFindings.length||response.result.quarantinedFindings.length||response.result.expectations.length))errors.push('failure response contains analysis payload');
 if(response.status==='SUCCEEDED'&&response.authorization.status!=='ALLOW')errors.push('successful response without authorization');
 if(response.status==='DENIED'&&(response.runtime.compilerExecution!=='NOT_EXECUTED'||response.runtime.frameworkExecution!=='NOT_EXECUTED'))errors.push('denied response claims runtime execution');
 if(response.runtime.compilerExecution==='EXECUTED'||response.runtime.frameworkExecution==='EXECUTED'){
  for(const key of ['compileReceiptId','runtimeSpecDigest','runtimeHash','traceDigest','frameworkRevisionId','frameworkSemanticDigest'])if(typeof response.runtime[key]!=='string'||!response.runtime[key])errors.push('executed runtime missing '+key);
 }
 return {valid:errors.length===0,errors};
}
function localFallback(request,code,message){
 return {schemaVersion:responseSchema.properties.schemaVersion.const,contractRevision:2,requestId:request.requestId,correlationId:request.correlationId,status:request.hostContext.authorization.status==='ALLOW'?'FALLBACK':'BLOCKED',
  authorization:{status:request.hostContext.authorization.status,authority:'CaseBrief',matterId:request.hostContext.matterId,decisionId:request.hostContext.authorization.decisionId},
  sleeve:{id:request.sleeve.id,revision:request.sleeve.revision,profile:request.sleeve.profile},runtime:{serviceProfile:'casebrief.local-adapter',semanticProfile:'h4.compat.v0.1',compilerBuildId:'not-executed',compilerExecution:'NOT_EXECUTED',frameworkExecution:'NOT_EXECUTED',h4CompatibilityQualification:'NOT_RUN',neoUMGLineageQualification:'NOT_RUN'},
  result:{acceptedFindings:[],quarantinedFindings:[],expectations:[],unresolvedItems:[]},effects:{dispatchCount:0,executed:[],proposed:[]},auditEvents:[],provenance:{synthetic:true,sourceIds:[]},error:{code,message,retryable:false}};
}
function invokeLocal(request,{endpoint='http://127.0.0.1:8767/v0.1/record-consistency',timeoutMs=30000}={}){
 // Snapshot before crossing an asynchronous boundary; callers cannot change correlation or grants in flight.
 request=clone(request);
 const checked=validateRequest(request);if(!checked.valid)return Promise.reject(new Error(checked.errors.join('; ')));
 const url=new URL(endpoint);
 if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.username||url.password||url.pathname!=='/v0.1/record-consistency'||url.search||url.hash)throw new Error('only the explicit loopback synthetic endpoint is permitted');
 if(!Number.isInteger(timeoutMs)||timeoutMs<=0||timeoutMs>30000)throw new Error('timeout must be between 1 and 30000 ms');
 if(request.hostContext.authorization.status==='ALLOW'&&(!request.hostContext.authorization.scopes.includes('case_view')||!request.hostContext.authorization.scopes.includes('ai_use')))return Promise.resolve(localFallback(request,'HOST_SCOPE_MISSING','CaseBrief did not grant required analysis scopes.'));
 return new Promise(resolve=>{
  let finished=false,timer;
  const done=value=>{if(finished)return;finished=true;clearTimeout(timer);resolve(value)};
  const body=JSON.stringify(request);
  const call=http.request(url,{method:'POST',headers:{'content-type':'application/json','content-length':Buffer.byteLength(body)}},response=>{
   let raw='',size=0;
   response.on('data',chunk=>{size+=chunk.length;if(size>2*1024*1024){done(localFallback(request,'RESPONSE_TOO_LARGE','Runtime response exceeded the local limit.'));call.destroy()}else raw+=chunk});
   response.on('error',()=>done(localFallback(request,'FRAMEWORK_UNAVAILABLE','Local runtime connection failed.')));
   response.on('end',()=>{
    if(finished)return;
    if(response.statusCode!==200)return done(localFallback(request,'HTTP_ERROR','Local runtime returned an unsuccessful HTTP status.'));
    try{const result=JSON.parse(raw),valid=validateResponse(result,request);done(valid.valid?clone(result):localFallback(request,'INVALID_RESPONSE',valid.errors.join('; ')))}catch{done(localFallback(request,'INVALID_RESPONSE','Local runtime did not return valid JSON.'))}
   });
  });
  timer=setTimeout(()=>{done(localFallback(request,'FRAMEWORK_TIMEOUT','Local runtime exceeded the deadline; late results are not accepted.'));call.destroy()},timeoutMs);
  call.on('error',()=>done(localFallback(request,'FRAMEWORK_UNAVAILABLE','Local runtime connection failed.')));call.end(body);
 });
}
module.exports={buildRequest,validateRequest,validateResponse,localFallback,invokeLocal};
