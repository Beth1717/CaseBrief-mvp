# UMG remediation and review fixes (uncommitted)

## Authorization and startup

CaseBrief owns authorization, demo grants, and fallback selection in core.js. The guarded iframe authorizes the persisted matter before assigning the working context. A denied matter triggers an audited, separately authorized CaseBrief fallback; no authorized fallback stops startup.

A host-owned startup gate defaults to blocked, independently of host-controls.js. Only completed installation releases it. Core switching/view selection, permission checks, navigation, detail/CRI drawers, both application render implementations, and the original consistency runner enforce this gate. Failed loading or installation (including a throw after partial installation) leaves controls inert, the picker empty/disabled, and content blocked. The adapter also checks readiness and performs a fresh host authorization check before analysis. Denied matter titles are not exposed in the picker.

This is a synthetic client-side boundary. localStorage decoding is not backend data isolation; authorization before hydration means before selecting the active working context. The standalone demo retains its existing behavior. The integration principal remains the explicit host actor, demo-reviewer; demo security profiles supply additional operation permissions.

## Evidence and expectation semantics

Only exact structured `status: 'provided'`, an exact `recordId` match, and complete expectation basis establish provision. There is no display-name fallback. The BC-1841-A seed has a stable recordId. The matrix contains 15 adverse/malformed/unknown values, and its count is generated from the array length.

States remain `not_provided` (unresolved; retained for original probe compatibility), `provided`, `resolved_by_human_review`, `dismissed_by_human_review`, and `coverage_need`. Resolution and dismissal are never provision.

`decideExpectation(id, action, reason, contextReferences)` accepts resolve, dismiss, and reopen. It requires affirmative matter authorization, a human actor, a callable host.can returning exactly true, and working synchronous audit/persistence capabilities. Missing, invalid, throwing, denying, or unacknowledged capabilities reject the transition. CaseBrief record() returns an isolated audit receipt only after persistence succeeds. The adapter verifies the newly appended event and receipt before publishing the decision, persists the decision, and restores prior decisions/history/storage on failure. Returned decision objects cannot mutate stored state or audit history.

Restored overrides require complete identity, matching matter/expectation/record, an authorized human actor, recognized action/status, nonempty reason, canonical nonfuture timestamp, basis/context source references, expectation version/approver, sleeve/control provenance, and an exact corresponding latest successful human-decision event. Stale resolution replay after dismissal or reopen is rejected. Malformed, mismatched, and unaudited overrides remain unresolved with analysis blocked, even if evidence otherwise says provided. Invalid restored overrides require CaseBrief-owned data repair; the human transition API does not silently overwrite them.

Human transitions are exposed through the host API; no dedicated decision form is added.

## Regression coverage and commands

Run a local server on port 8765 for browser tests. Final validation commands:

- `node tests/state.cjs`
- `node tests/browser.cjs`
- `node integration/tests/host-adoption.cjs` — original four probes
- `node integration/tests/browser-host-adoption.cjs` — original four browser probes
- `node integration/tests/casebrief-sleeve-contract.cjs`
- `node integration/tests/remediation.cjs` — authorization, evidence matrix, lifecycle, actual storage readback, fixture contract, mutation sensitivity
- `node integration/tests/browser-remediation.cjs` — persisted unauthorized matter and independent analysis denial
- `node integration/tests/decision-security.cjs` — 76 dependency-failure cases, 42 restored-decision rejection paths, replay, storage, alias isolation
- `node integration/tests/browser-control-failure.cjs` — request abort, installation throw, partial-installation throw
- `git diff --check`

The fixture contract invokes both the authoritative authorization function and its adapter for every configured actor and relevant matter, including unknown identities/matters. It checks declared grants, denied matters, expected records and basis, and trusted sources. An in-memory mutation granting demo-system access to matter-002 must fail this contract; the regression proves that failure without changing repository code.

The new Node harness uses the actual STORE key and a read/write memory map. Reload tests consume its current stored value rather than serializing live state or replaying the original input. Browser contexts and VM hosts are isolated between adversarial cases. Both original adoption probe files remain unchanged against 90925dc. node_modules remains untracked.

## NeoUMG compatibility statement

CaseBrief remains the authoritative host and system of record, separate from UMG analytical execution. The existing vNext/H4 semantic compatibility baseline and current MOLT/sleeve semantics remain preserved. No live NeoUMG compiler/runtime or fully NeoUMG-compatible sleeve is claimed; formal qualification remains a later UMG-side step. The external-action stack remains mechanically BLOCKED and locked OFF. UMG cannot self-grant CaseBrief permissions. The runtime/service boundary remains replaceable, requires no hosted UMG endpoint, and remains compatible with a future broker-enforced dry run. Provenance retains sleeve identity/revision, control IDs, actor, matter, sources, findings, expectation states, authorization, and human decisions.

The post-test adversarial review also found and closed a secondary detail-drawer rendering path; the browser failure suite now challenges it directly alongside both main render and permission entry points.

## Limits

This remains a browser-local synthetic demo, not authenticated server authorization or tamper-evident audit storage. A user able to rewrite both executable JavaScript and localStorage is outside this demonstration boundary. Future service adapters must implement the explicit permission, audit-receipt, and persistence contract. Production isolation and formal NeoUMG qualification remain separate work.
