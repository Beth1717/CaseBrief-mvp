# November 4 UMG package replay — November 5, 2026

## Package identity and integrity

- October 30 base archive SHA-256: `35c87ae0c92a9b48fe8d77d1d638620470f46c796885957f495284fad87a8476` — matched the supplied archive.
- October 30 base `SHA256SUMS.txt`: 907 entries verified before applying the overlay.
- November 4 delta archive SHA-256: `359a14ee5eeb60358330f752cacd87209ad00967cf03e2d9e04854fe074a78d5` — matched the supplied archive.
- November 4 `DELTA_SHA256SUMS.txt`: all 40 delta-package entries verified, including the 12 overlay source files.
- The merged 915-entry checksum list was checked after running the qualification commands. 911 entries matched. Four generated evidence outputs differed because the rerun regenerated dynamic runtime receipts/results: `evidence/live-matrix/RESULTS.json`, `evidence/live-matrix/cases/supported-contradiction.response.json`, `evidence/live-matrix/readiness.json`, and `working-release/framework-replay/WORKER_LIFETIME_TEST_RESULTS.json`. The overlay source files and base archive checksums matched. The generated-output differences are disclosed rather than represented as a clean merged-manifest pass.

## Environment

- Python 3.13.5
- jsonschema 4.26.0
- Node.js 22.16.0 for the UMG package's local compiler/runtime
- Service bound to `127.0.0.1:8767` only

## Reproduced qualification

| Check | Result |
| --- | --- |
| `working-release/RUN_QUALIFICATION.py` | PASS |
| `tools/run_live_matrix.py` | 22/22 PASS |
| `tools/test_local_limits.py` | 3/3 PASS |
| `test_worker_lifetime.py` | 5/5 PASS; zero active workers after every timeout |
| Normal compile after forced timeouts | SUCCEEDED |
| Maintained reference tests | 26/26 PASS |
| `tools/test_live_matrix_exception_integrity.py` | PASS |

The service `/ready` response reported READY, revision 2, Framework RC2, NeoUMG Alpha 1, H4 compatibility and external effects disabled/zero.

## Actual HTTP replay through the running November 4 service

| Synthetic case | Runtime | Accepted | Quarantined | Reason | Dispatch |
| --- | --- | ---: | ---: | --- | ---: |
| Pinned supported contradiction | EXECUTED | 1 | 0 | Reviewed sample matched | 0 |
| Fresh unreviewed candidate | EXECUTED | 0 | 1 | `UNREVIEWED_OR_MUTATED_FINDING` | 0 |
| Changed source text | EXECUTED | 0 | 1 | `UNREVIEWED_OR_MUTATED_FINDING` | 0 |
| Embedded instructions | EXECUTED | 0 | 1 | `UNREVIEWED_OR_MUTATED_FINDING` | 0 |
| Unknown citation | EXECUTED | 0 | 1 | `INVALID_CITATION_OR_SOURCE_REFERENCE` | 0 |

All five responses echoed the request ID and matter ID. No external effect was dispatched.

## Interpretation

This confirms the November 4 UMG package itself starts and reproduces its documented local synthetic governance boundary. It does not establish general fresh-candidate semantic validation. The fresh candidate, changed-source and hostile-instruction cases are deliberately quarantined after the real compiler executes.

This replay does not yet constitute a passing combined CaseBrief application integration test. The CaseBrief branch's exact-head CI is separately responsible for validating the adapter-to-workbench path, durable host disposition, invalidation and browser workflow. Confidential data, remote deployment, production authentication, legal correctness and attorney signoff remain prohibited/unqualified.
