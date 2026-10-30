// Trusted in-process host callbacks with synthetic SQLite state. No HTTP/auth service.
const {createHash}=require('node:crypto');
const adapter=require('../umg-runtime-rev2.cjs');
function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
const digest=value=>createHash('sha256').update(canonical(value)).digest('hex');
function assertScope(scope){for(const field of ['tenantId','matterId','actorId'])if(typeof scope?.[field]!=='string'||!scope[field].trim())throw new Error('HOST_SCOPE_REQUIRED')}
function load(readContext,scope){
 const context=structuredClone(readContext(structuredClone(scope)));
 if(context?.syntheticOnly!==true)throw new Error('SYNTHETIC_HOST_REQUIRED');
 const host=context.hostContext;
 if(host?.tenantId!==scope.tenantId||host?.matterId!==scope.matterId||host?.actor?.id!==scope.actorId)throw new Error('HOST_IDENTITY_MISMATCH');
 const request=adapter.buildRequest({...context,requestId:undefined,correlationId:undefined,auditId:undefined});
 const allowed=host.authorization.status==='ALLOW'&&['case_view','ai_use'].every(s=>host.authorization.scopes.includes(s));
 const snapshot=request.sources.map(source=>{
  const version=context.sourceVersions?.[source.sourceId];
  if(typeof version!=='string'||!version.trim())throw new Error('SOURCE_VERSION_REQUIRED');
  // Keep the revision-2 wire format intact; pin exact host data outside that contract.
  return {sourceId:source.sourceId,version,digest:digest(source)};
 });
 return {context,request,allowed,snapshot,sourceSnapshotDigest:digest(snapshot),contextDigest:digest({host,snapshot,expectedRecords:request.expectedRecords,candidateFindings:request.candidateFindings,mode:request.mode})};
}
function createSyntheticCoordinator({store,readContext,invoke=adapter.invokeLocal}){
 if(!store||typeof readContext!=='function'||typeof invoke!=='function')throw new Error('HOST_DEPENDENCIES_REQUIRED');
 async function run(inputScope){
  assertScope(inputScope);const scope=structuredClone(inputScope),initial=load(readContext,scope),request=initial.request;
  const record={id:request.requestId,tenantId:scope.tenantId,matterId:scope.matterId,actorId:scope.actorId,syntheticOnly:true,status:'RUNNING',revision:0,
   requestDigest:digest(request),sourceSnapshotDigest:initial.sourceSnapshotDigest,sourceSnapshot:initial.snapshot,contextDigest:initial.contextDigest,
   correlationId:request.correlationId,auditId:request.auditId,findings:[],decisions:[],runtime:null,errorCode:null};
  store.create(record); // Do not invoke a runtime unless this audit and invocation persist atomically.
  let response;
  if(!initial.allowed)response=adapter.localFallback(request,'HOST_AUTHORIZATION_REQUIRED','Host did not authorize analysis.');
  else try{response=await invoke(structuredClone(request))}catch{response=adapter.localFallback(request,'TRANSPORT_FAILED','Local runtime did not complete.')}
  return store.update(record.id,scope,current=>{
   if(current.status!=='RUNNING')throw new Error('INVOCATION_ALREADY_COMPLETED');
   let live;
   try{live=load(readContext,scope)}catch{live=null}
   const validation=adapter.validateResponse(response,request);
   let code=null;
   if(!initial.allowed)code='HOST_AUTHORIZATION_REQUIRED';
   else if(!live?.allowed)code='HOST_AUTHORIZATION_CHANGED';
   else if(live.contextDigest!==initial.contextDigest)code='HOST_CONTEXT_CHANGED';
   else if(!validation.valid)code='INVALID_RESPONSE';
   else if(response.status!=='SUCCEEDED')code='RUNTIME_'+response.status;
   const next={...current,revision:1,status:code?'REJECTED':'PENDING_HUMAN_REVIEW',errorCode:code,
    findings:code?[]:response.result.acceptedFindings.map(f=>({...structuredClone(f),reviewState:'HUMAN_REVIEW_REQUIRED'})),
    runtime:code?null:structuredClone(response.runtime),responseDigest:code?null:digest(response)};
   return {record:next,event:code?'result.rejected':'result.pending_review',data:{code,responseDigest:next.responseDigest,sourceSnapshotDigest:current.sourceSnapshotDigest,findingIds:next.findings.map(f=>f.findingId)}};
  });
 }
 function review({scope,id,findingId,decision,reason,expectedRevision}){
  assertScope(scope);
  if(!['confirm','dismiss','reopen'].includes(decision)||typeof reason!=='string'||!reason.trim()||reason.length>4000||!Number.isInteger(expectedRevision))throw new Error('EXPLICIT_REVIEW_REQUIRED');
  return store.update(id,scope,current=>{
   if(current.status!=='PENDING_HUMAN_REVIEW')throw new Error('RESULT_NOT_REVIEWABLE');
   if(current.revision!==expectedRevision)throw new Error('REVIEW_CONFLICT');
   const live=load(readContext,scope);
   if(!live.allowed||!live.context.hostContext.authorization.scopes.includes('review_decisions'))throw new Error('REVIEW_NOT_AUTHORIZED');
   if(live.contextDigest!==current.contextDigest)throw new Error('HOST_CONTEXT_CHANGED');
   const finding=current.findings.find(f=>f.findingId===findingId);if(!finding)throw new Error('UNKNOWN_FINDING');
   const decisionRecord={findingId,decision,reason:reason.trim(),actorId:scope.actorId,decidedAt:new Date().toISOString()};
   finding.reviewState=decision==='confirm'?'CONFIRMED_BY_HUMAN':decision==='dismiss'?'DISMISSED_BY_HUMAN':'HUMAN_REVIEW_REQUIRED';
   current.decisions.push(decisionRecord);current.revision++;
   // Keep the reason in the protected synthetic record, out of the general audit event.
   return {record:current,event:'finding.'+decision,data:{findingId,revision:current.revision,reasonDigest:digest(reason.trim())}};
  });
 }
 function get(scope,id){
  assertScope(scope);
  const live=load(readContext,scope);if(!live.allowed)throw new Error('READ_NOT_AUTHORIZED');
  const record=store.get(id,scope);
  if(live.contextDigest===record.contextDigest&&record.status!=='INVALIDATED')return record;
  if(record.status==='RUNNING')throw new Error('INVOCATION_IN_PROGRESS');
  const invalidated=record.status==='INVALIDATED'?record:store.update(id,scope,current=>({record:{...current,status:'INVALIDATED',revision:current.revision+1,errorCode:'HOST_CONTEXT_CHANGED'},event:'result.invalidated',data:{code:'HOST_CONTEXT_CHANGED'}}));
  // Historical details stay in the host store; stale/revoked source-derived content is not returned.
  return {...invalidated,findings:[],decisions:[],runtime:null,responseDigest:null};
 }
 return {run,review,get};
}
module.exports={createSyntheticCoordinator,digest};
