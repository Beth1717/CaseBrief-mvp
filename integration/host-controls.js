(function (global) {
  'use strict';

  const CONTROL_VERSION = 'casebrief-host-controls.v0.2.1';
  const SLEEVE_CONTRACT = Object.freeze({
    profile: 'umg.project-lab.sleeve/1.0',
    id: 'SLV.CASEBRIEF.LEGALANALYSIS.v0.1',
    revision: 1,
    sourcePath: 'integration/CASEBRIEF_UMG_SLEEVE_v0.1.json',
    requiredBlockIds: Object.freeze([
      'NB.CB.ROUTE.SCOPE',
      'NB.CB.INTAKE.PROVENANCE',
      'NB.CB.CONSISTENCY.CLAIMS',
      'NB.CB.CONFIDENCE.CALIBRATE',
      'NB.CB.AUDIT.EVENT',
      'NB.CB.REVIEW.GATE',
      'NB.CB.ACTION.EXTERNAL'
    ])
  });

  const reviewedFindingCatalog = new Map([
    ['i1', {
      category: 'contradiction',
      statement: 'The reported start time appears inconsistent across the incident report and witness statement.',
      sources: ['doc-1', 'doc-2']
    }],
    ['i2', {
      category: 'contradiction',
      statement: 'The recorded location of the backpack appears inconsistent across sources.',
      sources: ['doc-1', 'doc-2']
    }],
    ['i3', {
      category: 'missing_evidence',
      statement: 'Body-camera file BC-1841-A is referenced but is absent from the produced evidence inventory.',
      sources: ['doc-1', 'doc-3', 'doc-8']
    }],
    ['i4', {
      category: 'timeline_gap',
      statement: 'The current packet contains a meaningful chronology gap following the preservation request.',
      sources: ['doc-5']
    }]
  ]);

  const matterGrants = new Map([
    ['demo-reviewer', new Set(['matter-001'])],
    ['demo-system', new Set(['matter-001'])]
  ]);

  const expectationLedger = [
    {
      id: 'expectation-bc-1841-a',
      matterId: 'matter-001',
      recordId: 'BC-1841-A',
      recordType: 'body_camera_video',
      basisSourceIds: ['doc-1', 'doc-5', 'doc-8'],
      approvedBy: 'synthetic-fixture-owner',
      version: 1
    }
  ];

  function sameArray(a, b) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
  }

  function findingIsTrusted(issue) {
    const approved = issue && reviewedFindingCatalog.get(issue.id);
    return !!approved &&
      issue.category === approved.category &&
      issue.statement === approved.statement &&
      sameArray(issue.sources, approved.sources);
  }

  function authorizedMatter(actor, matterId) {
    const grants = matterGrants.get(actor && actor.id);
    return !!grants && grants.has(matterId);
  }

  function expectedRecordStatus(data, expectation) {
    const basisPresent = expectation.basisSourceIds.every(id => data.documents.some(doc => doc.id === id));
    if (!basisPresent) return {status: 'coverage_need', basisPresent: false};

    const candidate = data.evidence.find(item => String(item.name || '').includes(expectation.recordId));
    if (!candidate) return {status: 'not_provided', basisPresent: true};

    const status = String(candidate.status || '').toLowerCase();
    const unresolved = !status || status.includes('missing') || status.includes('referenced') || status.includes('not provided');
    return {status: unresolved ? 'not_provided' : 'provided', basisPresent: true};
  }

  function installCaseBriefHostControls(host) {
    if (!host) return;
    const state = host.caseBriefHostApi;
    if (!state || !state.data || !state.workspace || !state.actor) {
      throw new Error('CaseBrief host API unavailable');
    }
    // Install once per CaseBrief application instance. The iframe can reload
    // while its Window proxy survives, so a simple boolean may incorrectly
    // suppress installation against a newly-created host API.
    if (host.__caseBriefHostControlsInstalledFor === state) {
      return host.caseBriefHostControls;
    }
    host.__caseBriefHostControlsInstalledFor = state;

    const audit = (action, target, details, outcome = 'success') => {
      if (typeof host.record === 'function') host.record(action, target, details || {}, outcome);
    };

    const baseSwitchCase = host.switchCase;
    host.switchCase = function guardedSwitchCase(id) {
      const activeActor = state.actor;
      if (!authorizedMatter(activeActor, id)) {
        audit('access.denied', `matter:${id}`, {reason: 'matter_not_authorized', controlVersion: CONTROL_VERSION}, 'denied');
        if (typeof host.syncPicker === 'function') host.syncPicker();
        return false;
      }
      return baseSwitchCase.call(host, id);
    };

    host.syncPicker = function guardedSyncPicker() {
      const picker = host.document && host.document.getElementById && host.document.getElementById('casePicker');
      if (!picker || !state.workspace) return;
      const activeActor = state.actor;
      picker.innerHTML = Object.values(state.workspace.cases).map(c => {
        const allowed = authorizedMatter(activeActor, c.matter.id);
        const selected = c.matter.id === state.data.matter.id ? ' selected' : '';
        const disabled = allowed ? '' : ' disabled';
        const suffix = allowed ? '' : ' — no access';
        return `<option value="${host.esc(c.matter.id)}"${selected}${disabled}>${host.esc(c.matter.title + suffix)}</option>`;
      }).join('');
    };

    host.runConsistency = function guardedRunConsistency() {
      const runId = host.crypto && host.crypto.randomUUID ? host.crypto.randomUUID() : `run-${Date.now()}`;
      const relevantCategories = new Set(['contradiction', 'missing_evidence', 'timeline_gap', 'unsupported_assertion']);
      const candidateIssues = state.data.issues.filter(x => relevantCategories.has(x.category));
      const accepted = candidateIssues.filter(findingIsTrusted);
      const quarantined = candidateIssues.filter(x => !findingIsTrusted(x));
      const expectations = expectationLedger
        .filter(x => x.matterId === state.data.matter.id)
        .map(x => ({...x, ...expectedRecordStatus(state.data, x)}));

      audit('analysis.guard_applied', runId, {
        controlVersion: CONTROL_VERSION,
        sleeveId: SLEEVE_CONTRACT.id,
        sleeveRevision: SLEEVE_CONTRACT.revision,
        appliedBlockIds: SLEEVE_CONTRACT.requiredBlockIds,
        acceptedFindingIds: accepted.map(x => x.id),
        quarantinedFindingIds: quarantined.map(x => x.id),
        expectationStates: expectations.map(x => ({id: x.id, recordId: x.recordId, status: x.status}))
      });

      const findingHtml = accepted.map(x => `<div class="item"><b>${host.esc(x.category)}</b><div>${host.esc(x.statement)}</div><div class="meta">${x.sources.map(host.esc).join(', ')}</div></div>`).join('');
      const expectationHtml = expectations.filter(x => x.status !== 'provided').map(x => {
        const label = x.status === 'coverage_need' ? 'Coverage need' : 'Expected record unresolved';
        const detail = x.status === 'coverage_need'
          ? 'The expectation basis is incomplete; retain the need without inventing a factual conclusion.'
          : 'The independent expectation remains visible until the record is provided, explicitly resolved, or dismissed.';
        return `<div class="item"><b>${label}</b><div>${host.esc(x.recordId)}</div><div class="meta">${host.esc(detail)} Basis: ${x.basisSourceIds.map(host.esc).join(', ')}</div></div>`;
      }).join('');
      const quarantineHtml = quarantined.length
        ? `<div class="callout auditnotice"><b>${quarantined.length} candidate finding${quarantined.length === 1 ? '' : 's'} quarantined</b><p>Not shown as accepted findings because the reviewed source/interpretation catalogue does not exactly support them.</p></div>`
        : '';

      const runner = host.document.getElementById('runner');
      runner.innerHTML = `<div class="list" style="margin-top:10px">${findingHtml}${expectationHtml}</div>${quarantineHtml}`;
      return {runId, accepted, quarantined, expectations, sleeve: SLEEVE_CONTRACT};
    };

    host.caseBriefHostControls = {
      version: CONTROL_VERSION,
      sleeve: SLEEVE_CONTRACT,
      findingIsTrusted,
      authorizedMatter,
      expectedRecordStatus,
      reviewedFindingCatalog,
      expectationLedger
    };

    host.syncPicker();
    audit('host_controls.installed', CONTROL_VERSION, {
      syntheticOnly: true,
      sleeveId: SLEEVE_CONTRACT.id,
      sleeveRevision: SLEEVE_CONTRACT.revision,
      sleeveSourcePath: SLEEVE_CONTRACT.sourcePath
    });
    return host.caseBriefHostControls;
  }

  global.installCaseBriefHostControls = installCaseBriefHostControls;
})(globalThis);
