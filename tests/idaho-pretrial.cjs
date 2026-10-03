const assert = require('node:assert/strict');
const fixture = require('../integration/fixtures/idaho-pretrial.json');
const boot = require('./helpers/application.cjs');

assert.equal(fixture.appState.issues.length,0,'evaluator expectations must not be seeded as application issues');
const {run,get,stored} = boot(structuredClone(fixture.appState));
assert.equal(run('data.matter.id'), 'SYN-ID-PRETRIAL-001');
assert.equal(run('data.documents.length'), 6);
assert.equal(run('data.authorities.length'), 0, 'no inherited authorities');
assert.equal(run('data.matter.nextDeadline'), null);
assert.equal(run('data.matter.filingProfile'), undefined);

assert.equal(run('data.issues.length'),3,'pilot runtime should derive three source-grounded candidate findings');
assert.equal(run("data.issues.every(x=>x.aiDetected===true&&x.humanConfirmed===false)"),true);
assert.equal(run('score()'),63);
assert.equal(run('pilotCRI().components.completeness.value'),80);
assert.equal(run('pilotCRI().components.workControl.value'),60);
assert.equal(run('pilotCRI().components.attentionControl.value'),40);
assert.equal(run('pilotCRI().ruleset'),'casebrief.cri.idaho-pretrial.v0.1');
assert.match(run('dashboard()'), /Case Readiness Index: 63%/);
assert.doesNotMatch(run('dashboard()'), /Aug 26|100%|Motions due/);
assert.equal(run(`weightedReadiness(${JSON.stringify(fixture.criArithmetic.components)})`),63);
for(const invalid of [null,[],[80,60],['80',60,40],[101,60,40],[-1,60,40]])assert.equal(run(`weightedReadiness(${JSON.stringify(invalid)})`),null);
assert.equal(run('weightedReadiness([NaN,60,40])'),null);

for (const source of fixture.appState.documents) {
  assert.equal(source.syntheticOnly, true);
  assert.match(source.title, /SYNTHETIC/);
  assert.ok(run('documents()').includes(source.id));
}
assert.equal(run("data.documents.find(d=>d.id==='S04').excerpt"), run("data.documents.find(d=>d.id==='S05').excerpt"));
assert.match(run('timeline()'), /clock accuracy unverified/);
run("openDetail('document','S02')");
assert.match(get('detailRoot').innerHTML, /21:09:30/);

const preview=run("simulateAI('Give me the full case narrative and draft a motion to suppress')");
assert.equal(JSON.stringify(preview.sources), JSON.stringify(['S01','S02','S03','S04','S05','S06']));
assert.match(preview.text, /not an analysis or a court draft/);
assert.doesNotMatch(preview.text, /BC-1841-A|August 26|Franklin County/);

run("activeSecurityProfile='investigator'");
const investigator=run("simulateAI('Full narrative')");
assert.ok(!investigator.sources.includes('S06'));
assert.doesNotMatch(investigator.text, /Internal strategy note/);
assert.ok(!run('documents()').includes('Restricted attorney work note'));
run("openDetail('document','S06')");
assert.ok(run("workspace.events.some(e=>e.action==='security.access_denied'&&e.target==='document:S06')"));

run("activeSecurityProfile='client'");
assert.equal(run("simulateAI('Full narrative').sources.length"),0,'recipient has no access before attorney release');
assert.equal(run("can('review_decisions')"),false);
assert.equal(run("can('export')"),false);

run("activeSecurityProfile='attorney'");
const expired=run("createPilotShareGrant(['S01','S02','S03','S04','S06'],'2000-01-01T00:00:00.000Z')");
assert.deepEqual(JSON.parse(JSON.stringify(expired.releasedSourceIds)),['S01','S02','S03','S04'],'privileged S06 must be excluded');
run("activeSecurityProfile='client'");
assert.equal(run("permittedSourceIds(['S01','S02','S03','S04','S06']).length"),0,'expired grant blocks subsequent reads');

run("activeSecurityProfile='attorney'");
const grant=run("createPilotShareGrant(['S01','S02','S03','S04','S06'])");
assert.equal(grant.releasedSourceIds.length,4);
run("activeSecurityProfile='client'");
assert.deepEqual(JSON.parse(run("JSON.stringify(permittedSourceIds(['S01','S02','S03','S04','S05','S06']))")),['S01','S02','S03','S04']);
assert.equal(run("canAccessDocument(data.documents.find(d=>d.id==='S06'))"),false);

run("activeSecurityProfile='attorney'");
assert.equal(run("revokePilotShareGrant('test_revocation')"),true);
run("activeSecurityProfile='client'");
assert.equal(run("permittedSourceIds(['S01','S02','S03','S04']).length"),0,'revocation blocks later reads');
assert.ok(run("workspace.events.some(e=>e.action==='share.granted')"));
assert.ok(run("workspace.events.some(e=>e.action==='share.revoked')"));

run("activeSecurityProfile='attorney'");
get('draftType').value='motion_to_suppress';
run('generateDraft({preventDefault(){}})');
assert.equal(run('data.drafts.length'),0);
assert.ok(run("workspace.events.some(e=>e.action==='draft.blocked'&&e.outcome==='denied')"));
assert.equal(run("filingReadiness('motion_to_suppress').ready"),false);
assert.throws(()=>run("createCatalogDraft('motion_to_suppress')"), /not validated/);
get('aiPrompt').value='Draft a motion to suppress';
run('askAI({preventDefault(){}})');
assert.equal(run('data.drafts.length'),0);
assert.doesNotMatch(run('data.assistantMessages.at(-1).text'), /BC-1841-A/);
assert.equal(JSON.parse(stored()).cases['SYN-ID-PRETRIAL-001'].documents.length,6);

// The original host authorization boundary stays closed to this new matter;
// the future UMG call uses a separate explicit host attestation contract.
assert.equal(run("authorizeMatter(actor,'SYN-ID-PRETRIAL-001')"),false);
console.log('PASS Idaho pilot: derived findings, deterministic 40/35/25 CRI, role-filtered source preview, controlled release/expiry/revocation, blocked drafting, audit and persistence.');
console.log('SCOPE: synthetic only. No Idaho legal conclusion, attorney-validated filing template, live NeoUMG runtime or production security claim.');
