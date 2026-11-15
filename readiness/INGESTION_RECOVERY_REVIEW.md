# Ingestion branch recovery review

Reviewed PR #2 at head `c5093df7b5e15b85627726259ca0d8525ca50f7e` against current main `7b9ffa5a5ba68057075dec95c19985f439b342d3`. It is a draft, conflicts with main, and changes 15 files. No wholesale merge was performed. A focused synthetic intake implementation now recovers the source-intake behaviour; see `integration/INGESTION_RECOVERY.md`.

| Proposed feature in PR 2 | Current baseline and recovery decision |
| --- | --- |
| Matter assignments and case-picker filtering | Guarded host, pilot insertion and recipient filtering now have newer regressions. Retain them; do not replace with old core/security changes. |
| Synthetic ingestion pipeline | `pilot-ingestion.js` was absent from the reviewed baseline. The new `ingestion-demo.js` recovers fixed-sample quarantine, integrity digests, duplicates, source-linked assertions and reasoned promotion/revocation with version invalidation. It does not accept uploaded files or claim factual verification. |
| Court refresh deltas | Fixed court-notice variants now rehearse source-version deltas. They are not a court/provider integration or a verified deadline. |
| Access and Trust page | Current Security Center and trust pack already describe major boundaries. Any additional page should reference actual server controls and avoid portraying demo identity as authentication. |
| Paid approval-only founding pilot | Buyer, price, terms and procurement remain unvalidated. Do not inherit the old branch's commercial assumptions as current commitments. |
| CRI hover and click | The current pilot ring and newer ruleset must be preserved. Review a UI change separately against current interaction tests. |
| CI workflow | Current workflow pins dependencies and exact PR head. The host foundation added two suites to the original 20; intake adds two more for 24. Do not install the older unpinned workflow. |

## Follow-up completion criteria

The recovered sample flow has permission-first intake, separate original/derived rows, synthetic digest/version metadata, duplicate/quarantine handling, promotion/revocation invalidation, restricted-role tests and browser-storage rollback. Backend ingestion, real file originals and restore qualification remain open. A browser-only demonstration remains synthetic. Malware scanning, original-file storage, extraction/OCR, actual court data and production ingestion recovery require selected backend/provider designs and separate qualification.

The inventory and focused synthetic intake recovery are implemented. PR #2 remains open and unmerged; its other product/commercial assumptions were not adopted. Refer to the new exact-head test receipt for intake validation.
