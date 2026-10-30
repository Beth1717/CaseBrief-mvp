# CaseBrief: next pilot slice

Updated October 30, 2026. Scope: synthetic investor demonstration and preparation for an attorney-reviewed pilot. This pack does not authorise live-client use.

CaseBrief connects case records, source-linked factual review, unfinished work and traceable human decisions for public-defense teams. The product hypothesis needs measured defender usefulness; generic model capability and competitor announcements do not prove it.

## October 30 host integration work

PR #9 is merged at `7b9ffa5a5ba68057075dec95c19985f439b342d3`; its source head `5fcec2619a498738a6146e18ba20f70e41619f12` passed historical Actions run #22 with 20 suites. The changes in this branch have separate validation; historical CI does not cover them.

See [host integration foundation](../integration/HOST_INTEGRATION_FOUNDATION.md) for actual adapter-to-package qualification, local synthetic SQLite persistence, source snapshots, stale-result rejection and audit rollback. The browser remains static and disconnected from the runtime. Use the [attorney worksheet](ATTORNEY_REVIEW_WORKSHEET.md), six draft fictional packets, [backend decisions](BACKEND_DECISIONS.md) and [ingestion recovery review](INGESTION_RECOVERY_REVIEW.md) for the remaining preparatory work. No measured attorney/model results are populated.

## Historical baseline

PR #8 merged at `bf2f3a6d41d0cc9b10ea663ac58884ab6bca1fc9`, source head `8a3d30692490e0efadb0b596d0520a71069cc54a`. It addresses guarded pilot insertion, adapter authorization-status binding and recursive private-reasoning key rejection. The PR contains a completed automated Codex code review; this is not human attorney approval or a production security assessment. Historical Actions run #21 reports 17 suites; it is not validation of this follow-up.

The guided investor workflow, permission checks, source revisions, internal memos and family access/revocation already exist. Do not rebuild them. The separate open PR #2 ingestion/access branch conflicts with main; do not merge it wholesale or disturb runtime validation to recover overlapping features.

## Added in this follow-up

- A source-to-decision review receipt in the pilot's Activity history. It joins relevant indexed source text, finding state, decision reasons, matching audit event IDs, missing records, CRI and open gates. It does not certify evidence authenticity.
- A synthetic pilot evaluation template and calculator. Empty results remain `not_measured`, with null accuracy and timing ratios. Measurements require explicit human adjudication metadata.
- [Trust and data-flow pack](TRUST-PACK.md), [pilot protocol](PILOT-PROTOCOL.md), and [remaining work / Chris handoff](REMAINING-WORK.md).
- Focused Node and actual-download browser regressions added to the existing CI suite. Consult the exact-head CI receipt, not this prose, for final results.

## Reproduce

```sh
npm ci --ignore-scripts
npm run evaluate:pilot
node tests/review-receipt.cjs
node tests/pilot-scorecard.cjs
npm start
```

Open `http://localhost:8765/?demo=investor`, select a legal reviewer, start the tour, inspect source text, save a reasoned finding decision, then export the review receipt from Activity history. A receipt can also represent an unconfirmed finding; its state must stay explicit.

Browser tests require installed Playwright Chromium and the local server. The workflow runs all original 17 suites plus the three new suites. Local browser-install failure is not a browser pass.

## Priority order

1. Finish validation and review of this follow-up; rehearse the synthetic presentation.
2. Obtain attorney feedback on one small fictional packet using the protocol. Validate findings separately from scoring weights and court templates.
3. Select a backend/hosting owner and architecture with actual provider/retention terms. Then implement server identity, tenant/matter/object authorization and durable audit together.
4. Validate the complete hosted flow and incident/restore controls before any confidential-data pilot.
5. Reconcile useful non-overlapping ingestion work from PR #2 after a feature-by-feature diff. Keep originals, quarantine and derived text distinct.

These are implementation priorities, not commitments made by Beth, Chris, an attorney or a pilot organisation.
