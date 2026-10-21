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
| Node adapter → local runtime | `integration/umg-runtime-rev2.cjs`, synthetic loopback HTTP only | Explicit synthetic request to 127.0.0.1; bounded/validated response | Not wired to browser; not a hosted deployment or production authentication |

Current browser CSP blocks network connections. Loading static assets from a host is separate from allowing runtime AI/network requests. The application does not implement messaging delivery or autonomous court filing.

## Present control evidence versus required production evidence

| Area | Demonstrable evidence | Evidence still required before live data |
| --- | --- | --- |
| Matter access | Guarded-host checks, UI role filtering, protected actions, denied pilot insertion regressions | Server-authenticated identities and server-side organisation/matter/object checks on every read/write/retrieval/export; negative tenant tests |
| Source traceability | Indexed excerpts, source IDs, source-revision invalidation, quoted spans | Original-file integrity, ingestion provenance, stable locators, revision/version retention and authorised retrieval |
| Human control | Required reasons, confirm/dismiss/resolve/reopen states, draft review labels | Named accountable reviewers, authenticated approvals, validated legal workflow/templates and supervision policy |
| CRI | 40/35/25 ruleset with inspectable deductions and insufficient-data state | Attorney assessment of applicability, calibration and usability; no legal-outcome prediction |
| Audit | Local actor/time/action/outcome, decision citations, export IDs | Durable server events atomically coupled to state changes; access policies, trusted time, integrity checks, retention/hold and failure handling |
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
