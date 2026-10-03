const assert = require('node:assert/strict');
const boot = require('./helpers/host.cjs');
const id = 'expectation-bc-1841-a';
const call = action => `decideExpectation('${id}','${action}','Reviewed current sources',['doc-8'])`;

const failures = [
 ['can missing', 'can=undefined'],
 ['can invalid', 'can=42'],
 ['can denies', 'can=()=>false'],
 ['can truthy', 'can=()=>"yes"'],
 ['can async', 'can=()=>Promise.resolve(true)'],
 ['can throws', 'can=()=>{throw new Error("permission unavailable")}'],
 ['record missing', 'record=undefined'],
 ['record invalid', 'record={}'],
 ['record throws', 'record=()=>{throw new Error("audit unavailable")}'],
 ['record no-op', 'record=()=>undefined'],
 ['record fake receipt', 'record=()=>({id:"fake"})'],
 ['record appends then throws', 'const originalRecord=record;record=(...args)=>{originalRecord(...args);throw new Error("audit failed after append")}'],
 ['record appends but denies', 'const originalRecord=record;record=(...args)=>{originalRecord(...args);return false}'],
 ['authorization missing', 'caseBriefHostApi.authorizeMatter=undefined'],
 ['authorization denies', 'caseBriefHostApi.authorizeMatter=()=>false'],
 ['authorization throws', 'caseBriefHostApi.authorizeMatter=()=>{throw new Error("authorization unavailable")}'],
 ['save throws', 'save=()=>{throw new Error("save unavailable")}'],
 ['save fails', 'save=()=>false'],
 ['storage throws', 'localStorage.setItem=()=>{throw new Error("storage unavailable")}']
];
for (const action of ['resolve','dismiss']) {
 for (const [name, setup] of failures) {
  // Check rollback of both an absent decision and a previously accepted decision.
  for (const hasPrior of [false,true]) {
   const host = boot();
   if (hasPrior) assert.ok(host.run(call('resolve')));
   const before = host.run('JSON.stringify({decisions:data.expectationDecisions,events:workspace.events})');
   const stored = host.stored();
   host.run(setup);
   assert.equal(host.run(call(action)), false, `${action}: ${name}`);
   assert.equal(host.run('JSON.stringify({decisions:data.expectationDecisions,events:workspace.events})'), before, `${action}: ${name} changed state/history`);
   assert.equal(host.stored(), stored, `${action}: ${name} changed storage`);
  }
 }
}
console.log(`PASS ${failures.length * 4} capability-failure cases: resolve/dismiss accept zero transitions; state, history, storage preserved`);

