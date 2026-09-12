# CaseBrief readiness and traceability update

This repository is a public, static demonstration using synthetic records. No authenticated application backend or live UMG integration is deployed here.

## Implemented

- Case Readiness Index (CRI), segmented precision ring, hover/focus factor summary and translucent detail drawer.
- Source-linked factor inspection and context explaining the next review step.
- Reviewed findings continue to deduct points until resolved or dismissed. Every status change requires a nonblank explanation and records before/after status, source IDs and CRI values.
- Explicitly seeded potential preservation/disclosure concern for attorney review; not a validated legal finding or live AI output.
- Two isolated synthetic matters with a visible switcher. Empty intake has pending CRI rather than a misleading 100% score.
- Per-case activity history and JSON export: event IDs, session IDs, unverified actor identity/type, UTC browser time, target, action, outcome and context. Navigation, record access, review changes, document review, sandbox review and survey-save outcomes are instrumented. Generic button activation supplements semantic events.
- High-contrast copy, professional landing language, translucent details, keyboard activation, dialog focus containment, Escape close and reduced-motion support.

## Prototype limitations and production gates

Browser history is mutable and removable; it is not a secure audit trail. Local identities and clocks are unverified. Browser history cannot observe access outside this application, reliably record browser termination, guarantee delivery, or provide cross-device continuity. Use one tab at a time; cross-tab editing is not a supported collaboration mechanism. Older demo storage is retained under its previous key; this version starts a new workspace so existing local data is not deleted.

Production must implement authenticated actors (human, AI, system and delegated initiator), server-issued timestamps and correlation IDs; transactionally coupled state changes and append-only audit records; server-enforced case permissions and tenant isolation; audited reads, searches, downloads, shares, exports, approvals and denied access; AI model/runtime/prompt/source versions and input/output references; redaction and sensitive-content minimisation; encryption, key management, retention controls, protected backups, tamper detection, monitoring, recovery and incident review. These are requirements, not claims of currently deployed protections.

CRI weights are illustrative and unvalidated. A score expresses the seeded deductions only; it must not be interpreted as legal merit or an outcome prediction. Dates belong to a historical synthetic fixture. UMG sandbox review displays seeded results and does not contact Christopher's runtime.

## Verification

Run the standalone browser regression check with Playwright and Chromium available:

    node tests/browser.cjs

Start the demo on port 8765 before running it:

    python -m http.server 8765

The check exercises CRI drill-down, unchanged CRI on review, dismissal adjustment, decision capture, escaped activity content, matter isolation, reload persistence, views, seeded analysis and mobile overflow. It uses a fresh browser context and does not touch a user's saved workspace.

Direct state regression (`node tests/state.cjs`) passed: script execution, all eleven views, nonblank decision reasons, reviewed/dismissed scoring, escaped audit output, case isolation, persistence, system analysis events and storage-failure notice. Script syntax and `git diff --check` passed. This test uses a minimal DOM stub and does not verify browser layout, focus or downloads. The full Playwright run was blocked in the authoring environment by a missing Chromium executable and a timed-out browser download; browser visual and accessibility verification remain outstanding.
