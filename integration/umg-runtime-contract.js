// CaseBrief x UMG draft Record Consistency contract.
// Contract-development only: synthetic/local, zero effect dispatch, no live NeoUMG claim.
(function(root){
 const CONTRACT_VERSION='casebrief.umg.record-consistency.v0.1-draft';
 const ALLOWED_STATUSES=new Set(['SUCCEEDED','DENIED','BLOCKED','NEEDS_INPUT','ERROR','FALLBACK']);
 function nonempty(v,name){if(typeof v!=='string'||!v.trim())throw new Error(name+' is required');return v.trim()}
 function array(v,name){if(!Array.isArray(v))throw new Error(name+' must be an array');return v}
 function clone(v){return JSON.parse(JSON.stringify(v))}
 function buildRequest(input){
  input=input||{};
  const request={
   contractVersion:CONTRACT_VERSION,
   requestId:nonempty(input.requestId,'requestId'),
   correlationId:nonempty(input.correlationId,'correlationId'),
   auditId:nonempty(input.auditId,'auditId'),
   host:{
    actor:clone(input.actor||{}),
    tenantId:nonempty(input.tenantId,'tenantId'),
    matterId:nonempty(input.matterId,'matterId'),
    operation:nonempty(input.operation||'READ_ONLY_ANALYSIS','operation'),
    authorization:{decision:input.authorizationDecision===true?'ALLOW':'DENY',verifiedBy:'CaseBrief'}
   },
   sources:array(input.sources||[],'sources').map(s=>({
    id:nonempty(s.id,'source.id'),
    locator:s.locator==null?null:String(s.locator),
    extract:s.extract==null?'':String(s.extract)
   })),
   sleeve:{id:nonempty(input.sleeveId||'SLV.CASEBRIEF.LEGALANALYSIS.v0.1','sleeveId'),revision:Number(input.sleeveRevision||1)},
   expectedRecords:clone(input.expectedRecords||[]),
   candidateFindings:clone(input.candidateFindings||[]),
   requirements:{citationsRequired:true,humanReviewRequired:true},
   externalEffectsAllowed:false
  };
  if(request.host.authorization.decision!=='ALLOW'){
   request.sources=[];request.expectedRecords=[];request.candidateFindings=[];
  }
  return request;
 }
 function validateRequest(request){
  const errors=[];
  try{nonempty(request?.requestId,'requestId');nonempty(request?.correlationId,'correlationId');nonempty(request?.auditId,'auditId');}catch(e){errors.push(e.message)}
  if(request?.externalEffectsAllowed!==false)errors.push('externalEffectsAllowed must be false');
  if(!['READ_ONLY_ANALYSIS','PLAN_ONLY'].includes(request?.host?.operation))errors.push('operation must be READ_ONLY_ANALYSIS or PLAN_ONLY');
  if(!['ALLOW','DENY'].includes(request?.host?.authorization?.decision))errors.push('authorization decision invalid');
  if(request?.host?.authorization?.decision==='DENY'&&(request.sources?.length||request.expectedRecords?.length||request.candidateFindings?.length))errors.push('denied requests must not carry protected matter payload');
  if(!Array.isArray(request?.sources))errors.push('sources must be an array');
  return {valid:errors.length===0,errors};
 }
 function validateResponse(response,request){
  const errors=[];
  if(!ALLOWED_STATUSES.has(response?.status))errors.push('status is not allowed');
  if(response?.effects?.dispatchCount!==0)errors.push('effects.dispatchCount must equal 0');
  if(response&&('chainOfThought'in response||'reasoning'in response&&typeof response.reasoning==='string'&&response.reasoning.length>2000))errors.push('private reasoning payload is not accepted');
  const sourceIds=new Set((request?.sources||[]).map(s=>s.id));
  for(const groupName of ['acceptedCandidateFindings','quarantinedFindings']){
   const group=response?.result?.[groupName]||[];
   if(!Array.isArray(group)){errors.push(groupName+' must be an array');continue}
   for(const finding of group){
    for(const ref of finding.sourceIds||[])if(!sourceIds.has(ref))errors.push(groupName+' references unauthorized source '+ref);
   }
  }
  return {valid:errors.length===0,errors};
 }
 function localFallback(request,reason='UMG runtime unavailable'){
  const v=validateRequest(request);
  return {
   contractVersion:CONTRACT_VERSION,
   requestId:request?.requestId||null,
   correlationId:request?.correlationId||null,
   status:v.valid?'FALLBACK':'BLOCKED',
   result:{acceptedCandidateFindings:[],quarantinedFindings:[],unresolvedItems:[],expectationStates:[],citations:[]},
   runtime:{executed:false,build:null,traceRef:null},
   audit:{summary:reason,validationErrors:v.errors},
   effects:{dispatchCount:0}
  };
 }
 const api={CONTRACT_VERSION,ALLOWED_STATUSES:[...ALLOWED_STATUSES],buildRequest,validateRequest,validateResponse,localFallback};
 root.CaseBriefUMGContract=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
