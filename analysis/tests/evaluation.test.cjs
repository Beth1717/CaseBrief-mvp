const {test}=require('node:test'),assert=require('node:assert/strict');
const {evaluatePackets}=require('../../scripts/evaluate-analysis.cjs');
test('fictional controls run on actual engine without draft ground truth leaking into provider',async()=>{
 const report=await evaluatePackets();
 assert.equal(report.legalAccuracy,null);assert.equal(report.precision,null);assert.ok(report.rows.length>=13);
 assert.equal(report.rows.find(r=>r.packetId==='explicit-time-conflict-v1').proposals.length,1);
 for(const id of ['explicit-consistent-v1','different-dates-v1','unsupported-allegation-v1','exculpatory-lab-v1']){
  const row=report.rows.find(r=>r.packetId===id);assert.equal(row.status,'NEEDS_INPUT');assert.equal(row.proposals.length,0);assert.equal(row.expectedFindings,null);
 }
 assert.equal(report.rows.find(r=>r.packetId==='restricted-source-v1').status,'NOT_RUN');
 assert.ok(report.rows.every(r=>r.adjudication.status==='pending'));
 const provider={id:'fixture-input-probe',run:async sources=>{assert.ok(sources.every(s=>!('draftReviewQuestions' in s)));return {status:'NEEDS_INPUT',findings:[]}}};
 await evaluatePackets({provider});
});
