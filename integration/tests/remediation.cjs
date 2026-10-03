const assert = require('node:assert/strict');
const fs = require('node:fs');
const boot = require('./helpers/host.cjs');
const checkFixture = require('./helpers/fixture-contract.cjs');
const first = boot();
first.run("workspace.active='matter-002'; persist()");
const host = boot({persisted:first.stored()});
assert.equal(host.run('data.matter.id'), 'matter-001');
assert.equal(host.run('workspace.active'), 'matter-001');
assert.equal(host.run("workspace.events.some(e=>e.action==='access.denied'&&e.matterId==='matter-002'&&e.details.phase==='before_hydration'&&e.actor.id==='demo-reviewer')"), true);
assert.equal(host.run("workspace.events.some(e=>e.action==='access.fallback'&&e.details.authority==='CaseBrief'&&e.details.fallbackMatterId==='matter-001')"), true);
console.log('PASS persisted matter-002 denied before hydration; CaseBrief authorizes and audits fallback');
host.run("data=workspace.cases['matter-002']");
assert.equal(host.run('runConsistency().status'), 'blocked');
assert.equal(host.run("workspace.events.some(e=>e.action==='analysis.blocked'&&e.details.authorization==='denied')"), true);
assert.equal(host.run("workspace.events.some(e=>e.action==='analysis.guard_applied')"), false);
console.log('PASS independent pre-analysis authorization blocks unauthorized context without analysis');
const working = boot();
const {run} = working;
const states = ['lost','destroyed','unavailable','unknown','pending','',null,{},[],42,true,'new-unseen-state','not provided','Provided','provided later'];
for (const status of states) {
 run(`data.evidence=[{recordId:'BC-1841-A',status:${JSON.stringify(status)}}]`);
 assert.equal(run('runConsistency().expectations[0].status'), 'not_provided', JSON.stringify(status));
}
assert.equal(run('JSON.stringify(caseBriefHostControls.affirmativeProvisionStates)'), '["provided"]');
run("data.evidence=[{recordId:'BC-1841-A',name:'renamed',status:'provided'}]");
assert.equal(run('runConsistency().expectations[0].status'), 'provided');
run("data.evidence=[{name:'Body-camera BC-1841-A',status:'provided'}]");
assert.equal(run('runConsistency().expectations[0].status'), 'not_provided');
console.log(`PASS status matrix: ${states.length} adverse/malformed/unknown states unresolved; exact provided accepted by stable recordId only`);
for (const [action,status] of [['resolve','resolved_by_human_review'],['dismiss','dismissed_by_human_review']]) {
 run(`decideExpectation('expectation-bc-1841-a','${action}','Reviewed source packet',['doc-8'])`);
 assert.equal(run('runConsistency().expectations[0].status'), status);
 assert.equal(run(`workspace.events.some(e=>e.action==='expectation.human_decision'&&e.actor.id==='demo-reviewer'&&e.matterId==='matter-001'&&e.details.action==='${action}'&&e.details.status==='${status}'&&e.details.reason&&e.details.timestamp&&e.details.expectationId&&e.details.basisSourceIds.includes('doc-1')&&e.details.contextReferences.includes('doc-8'))`),true);
}
const reload = boot({persisted:working.stored()});
assert.equal(reload.run('runConsistency().expectations[0].status'),'dismissed_by_human_review');
run("decideExpectation('expectation-bc-1841-a','reopen','Need production')");
assert.equal(run('runConsistency().expectations[0].status'),'not_provided');
run('data.documents=[]');
assert.equal(run('runConsistency().expectations[0].status'),'coverage_need');
console.log('PASS human resolve/dismiss/reopen transitions, persistent decisions, complete distinct audit history, coverage need');
const fixture = JSON.parse(fs.readFileSync('integration/fixtures/record-consistency-target.json'));
const control = boot();
checkFixture(control, fixture);
console.log('PASS fixture/control contract: executable authorization for every actor/matter, expected records/basis, trusted source sets');
const mutant = boot({transformScript(file, source) {
  if (file !== 'core.js') return source;
  const original = 'function authorizeMatter(identity,id){return ';
  assert.ok(source.includes(original), 'mutation anchor missing');
  return source.replace(original, "function authorizeMatter(identity,id){if(identity?.id==='demo-system'&&id==='matter-002')return true;return ");
}});
assert.equal(mutant.run("caseBriefHostApi.authorizeMatter({id:'demo-system'},'matter-002')"), true);
assert.throws(()=>checkFixture(mutant,fixture), /host authorization drift: demo-system\/matter-002/);
console.log('PASS mutation sensitivity: fixture contract rejects undeclared executable demo-system/matter-002 grant');
