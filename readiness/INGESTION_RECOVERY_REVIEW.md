# Ingestion branch recovery review

Reviewed PR #2 at head `c5093df7b5e15b85627726259ca0d8525ca50f7e` against current main `7b9ffa5a5ba68057075dec95c19985f439b342d3`. It is a draft, conflicts with main, and changes 15 files. No wholesale merge or browser port was performed in this host-integration change.

| Proposed feature in PR 2 | Current baseline and recovery decision |
| --- | --- |
| Matter assignments and case-picker filtering | Guarded host, pilot insertion and recipient filtering now have newer regressions. Retain them; do not replace with old core/security changes. |
| Synthetic ingestion pipeline | `pilot-ingestion.js` is absent from main. Quarantine, integrity hashes, duplicates, source-linked assertions and human verification remain a separate missing UI slice. Recover in a focused change, preserving source-version invalidation and current permission checks. |
| Court refresh deltas | Not an actual court provider integration. Keep synthetic delta rehearsal separate from authorized live court access. |
| Access and Trust page | Current Security Center and trust pack already describe major boundaries. Any additional page should reference actual server controls and avoid portraying demo identity as authentication. |
| Paid approval-only founding pilot | Buyer, price, terms and procurement remain unvalidated. Do not inherit the old branch's commercial assumptions as current commitments. |
| CRI hover and click | The current pilot ring and newer ruleset must be preserved. Review a UI change separately against current interaction tests. |
| CI workflow | Current workflow already pins dependencies, exact PR head and 20 original suites. This change adds two focused suites. Do not install the older unpinned workflow. |

## Follow-up completion criteria

A recovery implementation needs permission-first intake; distinct originals and derived text; synthetic file/hash/version metadata; duplicate and quarantine transitions; source promotion/revocation that invalidates derived review; negative recipient tests; and audit/restore failure cases. A browser-only demonstration remains synthetic. Malware scanning, original-file storage, extraction/OCR, actual court data and production ingestion recovery require selected backend/provider designs and separate qualification.

The review closes the inventory task, not ingestion implementation. PR #2 remains open and unmerged. Prior source/UI tests do not validate a future port.