const valid = boot();
assert.ok(valid.run(call('resolve')));
const validStored = valid.stored();
const restored = boot({persisted:validStored});
assert.equal(restored.run('runConsistency().expectations[0].status'), 'resolved_by_human_review');
const rejected = [
 ['null decision', (w,d)=>{w.cases['matter-001'].expectationDecisions[id]=null}],
 ['array decision', (w,d)=>{w.cases['matter-001'].expectationDecisions[id]=[]}],
 ['incomplete decision', (w,d)=>{w.cases['matter-001'].expectationDecisions[id]={status:'resolved_by_human_review'}}],
 ['null ledger', (w,d)=>{w.cases['matter-001'].expectationDecisions=null}],
 ['array ledger', (w,d)=>{w.cases['matter-001'].expectationDecisions=[]}],
 ['malformed status object', (w,d)=>{d.status={toString:'not callable'}}],
 ['malformed source list', (w,d)=>{d.basisSourceIds={}}],
 ['malformed context list', (w,d)=>{d.contextReferences=null}],
 ['unrecognized status', (w,d)=>{d.status='provided'}],
 ['mismatched action', (w,d)=>{d.action='dismiss'}],
 ['missing decision identity', (w,d)=>{delete d.decisionId}],
 ['wrong matter', (w,d)=>{d.matterId='matter-002'}],
 ['wrong expectation', (w,d)=>{d.expectationId='other-expectation'}],
 ['wrong record', (w,d)=>{d.recordId='other-record'}],
 ['missing actor', (w,d)=>{delete d.actor}],
 ['unauthorized actor', (w,d)=>{d.actor.id='unknown-actor'}],
 ['nonhuman actor', (w,d)=>{d.actor.type='system'}],
 ['empty reason', (w,d)=>{d.reason='  '}],
 ['invalid timestamp', (w,d)=>{d.timestamp='yesterday'}],
 ['future timestamp', (w,d)=>{d.timestamp='2999-01-01T00:00:00.000Z'}],
 ['missing basis', (w,d)=>{delete d.basisSourceIds}],
 ['wrong basis', (w,d)=>{d.basisSourceIds=['doc-2']}],
 ['missing source inventory', (w,d)=>{w.cases['matter-001'].documents=[]}],
 ['missing context references', (w,d)=>{delete d.contextReferences}],
 ['unknown context reference', (w,d)=>{d.contextReferences=['wrong-matter-source']}],
 ['missing authority', (w,d)=>{delete d.authority}],
 ['missing permission provenance', (w,d)=>{delete d.reviewPermission}],
 ['wrong sleeve', (w,d)=>{d.sleeveId='other-sleeve'}],
 ['wrong sleeve revision', (w,d)=>{d.sleeveRevision=99}],
 ['missing controls', (w,d)=>{delete d.appliedBlockIds}],
 ['wrong control version', (w,d)=>{d.controlVersion='other-version'}],
 ['wrong expectation version', (w,d)=>{d.expectationVersion=99}],
 ['wrong approver', (w,d)=>{d.approvedBy='other-owner'}],
 ['invalid prior state', (w,d)=>{d.before='unexpected'}],
 ['unaudited decision', (w,d)=>{w.events=w.events.filter(e=>e.action!=='expectation.human_decision')}],
 ['wrong audit matter', (w,d,e)=>{e.matterId='matter-002'}],
 ['wrong audit actor', (w,d,e)=>{e.actor.id='unknown-actor'}],
 ['wrong audit target', (w,d,e)=>{e.target='other-expectation'}],
 ['failed audit outcome', (w,d,e)=>{e.outcome='denied'}],
 ['invalid audit timestamp', (w,d,e)=>{e.at='invalid'}],
 ['missing audit identity', (w,d,e)=>{delete e.id}],
 ['mismatched audit reason', (w,d,e)=>{e.details.reason='not the recorded decision'}]
];
for (const [name, mutate] of rejected) {
 const workspace = JSON.parse(validStored);
 const data = workspace.cases['matter-001'];
 const decision = data.expectationDecisions[id];
 const event = workspace.events.find(e=>e.action==='expectation.human_decision');
 mutate(workspace,decision,event);
 // Even affirmative provision must not hide an invalid restored override.
 data.evidence=[{recordId:'BC-1841-A',status:'provided'}];
 const host = boot({persisted:JSON.stringify(workspace)});
 const result = host.run('runConsistency()');
 assert.equal(result.status,'blocked',name);
 assert.equal(result.expectations[0].status,'not_provided',name);
 assert.equal(result.expectations[0].blocked,true,name);
 assert.equal(host.run(call('dismiss')),false,`${name}: invalid decision silently replaced`);
 assert.equal(host.run("workspace.events.filter(e=>e.action==='analysis.guard_applied').length"),0,name);
}
console.log(`PASS ${rejected.length} restored-decision rejection paths: unresolved, analysis blocked, no accepted transition`);

for (const later of ['dismiss','reopen']) {
 const host=boot({persisted:validStored});
 assert.ok(host.run(call(later)));
 const stale=JSON.parse(validStored).cases['matter-001'].expectationDecisions[id];
 const workspace=JSON.parse(host.stored());
 workspace.cases['matter-001'].expectationDecisions[id]=stale;
 assert.equal(boot({persisted:JSON.stringify(workspace)}).run('runConsistency().status'),'blocked');
}
const isolated=boot();
assert.ok(isolated.run(`const decision=${call('resolve')};decision.contextReferences.push('other-source');decision.actor.id='other-actor';true`));
assert.equal(isolated.run('runConsistency().expectations[0].status'),'resolved_by_human_review');
assert.equal(boot({persisted:isolated.stored()}).run('runConsistency().expectations[0].status'),'resolved_by_human_review');
console.log('PASS stale decision replay rejected after dismissal/reopen; returned objects cannot contaminate state/audit; actual storage reload succeeds');
