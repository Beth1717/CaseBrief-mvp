# October 30 host integration validation

Scope: fictional local development. Baseline main `7b9ffa5a5ba68057075dec95c19985f439b342d3`. New working-tree code is subject to its own exact-head CI receipt; historical PR #9 run #22 does not validate these changes.

## Completed locally

- All 14 Node suites listed in the updated CI workflow passed: the original 12 plus runtime-boundary and synthetic-review-host suites. This includes the original host-adoption probes, current authorization regressions, source/review/CRI logic and scorecard's not-measured behaviour.
- Actual package qualification: **14/14 checks**, using CaseBrief's real revision-2 Node adapter and Chris's checksum-pinned Framework/H4 package. `host-live-package-2026-10-30.log` records output. The runner verifies all 908 manifest entries and exact schema bytes before execution.
- New persistence tests use temporary on-disk SQLite and reopen the database; they verify retained decisions, audit linkage, transaction rollback on result/review audit failures, denial before runtime invocation, stale-source invalidation, changed/expired grants, scope isolation and optimistic review conflicts.
- The proposed correction in `../patches/umg-negative-test-exceptions.patch` was applied to a disposable extracted copy. Without `jsonschema`, the corrected evaluator immediately failed with no PASS lines. With its required dependency supplied, its **22/22** checks passed. It is not an approved UMG release.
- Syntax checks and `git diff --check` passed. No browser source or wire schema was changed.

## Browser limitation

Local Playwright Chromium download failed with a truncated/invalid archive. None of the eight browser suites is counted as a local pass. The PR workflow installs matching Chromium and is configured to run all **22** suites at the exact PR head; consult that run before claiming full regression validation.

## Not measured or approved

No general analysis model or provider executed. Fictional reviewer packets are pending independent adjudication, with no observed results. Native NeoUMG lineage, attorney approval, calibrated CRI, hosted authentication/tenant security, durable production audit, source protocol agreement, provider terms, operating ownership, licensing/support and commercial validation remain open. The public static UI is not wired to the new store or runtime.
