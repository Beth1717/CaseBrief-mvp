const assert=require('node:assert/strict');
const c=require('../umg-runtime-contract.js');

const allowed=c.buildRequest({
 requestId:'req-001',correlationId:'corr-001',auditId:'audit-001',
 actor:{id:'attorney-demo',role:'Lead attorney'},tenantId:'tenant-synth',matterId:'SYN-ID-PRETRIAL-001',
 operation:'PLAN_ONLY',authorizationDecision:true,
 sources:[{id:'S01',locator:'document:S01#excerpt',extract:'synthetic excerpt'}],
 expectedRecords:[{recordId:'LAB-E02',status:'not_provided'}],
 candidateFindings:[{id:'PF-TIMING',sourceIds:['S01']}]
});
assert.equal(c.validateRequest(allowed).valid,true);
assert.equal(allowed.externalEffectsAllowed,false);
assert.equal(allowed.requirements.humanReviewRequired,true);

const denied=c.buildRequest({
 requestId:'req-002',correlationId:'corr-002',auditId:'audit-002',
 actor:{id:'client-demo'},tenantId:'tenant-synth',matterId:'SYN-ID-PRETRIAL-001',
 operation:'READ_ONLY_ANALYSIS',authorizationDecision:false,
 sources:[{id:'S06',locator:'document:S06',extract:'must not forward'}],
 expectedRecords:[{recordId:'SECRET'}],candidateFindings:[{id:'secret'}]
});
assert.deepEqual(denied.sources,[]);
assert.deepEqual(denied.expectedRecords,[]);
assert.deepEqual(denied.candidateFindings,[]);
assert.equal(c.validateRequest(denied).valid,true);

const good={
 contractVersion:c.CONTRACT_VERSION,requestId:allowed.requestId,correlationId:allowed.correlationId,status:'SUCCEEDED',
 result:{acceptedCandidateFindings:[{id:'x',sourceIds:['S01']}],quarantinedFindings:[],unresolvedItems:[],expectationStates:[],citations:[]},
 runtime:{executed:true,build:'synthetic-test',traceRef:'trace-001'},audit:{summary:'synthetic'},effects:{dispatchCount:0}
};
assert.equal(c.validateResponse(good,allowed).valid,true);

const effectful=structuredClone(good);effectful.effects.dispatchCount=1;
assert.equal(c.validateResponse(effectful,allowed).valid,false);
const leaked=structuredClone(good);leaked.result.acceptedCandidateFindings[0].sourceIds=['S06'];
assert.equal(c.validateResponse(leaked,allowed).valid,false);
const cot=structuredClone(good);cot.chainOfThought='not accepted';
assert.equal(c.validateResponse(cot,allowed).valid,false);

const fallback=c.localFallback(allowed);
assert.equal(fallback.status,'FALLBACK');
assert.equal(fallback.effects.dispatchCount,0);
assert.equal(fallback.runtime.executed,false);

console.log('PASS UMG draft contract: host attestation, deny-without-payload, zero effects, source-bound response validation and local fallback.');
console.log('SCOPE: contract-development only; no real NeoUMG runtime, hosted endpoint or confidential case data.');
