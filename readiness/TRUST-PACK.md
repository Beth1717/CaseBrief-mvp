# CaseBrief trust and data-flow pack

Status: synthetic static application. Technical inventory for review, not a security certification, contract or production policy.

## Current data flows

| Boundary | Current implementation | What leaves / persists | Limitation |
| --- | --- | --- | --- |
| Static host → browser | `index.html` loads application JS and fictional seed | Browser receives the static assets and seed records | All bundled synthetic data can be inspected regardless of UI role |
| Workspace → browser storage | `core.js` persists `casebrief_workspace_v3` | Mutable local browser storage | No server identity, isolation, trusted clock or protected persistence |
| Records → assistant/memo | `investor-demo.js` builds deterministic output from permitted indexed excerpts | Stored locally in workspace; no model request from this UI | No live retrieval/model accuracy established |
| Review → CRI/history | `pilot-runtime.js` updates reasoned decisions and source revisions | Local event metadata; some finding events include source quotations and decision reasons | History may contain sensitive content in a future implementation; it is not content-free telemetry |
| Workspace → local download | Audit export, CRI export, `review-receipt.js` | User-confirmed JSON downloads | Receipt intentionally contains source text and decision reasons; downloaded copies cannot be revoked |
| Workspace → family preview | Selected synthetic source release inside same browser | Read-only UI; no invitation or transmission | UI demonstration only; developer tools can bypass client-side checks |
| Analysis workbench → local host | `analysis/workbench.js` calls `analysis/server.cjs` on loopback with an expiring per-page session token | Fictional document extracts, analysis proposals, review actions and receipt metadata | Local session is not production identity; no organisation/tenant authentication or hosted isolation |
| Node adapter → local runtime | `integration/umg-runtime-rev2.cjs`, invoked by the analysis host when `CASEBRIEF_UMG_ENDPOINT` is configured | Revision-2 synthetic request to 127.0.0.1; bounded response validated before host review | Separate local service; no hosted deployment, service identity or confidential-data approval |

The main CaseBrief browser CSP blocks network connections. The separate analysis workbench has its own loopback-only Node host and a `connect-src 'self'` policy so its UI can call that local host; it does not permit external AI/network destinations. Loading static assets from a host is separate from allowing runtime AI/network requests. The application does not implement messaging delivery or autonomous court filing.

## Local host persistence experiment added October 30

The Node-only synthetic coordinator persists invocation/result/review state and minimal hash-linked audit events in SQLite transactions. Tests cover on-disk restart, audit failure rollback, tenant/matter/actor namespace checks and source/authorization rechecks. Its host callback is trusted synthetic input, not an authenticated identity service. See `integration/HOST_INTEGRATION_FOUNDATION.md`.

## November 5 local analysis-workbench integration

The separate fictional-document workbench now invokes the revision-2 adapter through `analysis/server.cjs` when a loopback UMG endpoint is configured. The server explicitly validates the returned response before any proposal becomes reviewable. It stores CaseBrief analysis proposals separately from UMG accepted/quarantined counts; all proposals remain `HUMAN_REVIEW_REQUIRED`. Fresh arbitrary findings quarantined by UMG are not described as UMG-validated.

`analysis/persistent-review.cjs` uses the SQLite host store for invocation metadata, source snapshot digests, human passage-support/confirm/dismiss/reopen decisions, and hash-chained audit events. Browser source edits invalidate the associated run; late responses cannot be promoted. A per-page expiring token binds review authority to the page session. After a browser-session refresh or server restart, prior receipts remain inspectable but read-only because the old source/authorization context is not restored.

The local database stores synthetic proposal quotations and human review reasons. Its hash chain is append-only within the local SQLite database but is not signed, externally anchored or independently tamper-proof.\n\nA downloaded local receipt can be imported from the main app's UMG screen into a workspace-level quarantine inbox. The importer performs basic shape/synthetic-scope/zero-dispatch checks and stores only a sanitised proposal summary and source locator metadata; it intentionally omits quote text and reviewer reasons. The imported receipt is not cryptographically authenticated, is not linked to the active matter, and cannot change case issues, CRI, timeline, evidence or witness records. It remains `UNTRUSTED_QUARANTINED`; manual source mapping and separate attorney validation are still required. The inbox is browser-local storage, not the durable host audit ledger. The local actor and session token are not production authentication. The main CaseBrief demo's browser storage and receipt limitations remain unchanged; the new ledger is scoped to the separate local analysis workbench. This integration is not production audit, hosted tenant isolation or confidential-data approval. See `analysis/README.md` and `readiness/UMG_NOV04_REPLAY_2026-11-05.md`.

