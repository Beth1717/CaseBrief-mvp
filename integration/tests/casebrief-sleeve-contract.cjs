const fs = require('node:fs');
const vm = require('node:vm');

const sleevePath = 'integration/CASEBRIEF_UMG_SLEEVE_v0.1.json';
const sleeve = JSON.parse(fs.readFileSync(sleevePath, 'utf8'));

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function collectIds(document) {
  const ids = new Set([document.id]);
  for (const stack of document.neoStacks) {
    ids.add(stack.id);
    for (const block of stack.neoBlocks) {
      ids.add(block.id);
      for (const molt of block.moltBlocks) ids.add(molt.id);
    }
  }
  return ids;
}

const ids = collectIds(sleeve);
expect(sleeve.profile === 'umg.project-lab.sleeve/1.0', 'unexpected sleeve profile');
expect(sleeve.id === 'SLV.CASEBRIEF.LEGALANALYSIS.v0.1', 'unexpected sleeve id');
expect(sleeve.revision === 1, 'unexpected sleeve revision');
expect(sleeve.runtimeDefaults.userLocks['NS.CB.ACTION'] === 'OFF', 'external action stack must be locked OFF');

const actionStack = sleeve.neoStacks.find(stack => stack.id === 'NS.CB.ACTION');
expect(actionStack?.defaultState === 'BLOCKED', 'external action stack must be BLOCKED');
expect(actionStack.neoBlocks.find(block => block.id === 'NB.CB.ACTION.EXTERNAL')?.defaultState === 'BLOCKED', 'external action block must be BLOCKED');

for (const relation of sleeve.relations) {
  expect(ids.has(relation.from), `relation source missing: ${relation.from}`);
  expect(ids.has(relation.to), `relation target missing: ${relation.to}`);
}

const context = {globalThis: null};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('integration/host-controls.js', 'utf8'), context, {filename: 'integration/host-controls.js'});

const events = [];
const elements = new Map();
const host = {
  caseBriefHostApi: {
    actor: {id: 'demo-reviewer'},
    authorizeMatter(actor, id) {return actor.id === 'demo-reviewer' && id === 'matter-001';},
    data: {matter: {id: 'matter-001'}, documents: [], evidence: [], issues: []},
    workspace: {cases: {'matter-001': {matter: {id: 'matter-001', title: 'Synthetic'}}}}
  },
  document: {getElementById(id) {if (!elements.has(id)) elements.set(id, {innerHTML: ''}); return elements.get(id);}},
  esc(value) {return String(value);},
  record(action, target, details, outcome) {events.push({action, target, details, outcome});},
  switchCase() {return true;},
  syncPicker() {}
};

context.installCaseBriefHostControls(host);
const manifest = host.caseBriefHostControls.sleeve;
expect(manifest.id === sleeve.id, 'adapter sleeve id does not match JSON');
expect(manifest.revision === sleeve.revision, 'adapter sleeve revision does not match JSON');
expect(manifest.profile === sleeve.profile, 'adapter sleeve profile does not match JSON');
for (const requiredId of manifest.requiredBlockIds) expect(ids.has(requiredId), `adapter requires missing block: ${requiredId}`);

const installed = events.find(event => event.action === 'host_controls.installed');
expect(installed?.details.sleeveId === sleeve.id, 'installation audit omitted sleeve id');
expect(installed?.details.sleeveRevision === sleeve.revision, 'installation audit omitted sleeve revision');

const result = host.runConsistency();
expect(result.sleeve.id === sleeve.id, 'analysis result omitted sleeve identity');
const analysis = events.find(event => event.action === 'analysis.guard_applied');
expect(analysis?.details.sleeveId === sleeve.id, 'analysis audit omitted sleeve id');
expect(Array.isArray(analysis?.details.appliedBlockIds), 'analysis audit omitted applied block ids');

console.log(`PASS: ${sleeve.id} revision ${sleeve.revision} is structurally linked to ${host.caseBriefHostControls.version}, external action is blocked, and installation/analysis audit events carry sleeve provenance.`);
