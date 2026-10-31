'use strict';
const {createHash,randomUUID}=require('node:crypto');
const Ajv=require('ajv');
const {validateRequest}=require('../integration/umg-runtime-rev2.cjs');
const hash=value=>createHash('sha256').update(value).digest('hex');
class AnalysisError extends Error{constructor(code){super(code);this.code=code}}
const fail=code=>{throw new AnalysisError(code)};
const schema={type:'object',additionalProperties:false,required:['status','findings'],properties:{status:{enum:['SUCCEEDED','NEEDS_INPUT']},findings:{type:'array',maxItems:50,items:{type:'object',additionalProperties:false,required:['statement','citations'],properties:{statement:{type:'string',minLength:1,maxLength:2000},citations:{type:'array',minItems:2,maxItems:12,items:{type:'object',additionalProperties:false,required:['sourceId','quote'],properties:{sourceId:{type:'string',maxLength:200},quote:{type:'string',minLength:1,maxLength:4000}}}}}}}}};
const shape=new Ajv({strict:true}).compile(schema);
const forbidden=new Set(['reasoning','chainofthought','privatechainofthought','privatereasoning','hiddenreasoning','rawchainofthought','scratchpad','rawprompt']);
function privateKeys(v){return !!v&&typeof v==='object'&&Object.entries(v).some(([k,x])=>forbidden.has(k.replace(/[^a-z0-9]/gi,'').toLowerCase())||privateKeys(x))}
function authorised(request){
 if(!validateRequest(request).valid)fail('INVALID_HOST_REQUEST');
 const a=request.hostContext.authorization;
 if(a.status!=='ALLOW'||!['case_view','ai_use'].every(s=>a.scopes.includes(s)))fail('AUTHORIZATION_DENIED');
 if(request.mode!=='READ_ONLY_ANALYSIS')fail('UNSUPPORTED_MODE');
 if(!request.sources.length||request.sources.length>12)fail('SOURCE_LIMIT');
 let bytes=0;
 for(const s of request.sources){
  bytes+=Buffer.byteLength(s.extract);
  if(s.reviewedByHost!==true)fail('UNREVIEWED_SOURCE');
  if(s.contentHash!==hash(s.extract))fail('SOURCE_HASH_MISMATCH');
 }
 if(bytes>48000)fail('SOURCE_LIMIT');
}
// Local versioned byte profile. Hashes are never represented as signed authorisation.
function snapshot(request){return hash(JSON.stringify({profile:'casebrief.analysis.snapshot.v1',hostContext:request.hostContext,requestId:request.requestId,correlationId:request.correlationId,sleeve:request.sleeve,sources:request.sources.map(s=>({sourceId:s.sourceId,matterId:s.matterId,locator:s.locator,contentSha256:hash(s.extract)})).sort((a,b)=>a.sourceId.localeCompare(b.sourceId))}))}
function citation(source,quote){
 const start=source.extract.indexOf(quote);
 if(start<0||source.extract.indexOf(quote,start+1)!==-1)fail('MISSING_OR_AMBIGUOUS_QUOTE');
 return {sourceId:source.sourceId,sourceVersionId:'sha256:'+hash(source.extract),contentSha256:hash(source.extract),locator:source.locator,startByte:Buffer.byteLength(source.extract.slice(0,start)),endByte:Buffer.byteLength(source.extract.slice(0,start+quote.length)),quote};
}
async function analyse(request,{provider,currentRequest=()=>request}={}){
 request=structuredClone(request);authorised(request);const bound=snapshot(request);
 if(!provider||typeof provider.run!=='function')fail('PROVIDER_NOT_CONFIGURED');
 const startedAt=new Date().toISOString();
 let raw;try{raw=await provider.run(structuredClone(request.sources))}catch(e){throw e instanceof AnalysisError?e:new AnalysisError('ANALYSIS_UNAVAILABLE')}
 const current=structuredClone(await currentRequest());authorised(current);
 if(snapshot(current)!==bound)fail('STALE_HOST_SNAPSHOT');
 if(privateKeys(raw)||!shape(raw))fail('INVALID_ANALYSIS_OUTPUT');
 const sources=new Map(request.sources.map(s=>[s.sourceId,s]));
 const findings=[],quarantined=[];const seen=new Set();
 for(const candidate of raw.findings){
  try{
   const refs=candidate.citations.map(c=>{const source=sources.get(c.sourceId);if(!source)fail('UNAUTHORIZED_CITATION');return citation(source,c.quote)});
   if(new Set(refs.map(c=>c.sourceId)).size<2)fail('INSUFFICIENT_DISTINCT_SOURCES');
   const key=hash(JSON.stringify({statement:candidate.statement,refs}));if(seen.has(key))continue;seen.add(key);
   findings.push({findingId:'analysis-'+key.slice(0,20),category:'possible_factual_inconsistency',statement:candidate.statement,citations:refs,sourceRefs:[...new Set(refs.map(c=>c.sourceId))],reviewState:'HUMAN_REVIEW_REQUIRED',support:'EXACT_QUOTES_VERIFIED_SEMANTICS_REQUIRE_REVIEW'});
  }catch(e){if(!(e instanceof AnalysisError))throw e;quarantined.push({candidateIndex:raw.findings.indexOf(candidate),reason:e.code})}
 }
 return {schemaVersion:'casebrief.analysis.result.v1',invocationId:randomUUID(),requestId:request.requestId,correlationId:request.correlationId,tenantId:request.hostContext.tenantId,matterId:request.hostContext.matterId,authorizationRef:request.hostContext.authorization.decisionId,snapshotDigest:bound,sourceRefs:request.sources.map(s=>({sourceId:s.sourceId,sourceVersionId:'sha256:'+hash(s.extract),contentSha256:hash(s.extract)})),status:raw.status==='NEEDS_INPUT'||quarantined.length?'NEEDS_INPUT':'SUCCEEDED',findings,quarantined,execution:{provider:provider.id,model:provider.model||null,inference:provider.model?'EXECUTED':'NOT_RUN',startedAt,completedAt:new Date().toISOString()},effects:{dispatchCount:0,executed:[]},limitations:provider.limitations||['Exact quotation checks establish source linkage, not the truth or legal significance of a finding.']};
}
function rulesProvider(){return {id:'casebrief.explicit-time-rules.v1',model:null,limitations:['Limited to explicit 24-hour times for matching event labels in separate documents. No general document understanding or legal analysis. Empty output does not establish consistency.'],async run(sources){
 const facts=[];
 for(const s of sources){
  // Only whole, direct assertions. Source text is never interpreted as executable instructions.
  for(const match of s.extract.matchAll(/(?:^|[.!?\n]\s*)([^.!?\n]*?\b(?:began|started|occurred|happened)\s+at\s+([01]?\d|2[0-3]):([0-5]\d)[^.!?\n]*)(?=[.!?]|$)/gim)){
   const quote=match[1].trim();if(/\b(might|may|possibly|perhaps|around|approximately|not|never|denied|uncertain|unconfirmed|either|or)\b/i.test(quote))continue;
   const event=quote.replace(/\b(?:began|started|occurred|happened)\s+at\s+[\s\S]*$/i,'').replace(/^(?:the|a|an)\s+/i,'').trim().toLowerCase();
   if(!event||event.length>100)continue;
   facts.push({event,time:`${Number(match[2])}:${match[3]}`,sourceId:s.sourceId,quote});
  }
 }
 const findings=[];
 for(let i=0;i<facts.length;i++)for(let j=i+1;j<facts.length;j++){
  const a=facts[i],b=facts[j];if(a.event!==b.event||a.sourceId===b.sourceId||a.time===b.time)continue;
  findings.push({statement:`Possible time discrepancy for ${a.event}: ${a.time} versus ${b.time}. Confirm the event and date refer to the same occurrence.`,citations:[{sourceId:a.sourceId,quote:a.quote},{sourceId:b.sourceId,quote:b.quote}]});
  if(findings.length>=50)break;
 }
 return {status:findings.length?'SUCCEEDED':'NEEDS_INPUT',findings:findings.slice(0,50)};
}}}
module.exports={analyse,rulesProvider,schema,hash,snapshot,AnalysisError,authorised};
