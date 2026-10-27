const assert=require('node:assert/strict');
const {scorecard}=require('../scripts/pilot-scorecard.cjs');
const template=require('../readiness/pilot-evaluation-template.json');
const empty=scorecard(template);
assert.equal(empty.status,'not_measured');assert.equal(empty.findings.precision,null);assert.equal(empty.findings.recall,null);assert.equal(empty.timing.reductionFraction,null);
const measured={...structuredClone(template),adjudication:{status:'reviewed',reviewerId:'synthetic-test-reviewer',reviewedAt:'2026-10-21T12:00:00Z'},observations:[
 {id:'a',kind:'finding',expected:true,detected:true,basis:'test'},
 {id:'b',kind:'finding',expected:false,detected:true,basis:'test'},
 {id:'c',kind:'finding',expected:true,detected:false,basis:'test'},
 {id:'d',kind:'missing_record',expected:false,detected:false,basis:'test'}
],sessions:[{id:'s1',packetId:'test-only',reviewerId:'synthetic-test-reviewer',baselineMinutes:10,assistedMinutes:15}]};
const scored=scorecard(measured);
assert.equal(scored.findings.precision,.5);assert.equal(scored.findings.recall,.5);assert.equal(scored.missingRecords.recall,null);assert.equal(scored.timing.savedMinutes,-5);assert.equal(scored.timing.reductionFraction,-.5);
for(const mutate of [x=>x.adjudication.status='pending',x=>x.adjudication.reviewerId='',x=>x.syntheticOnly=false,x=>x.observations.push(x.observations[0]),x=>x.observations[0].detected='yes',x=>x.sessions[0].baselineMinutes=0,x=>x.sessions.push(x.sessions[0])]){const bad=structuredClone(measured);mutate(bad);assert.throws(()=>scorecard(bad))}
console.log('PASS pilot scorecard: absent measurements stay null, false positives/misses count, slowdown retained, invalid/unadjudicated/duplicate data rejected.');