## Recovered synthetic intake

`ingestion-demo.js` imports only fixed fictional samples, keeps quarantine outside case documents/analysis, preserves versioned payloads and derived assertions, requires reasoned promotion/revocation, and stages browser state plus activity events in one storage write. General intake events omit human reason text; source-ledger reasons are role-filtered. Storage failure rolls back the staged state. This is not a production file pipeline or backend persistence guarantee. See `integration/INGESTION_RECOVERY.md`.

## Present control evidence versus required production evidence

| Area | Demonstrable evidence | Evidence still required before live data |
| --- | --- | --- |
| Matter access | Guarded-host checks, UI role filtering, protected actions, denied pilot insertion regressions | Server-authenticated identities and server-side organisation/matter/object checks on every read/write/retrieval/export; negative tenant tests |
| Source traceability | Indexed excerpts, source IDs, source-revision invalidation, quoted spans | Original-file integrity, ingestion provenance, stable locators, revision/version retention and authorised retrieval |
| Human control | Required reasons, confirm/dismiss/resolve/reopen states, draft review labels | Named accountable reviewers, authenticated approvals, validated legal workflow/templates and supervision policy |
| CRI | 40/35/25 ruleset with inspectable deductions and insufficient-data state | Attorney assessment of applicability, calibration and usability; no legal-outcome prediction |
| Audit | Local analysis workbench SQLite transactions, per-decision host events, source snapshot digests and hash-chain verification; main static app still has browser-local receipts | Production durable server events atomically coupled to state changes; authenticated actor, trusted time, access policies, externally anchored integrity, retention/hold and failure handling |
| AI/provider | Deterministic browser UI; separately tested synthetic local revision-2 adapter | Named model/runtime versions, DPA/subprocessors, training/retention/residency terms, secrets, injection/exfiltration tests, trace correlation and monitoring |
| Operations | Static demo and reproducible suites | Environment isolation, incident ownership, backup/restore evidence, deletion/hold workflow, vulnerability process and independent assessment |

## Decisions needed for hosted implementation

Record a named owner and dated evidence for each item; do not fill missing answers with assumptions.

- Deployment operator, region, data controller/processor roles, budget and support responsibility.
- Authentication provider, onboarding/verification, recovery, professional MFA, organisation membership and matter grants.
- Storage/encryption/key owner; original evidence versus extracted text; upload quarantine and malware controls.
- AI runtime/model/provider/subprocessor inventory, contractual data handling, retention and logging destinations.
- Audit event store, transaction/state coupling, access/read/export events, export delivery, trusted time and cross-service request IDs.
- Retention periods and hold exceptions, backup expiry, deletion verification, incident response and restore objectives.

## Audit event contract proposed for backend review

Record event ID; trusted timestamp; actor and delegated actor; organisation, matter and object IDs; action/outcome; authorization decision and policy version; request/correlation ID; source versions; runtime/model/ruleset versions; human approval and release IDs when applicable. Record content only when necessary in an appropriately protected evidence record. Keep prompts, source text and private notes out of general telemetry by default. Never collect private chain-of-thought as an audit requirement.

Failing to persist an important audit event must not silently report a consequential mutation as successful. Define and test rollback/retry behavior. Local browser event IDs are not proof this backend guarantee exists.

## Safe presentation statements

- “The synthetic demo shows source-linked review, human decisions and operational readiness.”
- “The receipt makes the prototype workflow inspectable; it is a mutable browser snapshot.”
- “A local synthetic UMG adapter has separate validation evidence; hosted runtime and provider qualification remain open.”

Do not claim certified compliance, attorney-validated conclusions, proven savings, production security or an active customer deployment from these artifacts. Competitor certifications are procurement signals to investigate for a selected buyer, not automatically CaseBrief requirements or credentials.

See [SECURITY-MODEL.md](../SECURITY-MODEL.md) for the existing detailed production gates.
