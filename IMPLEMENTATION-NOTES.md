# CaseBrief MVP — readiness, workflow, security, and traceability notes

This repository is a public static demonstration using synthetic records. It does **not** currently provide an authenticated legal application backend, live client messaging, court filing, live legal research, or a live UMG/model integration. Those boundaries are shown explicitly in the UI rather than being simulated as real external services.

## Security-first product principle

Security is a core CaseBrief capability, not a later hardening phase. Every major workflow should answer: who can perform it, which matter/object they can access, what sensitive data is exposed, what AI can retrieve, what leaves the system, what is logged, and what requires human approval. The MVP should visibly demonstrate those principles while clearly separating client-side demonstration controls from production protections that require authenticated server infrastructure.

See `SECURITY-MODEL.md` for the full threat boundary and production gates.

## Security hardening now present in the static MVP

- Interactive demo roles: Lead attorney, Co-counsel, Investigator, and Client.
- Permission checks on protected navigation and actions, with denied attempts logged.
- Privileged attorney-note classification and denial to non-privileged roles.
- Role-filtered document library so restricted documents are not rendered into the visible list.
- AI source filtering through the active role; AI cannot cite a document the current role is not allowed to retrieve.
- Drafting, review decisions, authority verification, UMG/system access, audit access, and export permissions separated by role.
- Client↔counsel messaging permission separated from internal legal-team messaging.
- Client communication view hides internal team contacts and limits the client to counsel communication.
- Security Center showing active identity/role, allowed and denied permissions, active demo controls, and production gates.
- Manual Privacy Mode to conceal protected case content during shoulder-surfing/screensharing risk.
- Manual session lock and automatic 15-minute inactivity lock.
- Sensitive-action confirmation before copying privileged draft work product or exporting audit data.
- Audit data minimization: AI prompt text and prepared message bodies are excluded from semantic event details; action metadata, source IDs, targets, role, sizes/counts, and outcomes remain traceable.
- Security events include role changes, denied access, privacy-mode changes, lock/unlock events, sensitive-action prompts/confirmations, data-egress attempts, and protected workflow actions.
- No-referrer metadata plus a static Content Security Policy that disables network connections and plugins/objects and restricts active resources to the demo origin. Inline script/style allowances remain because this prototype still uses inline event handlers/styles.
- User-controlled content is escaped before rendering in core data surfaces.

These protections improve the MVP and make least-privilege behaviour demonstrable. They do **not** make the public static site suitable for real confidential legal data. Client-side authorization can be bypassed with browser developer tools; production authorization must be enforced server-side.

## Implemented in the current v3 workspace

### Case overview and CRI

- Case Readiness Index (CRI) rendered as a segmented precision ring.
- Hover/focus places a **translucent circular layer directly over the CRI ring**. The layer shows factor **categories** and the combined percentage each category is reducing the current CRI.
- Clicking the CRI opens deeper factor detail with category totals, individual review items, source IDs, and current scoring effects.
- Reviewed findings continue to reduce CRI until resolved or dismissed. Review decisions require a nonblank reason and record before/after state and CRI values.
- CRI remains a workload/readiness indicator only; it does not predict guilt, innocence, merit, or case outcome.

### Procedural and factual timelines

- A glanceable court-process track appears on the case overview with: Intake, Initial appearance, Discovery, Motions, Pretrial, Trial, Sentencing, and Appeal.
- Completed, current, and upcoming stages are visually distinct and clickable.
- Procedural posture is intentionally separate from the evidence/factual chronology.
- The wide process track scrolls inside its own container on narrow screens instead of forcing the full page wider than the viewport.

### Matter-scoped AI workspace

- Added an `AI Assistant` workspace and top-level “Ask CaseBrief AI” access.
- The demo assistant can answer synthetic case questions, summarize the matter, surface missing items, identify review priorities, show rights-related flags, and identify research gaps.
- Demo responses are source-linked where applicable and AI actions are written to activity history.
- AI retrieval is filtered by the active role before sources are exposed.
- The current assistant is deterministic/simulated demo logic. Production AI must use the CaseBrief ↔ UMG contract, server-enforced matter permissions, source-grounded retrieval, model controls, trace data, prompt-injection defenses, and release safeguards.

