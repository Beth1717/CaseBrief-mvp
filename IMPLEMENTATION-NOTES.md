# CaseBrief MVP — readiness, workflow, and traceability notes

This repository is a public static demonstration using synthetic records. It does **not** currently provide an authenticated legal application backend, live client messaging, court filing, live legal research, or a live UMG/model integration. Those boundaries are shown explicitly in the UI rather than being simulated as real external services.

## Implemented in the current v3 workspace

### Case overview and CRI

- Case Readiness Index (CRI) rendered as a segmented precision ring.
- Hover/focus now places a **translucent circular layer directly over the CRI ring**. The layer shows factor **categories** and the combined percentage each category is reducing the current CRI.
- Clicking the CRI opens deeper factor detail with category totals, individual review items, source IDs, and current scoring effects.
- Reviewed findings continue to reduce CRI until resolved or dismissed. Review decisions require a nonblank reason and record before/after state and CRI values.
- CRI remains a workload/readiness indicator only; it does not predict guilt, innocence, merit, or case outcome.

### Procedural and factual timelines

- A glanceable court-process track now appears on the case overview with: Intake, Initial appearance, Discovery, Motions, Pretrial, Trial, Sentencing, and Appeal.
- Completed, current, and upcoming stages are visually distinct and clickable.
- Procedural posture is intentionally separate from the evidence/factual chronology. The first answers “Where is this matter in the court process?” while the second answers “What happened, and when?”
- The wide process track scrolls inside its own container on narrow screens instead of forcing the full page wider than the viewport.

### Matter-scoped AI workspace

- Added an `AI Assistant` workspace and top-level “Ask CaseBrief AI” access.
- The demo assistant can answer synthetic case questions, summarize the matter, surface missing items, identify review priorities, show rights-related flags, and identify research gaps.
- Demo responses are source-linked where applicable and AI actions are written to activity history.
- The current assistant is deterministic/simulated demo logic. Production AI must use the CaseBrief ↔ UMG contract, matter permissions, source-grounded retrieval, model controls, trace data, and release safeguards.

### Drafting Studio

- Added attorney-controlled drafting for:
  - case review memorandum,
  - discovery follow-up,
  - client status update,
  - motion / issue-analysis outline.
- Drafts are formatted from matter data, marked as drafts requiring attorney review, saved to the browser-local matter workspace, and logged.
- Copy-to-clipboard is supported when the browser allows it.
- The MVP does not file, email, serve, or externally transmit generated drafts.

### Client and team communications

- Added a matter-linked `Communications` workspace containing client, attorney, investigator, and co-counsel contacts in the synthetic fixture.
- Supports a secure-message workflow mock, message history, recipient/channel selection, and matter-linked audit events.
- Demo “send” records a message locally and explicitly labels it **not transmitted**. A production system still requires authenticated secure messaging infrastructure, access controls, delivery state, retention rules, and notification integrations.

### Law and authority

- Added a `Law & Authority` hub linked to current case issues.
- The synthetic matter surfaces potential research paths including Brady v. Maryland, California v. Trombetta, Arizona v. Youngblood, and a jurisdiction-specific constructive-possession placeholder.
- Authorities are labelled “potentially relevant” or “research needed” and remain subject to attorney verification. The UI does not silently treat surfaced authority as controlling law.
- Authority-verification changes are auditable.

### Existing review, evidence, and trust features retained

- Source-linked factor inspection and review queue.
- Explicitly seeded potential preservation/disclosure concern for attorney review; it is not represented as a validated legal conclusion.
- Evidence, witness, document, chronology, and case-switching views.
- Two isolated synthetic matters; the empty intake matter shows CRI pending rather than a misleading 100% score.
- Matter-level activity history and JSON export for human and system actions.
- Logged navigation, record access, CRI inspection, issue decisions, document review, authority verification, AI questions/responses, draft generation/opening, communications actions, UMG sandbox review, case switching, and other controls.
- High-contrast copy, keyboard activation, Escape-close dialogs, focus-visible treatment, reduced-motion support, and responsive layout.

## Code organisation

The previous single-file demo has been split into smaller browser modules:

- `index.html` — application shell
- `styles.css` — visual system and responsive layout
- `seed.js` — synthetic fixtures and initial state
- `core.js` — workspace persistence, scoring, navigation, audit helpers
- `views-matter.js` — overview, review, timelines, evidence, witnesses, documents, authority
- `views-work.js` — AI workspace and drafting studio
- `views-comm.js` — communications workspace
- `views-system.js` — UMG boundary, audit history, safeguards, research survey
- `actions.js` — drawers, review decisions, authority/document actions, app initialisation

## Prototype limitations and production gates

Browser-local history is mutable and removable; it is **not** a secure audit trail. Local identities and clocks are unverified. The static demo cannot guarantee delivery, monitor activity outside CaseBrief, enforce tenant isolation, provide secure collaboration, or guarantee cross-device continuity.

Production must implement authenticated actors (human, AI, system, and delegated initiator); MFA where appropriate; server-issued timestamps and correlation IDs; transactionally coupled state changes and append-only/tamper-evident audit records; server-enforced role/matter permissions and tenant isolation; audited reads, searches, downloads, shares, exports, approvals, denied access, and authentication events; AI model/runtime/prompt/source versions and input/output references; redaction and sensitive-content minimisation; encryption in transit and at rest; key/secrets management; retention/legal-hold controls; protected backups; monitoring; incident response; recovery; and vendor/model data-handling controls.

CRI weights are illustrative and unvalidated. Dates belong to a historical synthetic fixture. UMG sandbox review displays seeded results and does not contact Christopher’s runtime.

## Verification

### Direct state regression

Run:

    node tests/state.cjs

The current v3 direct regression passes and verifies modular script loading, initial CRI calculation, CRI category surface, AI/drafting/communications/authority view availability, required decision reasons, reviewed-versus-dismissed CRI behaviour, escaped audit output, case isolation, v3 persistence state, system-generated analysis events, and storage-failure handling.

### Browser regression

With Playwright and Chromium available, serve the repository and run:

    python -m http.server 8765
    node tests/browser.cjs

The browser regression now covers the circular CRI hover layer and category totals, CRI drill-down, scoring rules, unsafe audit-text rendering, AI question flow, formatted drafting, communications workspace, authority hub, procedural timeline, case switching, reload persistence, every major view, UMG sandbox logging, and mobile-width containment.

During the September 12, 2026 authoring pass, the complete interaction sequence was also exercised in headless Chromium using Python Playwright against an inlined copy of the same v3 browser modules. That pass completed with no page errors, confirmed CRI `26%` before review, `34%` after dismissing the seeded 8-point rights flag, confirmed the hover overlay reached full visibility, and confirmed no document-level horizontal overflow at a 390×844 viewport. The environment blocked direct Chromium navigation to localhost and did not contain the Node Playwright package, so the repository’s Node browser script itself was not executed in that environment; `tests/state.cjs` and JavaScript syntax checks were executed directly and passed.
