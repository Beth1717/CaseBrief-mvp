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

  // Closed-world provision contract: only the exact structured status "provided".
  const affirmativeProvisionStates = Object.freeze(['provided']);
  function evidenceStatus(data, expectation) {
    const basisPresent = expectation.basisSourceIds.every(id => data.documents.some(doc => doc.id === id));
    if (!basisPresent) return {status: 'coverage_need', basisPresent: false};
    // No display-name fallback: legacy rows without identity cannot establish provision.
    const candidates = data.evidence.filter(item => item && item.recordId === expectation.recordId);
    return {status: candidates.some(item => affirmativeProvisionStates.includes(item.status)) ? 'provided' : 'not_provided', basisPresent: true};
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
    const clone = value => JSON.parse(JSON.stringify(value));
    const authorizedMatter = (identity, id) => {
      try { return typeof state.authorizeMatter === 'function' && state.authorizeMatter(identity, id) === true; }
      catch { return false; }
    };
    const hostReady = () => typeof host.applicationAllowed !== 'function' || host.applicationAllowed() === true;
    const audit = (action, target, details, outcome = 'success') => {
      if (typeof host.record !== 'function') throw new Error('CaseBrief audit capability unavailable');
      return host.record(action, target, clone({authority: 'CaseBrief', actor: {...state.actor}, matterId: state.data.matter.id, sleeveId: SLEEVE_CONTRACT.id, sleeveRevision: SLEEVE_CONTRACT.revision, appliedBlockIds: SLEEVE_CONTRACT.requiredBlockIds, ...details}), outcome, state.actor);
    };
    const nonempty = value => typeof value === 'string' && value.trim().length > 0;
    const validTimestamp = value => {
      if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return false;
      return new Date(value).toISOString() === value && Date.parse(value) <= Date.now();
    };
    const equal = (a, b) => {
      if (a === b) return true;
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
      const keys = Object.keys(a);
      return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && equal(a[key], b[key]));
    };
    function matchingAudit(decision, event) {
      return !!event && nonempty(event.id) && event.action === 'expectation.human_decision' &&
        event.target === decision.expectationId && event.matterId === decision.matterId &&
        event.outcome === 'success' && validTimestamp(event.at) && Date.parse(event.at) >= Date.parse(decision.timestamp) &&
        equal(event.actor, decision.actor) && equal(event.details, decision);
    }
    function validDecision(decision, data, expectation) {
      if (!decision || typeof decision !== 'object' || Array.isArray(decision)) return false;
      const actions = {resolved_by_human_review: 'resolve', dismissed_by_human_review: 'dismiss'};
      if (typeof decision.status !== 'string' || !Object.hasOwn(actions, decision.status) || decision.action !== actions[decision.status] ||
          !nonempty(decision.decisionId) || decision.matterId !== data.matter.id || decision.matterId !== expectation.matterId ||
          decision.expectationId !== expectation.id || decision.recordId !== expectation.recordId ||
          !decision.actor || !nonempty(decision.actor.id) || decision.actor.type !== 'human' ||
          !authorizedMatter(decision.actor, decision.matterId) || !nonempty(decision.reason) || !validTimestamp(decision.timestamp) ||
          !['not_provided', 'provided', 'coverage_need', 'resolved_by_human_review', 'dismissed_by_human_review'].includes(decision.before) ||
          decision.authority !== 'CaseBrief' || decision.reviewPermission !== true ||
          decision.sleeveId !== SLEEVE_CONTRACT.id || decision.sleeveRevision !== SLEEVE_CONTRACT.revision ||
          decision.controlVersion !== CONTROL_VERSION || !sameArray(decision.appliedBlockIds, SLEEVE_CONTRACT.requiredBlockIds) ||
          decision.expectationVersion !== expectation.version || decision.approvedBy !== expectation.approvedBy ||
          !sameArray(decision.basisSourceIds, expectation.basisSourceIds) ||
          !Array.isArray(decision.contextReferences) || !decision.contextReferences.every(nonempty)) return false;
      // Source references must belong to this matter's current source inventory.
      if (![...decision.basisSourceIds, ...decision.contextReferences].every(id => data.documents.some(doc => doc && doc.id === id))) return false;
      // Only the latest human event may back the active override: an old resolution
      // cannot be replayed after a dismissal or reopen.
      const latest = (Array.isArray(state.workspace.events) ? state.workspace.events : []).filter(event => event && event.action === 'expectation.human_decision' &&
        event.matterId === expectation.matterId && event.target === expectation.id).at(-1);
      return matchingAudit(decision, latest);
    }
    function expectedRecordStatus(data, expectation) {
      if (Object.hasOwn(data, 'expectationDecisions')) {
        const ledger = data.expectationDecisions;
        if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger))
          return {status: 'not_provided', blocked: true, reason: 'invalid_human_decision'};
        if (Object.hasOwn(ledger, expectation.id)) {
          const decision = ledger[expectation.id];
          let valid = false;
          try { valid = validDecision(decision, data, expectation); } catch {}
          if (!valid)
            return {status: 'not_provided', blocked: true, reason: 'invalid_human_decision'};
          return {status: decision.status, decision: clone(decision)};
        }
      }
      return evidenceStatus(data, expectation);
    }

    const baseSwitchCase = host.switchCase;
    host.switchCase = function guardedSwitchCase(id) {
      if (!hostReady()) return false;
      const activeActor = state.actor;
      if (!authorizedMatter(activeActor, id)) {
        audit('access.denied', `matter:${id}`, {reason: 'matter_not_authorized', controlVersion: CONTROL_VERSION}, 'denied');
        if (typeof host.syncPicker === 'function') host.syncPicker();
        return false;
      }
      return baseSwitchCase.call(host, id);
    };

    host.syncPicker = function guardedSyncPicker() {
      if (!hostReady()) return false;
      const picker = host.document && host.document.getElementById && host.document.getElementById('casePicker');
      if (!picker || !state.workspace) return;
      const activeActor = state.actor;
      picker.innerHTML = Object.values(state.workspace.cases).map(c => {
        const allowed = authorizedMatter(activeActor, c.matter.id);
        const selected = c.matter.id === state.data.matter.id ? ' selected' : '';
        const disabled = allowed ? '' : ' disabled';
        const suffix = allowed ? '' : ' — no access';
        return `<option value="${host.esc(c.matter.id)}"${selected}${disabled}>${host.esc((allowed ? c.matter.title : 'Restricted matter') + suffix)}</option>`;
      }).join('');
    };

    host.runConsistency = function guardedRunConsistency() {
      // Independent execution-boundary check, before reading analytical inputs.
      if (!authorizedMatter(state.actor, state.data.matter.id)) {
        audit('analysis.blocked', `matter:${state.data.matter.id}`, {reason: 'matter_not_authorized', authorization: 'denied'}, 'denied');
        const runner = host.document.getElementById('runner');
        if (runner) runner.innerHTML = '<div class="callout">Analysis blocked: matter not authorized.</div>';
        return {status: 'blocked', reason: 'matter_not_authorized'};
      }
      if (!hostReady()) return {status: 'blocked', reason: 'host_not_ready'};
      const runId = host.crypto && host.crypto.randomUUID ? host.crypto.randomUUID() : `run-${Date.now()}`;
      const relevantCategories = new Set(['contradiction', 'missing_evidence', 'timeline_gap', 'unsupported_assertion']);
      const candidateIssues = state.data.issues.filter(x => relevantCategories.has(x.category));
      const accepted = candidateIssues.filter(findingIsTrusted);
      const quarantined = candidateIssues.filter(x => !findingIsTrusted(x));
      const expectations = expectationLedger
        .filter(x => x.matterId === state.data.matter.id)
        .map(x => ({...x, ...expectedRecordStatus(state.data, x)}));

      if (expectations.some(x => x.blocked)) {
        audit('analysis.blocked', runId, {reason: 'invalid_human_decision', expectationStates: expectations}, 'denied');
        const runner = host.document.getElementById('runner');
        if (runner) runner.innerHTML = '<div class="callout">Analysis blocked: unresolved expectation has an invalid human decision.</div>';
        return {status: 'blocked', reason: 'invalid_human_decision', expectations, accepted: [], quarantined: []};
      }
      audit('analysis.guard_applied', runId, {
        authorization: 'allowed',
        sourceIds: [...new Set(accepted.flatMap(x => x.sources))],
        controlVersion: CONTROL_VERSION,
        sleeveId: SLEEVE_CONTRACT.id,
        sleeveRevision: SLEEVE_CONTRACT.revision,
        appliedBlockIds: SLEEVE_CONTRACT.requiredBlockIds,
        acceptedFindingIds: accepted.map(x => x.id),
        quarantinedFindingIds: quarantined.map(x => x.id),
        expectationStates: expectations.map(x => ({id: x.id, recordId: x.recordId, status: x.status, basisSourceIds: x.basisSourceIds, decision: x.decision || null}))
      });

      const findingHtml = accepted.map(x => `<div class="item"><b>${host.esc(x.category)}</b><div>${host.esc(x.statement)}</div><div class="meta">${x.sources.map(host.esc).join(', ')}</div></div>`).join('');
      const expectationHtml = expectations.filter(x => x.status !== 'provided').map(x => {
        const label = {coverage_need: 'Coverage need', resolved_by_human_review: 'Resolved by human review', dismissed_by_human_review: 'Dismissed by human review', not_provided: 'Expected record unresolved'}[x.status];
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

    host.decideExpectation = function(id, action, reason, contextReferences = []) {
      // All capabilities are mandatory and synchronous. Truthy/async responses do
      // not establish permission or a successfully recorded audit event.
      try {
        if (!hostReady() || !authorizedMatter(state.actor, state.data.matter.id) || state.actor.type !== 'human' ||
            typeof host.can !== 'function' || host.can('review_decisions') !== true ||
            typeof host.record !== 'function' || typeof host.save !== 'function' || typeof host.persist !== 'function') return false;
      } catch { return false; }
      const expectation = expectationLedger.find(x => x.id === id && x.matterId === state.data.matter.id);
      if (!expectation || !['resolve', 'dismiss', 'reopen'].includes(action) || !nonempty(reason) ||
          !Array.isArray(contextReferences) || !contextReferences.every(nonempty) ||
          ![...expectation.basisSourceIds, ...contextReferences].every(sourceId => state.data.documents.some(doc => doc && doc.id === sourceId))) return false;
      const prior = expectedRecordStatus(state.data, expectation);
      if (prior.blocked) return false;
      const status = action === 'reopen' ? evidenceStatus(state.data, expectation).status :
        {resolve: 'resolved_by_human_review', dismiss: 'dismissed_by_human_review'}[action];
      const decision = {
        decisionId: host.crypto.randomUUID(), expectationId: id, recordId: expectation.recordId,
        matterId: state.data.matter.id, actor: clone(state.actor), action, reason: reason.trim(),
        timestamp: new Date().toISOString(), basisSourceIds: [...expectation.basisSourceIds],
        contextReferences: [...contextReferences], before: prior.status, status,
        authority: 'CaseBrief', reviewPermission: true, sleeveId: SLEEVE_CONTRACT.id,
        sleeveRevision: SLEEVE_CONTRACT.revision, controlVersion: CONTROL_VERSION,
        appliedBlockIds: [...SLEEVE_CONTRACT.requiredBlockIds], expectationVersion: expectation.version,
        approvedBy: expectation.approvedBy
      };
      const previousEvents = clone(state.workspace.events);
      const previousDecisions = state.data.expectationDecisions === undefined ? undefined : clone(state.data.expectationDecisions);
      try {
        // Record first; do not publish the state transition until the host returns
        // a receipt and the corresponding event is present in authoritative history.
        const receipt = audit('expectation.human_decision', id, decision);
        const event = state.workspace.events.at(-1);
        if (!matchingAudit(decision, event) || !equal(receipt, event) || state.workspace.events.length !== previousEvents.length + 1)
          throw new Error('Human decision audit was not recorded');
        state.data.expectationDecisions ||= {};
        if (action === 'reopen') delete state.data.expectationDecisions[id];
        else state.data.expectationDecisions[id] = clone(decision);
        if (host.save() !== true) throw new Error('Human decision persistence failed');
        return clone(decision);
      } catch {
        state.workspace.events = previousEvents;
        if (previousDecisions === undefined) delete state.data.expectationDecisions;
        else state.data.expectationDecisions = previousDecisions;
        // A writer may append before throwing. Restore both host state and storage;
        // if storage is unavailable, never report a successful transition.
        try { host.persist(); } catch {}
        return false;
      }
    };

    host.caseBriefHostControls = {
      version: CONTROL_VERSION,
      sleeve: SLEEVE_CONTRACT,
      findingIsTrusted,
      authorizedMatter,
      expectedRecordStatus,
      affirmativeProvisionStates,
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
    host.__caseBriefHostControlsInstalledFor = state;
    return host.caseBriefHostControls;
  }

  global.installCaseBriefHostControls = installCaseBriefHostControls;
})(globalThis);