### Drafting Studio

- Added attorney-controlled drafting for case review memoranda, discovery follow-up, client status updates, and motion / issue-analysis outlines.
- Drafts are formatted from matter data, marked as drafts requiring attorney review, saved to the browser-local matter workspace, and logged.
- Copy-to-clipboard is permission-gated and now requires a sensitive-action confirmation.
- The MVP does not file, email, serve, or externally transmit generated drafts.

### Client and team communications

- Added a matter-linked `Communications` workspace containing synthetic client, attorney, investigator, and co-counsel contacts.
- Client-counsel and internal-team messaging permissions are separate in the demo role model.
- Client view hides internal team contacts and limits messaging to counsel.
- Demo “send” records a message locally and explicitly labels it **not transmitted**. A production system still requires authenticated secure messaging infrastructure, encryption, delivery state, retention/legal-hold rules, attachment scanning, and notification controls.

### Law and authority

- Added a `Law & Authority` hub linked to current case issues.
- The synthetic matter surfaces potential research paths including Brady v. Maryland, California v. Trombetta, Arizona v. Youngblood, and a jurisdiction-specific constructive-possession placeholder.
- Authorities are labelled “potentially relevant” or “research needed” and remain subject to attorney verification.
- Authority-verification changes are permission-gated and auditable.

### Existing review, evidence, and trust features retained

- Source-linked factor inspection and review queue.
- Explicitly seeded potential preservation/disclosure concern for attorney review; it is not represented as a validated legal conclusion.
- Evidence, witness, document, chronology, and case-switching views.
- Two isolated synthetic matters; the empty intake matter shows CRI pending rather than a misleading 100% score.
- Matter-level activity history and JSON export for human and system actions.
- High-contrast copy, keyboard activation, Escape-close dialogs, focus-visible treatment, reduced-motion support, and responsive layout.

## Code organisation

- `index.html` — application shell and browser policy metadata
- `styles.css` — visual system and responsive layout
- `security.css` — security-center, lock/privacy, role, permission, and denied-state styling
- `seed.js` — synthetic fixtures and initial state
- `security.js` — demo identities, permissions, document classification, privacy/session controls, Security Center
- `core.js` — workspace persistence, scoring, permission-aware navigation, audit helpers
- `views-matter.js` — overview, review, timelines, evidence, witnesses, documents, authority
- `views-work.js` — AI workspace and drafting studio
- `views-comm.js` — communications workspace
- `views-system.js` — UMG boundary, audit history, safeguards, research survey
- `actions.js` — drawers, review decisions, authority/document actions, app initialisation
- `security-runtime.js` — enforcement wrappers for protected documents, AI retrieval, drafting, communications, audit export, and sensitive egress
- `SECURITY-MODEL.md` — current safeguards, threat boundary, and mandatory production gates

## Prototype limitations and production gates

Browser-local history is mutable and removable; it is **not** a secure audit trail. Local identities and clocks are unverified. The static demo cannot securely authenticate people, prevent developer-tool bypass, enforce tenant isolation, deliver privileged communications, or protect real data from someone who controls the browser.

Before real legal data is permitted, production must implement server-verified authentication; MFA/passkeys/SSO; server-issued timestamps and correlation IDs; server-enforced role/matter/object permissions and tenant isolation; encryption in transit and at rest; managed keys/secrets; append-only/tamper-evident auditing; secure messaging; upload malware scanning; retention/legal-hold controls; protected backups; monitoring; incident response; AI/provider data-handling controls; prompt-injection/tool protections; vulnerability management; and independent security testing.

CRI weights are illustrative and unvalidated. Dates belong to a historical synthetic fixture. UMG sandbox review displays seeded results and does not contact Christopher’s runtime.

## Verification status

The prior v3 interaction/state regressions passed before this security-hardening pass. The September 13 security pass changed navigation, role enforcement, AI source filtering, document visibility, communications, clipboard/export flow, and session/privacy controls; these changes should be included in the next automated browser regression before presenting the MVP as technically validated. The repo deliberately does not claim that client-side demo controls are production security.
