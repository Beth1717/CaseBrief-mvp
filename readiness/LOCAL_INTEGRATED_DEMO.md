# Local integrated synthetic demo

November 12, 2026. Uses the existing integration application plus the pinned October 30 base and November 4 r1 UMG overlay. Vendor files are not committed or republished.

## Start

Install Node 24+, Python 3, and the application dependencies with `npm ci`. Keep both owner-supplied ZIP archives on your computer. From this repository:

```sh
python3 scripts/run-integrated-demo.py --base /path/to/CaseBrief_UMG_Integration_Response_FULL_2026-10-30.zip --delta /path/to/CaseBrief_UMG_Local_Synthetic_Support_Delta_2026-11-04_r1.zip
```

On Windows, use `python` in place of `python3`. Open http://127.0.0.1:8780/ and select **Compare fictional documents**. The launcher starts the actual UMG service on an available loopback port, waits for a real compiler readiness probe, then starts CaseBrief with that endpoint. Ctrl+C stops both services. SQLite review history remains in `readiness/results/`.

Load **Conflicting traffic-stop times**, acknowledge fictional-only use, compare, inspect the two quotations, record passage support with a reason, then confirm/dismiss with a separate reason. Download the receipt. Fresh findings are CaseBrief proposals; UMG quarantines them as unreviewed. This is expected, not a failed connection or semantic endorsement. Saved reviews reopen read-only.

## Reproduce

Append `--test` to run the pinned sample plus the actual application adapter, disk-backed review decisions, source invalidation, restart recovery and audit checks. Append `--test --browser` to include the Chromium workflow and downloaded receipt checks. Browser support must be installed separately (`npx playwright install chromium`). The launcher never reports a browser pass when it was skipped or failed.

## November 12 evidence

- Immutable base digest and all 908 manifest entries: passed.
- Exact November 4 r1 ZIP digest and all 12 maintained overlay entries: passed.
- Pinned sample through actual CaseBrief adapter: SUCCEEDED, real compiler EXECUTED, one accepted finding, zero dispatch.
- Fresh fictional documents through actual CaseBrief HTTP host → adapter → UMG → validator → persistent review: passed; one separate CaseBrief proposal; zero UMG accepted, one UMG quarantined; HUMAN_REVIEW_REQUIRED; zero dispatch.
- Automated synthetic support/confirm actions: two decisions persisted. These test actions are not human/attorney approval.
- Source invalidation: further review rejected; findings hidden.
- Server restart: two decisions and five audit events recovered read-only; audit chain valid.
- All 17 analysis tests passed, including malformed-response and delayed-result rejection using controlled test services. Those negative-service tests are distinct from the real-runtime replay.
- Real-runtime browser attempt: blocked before page load by the execution environment's socket restriction. No current real-runtime browser pass is claimed.
- No hosted preview has been verified. Localhost on this development machine is not a link Beth can open on her phone.

## Package report discrepancies

The merged manifest is **not fully clean**. Exactly two report artifacts differ: `FAILURE_FALLBACK_TEST_RESULTS.json` retains the base archive's bytes, and `WORKER_LIFETIME_TEST_RESULTS.json` is absent. The executable runtime files match the supplied manifests. The launcher accepts only these exact observed report states and prints them; any other content mismatch fails. It neither rewrites Chris's checksums nor claims the missing report exists. Owner correction of the packaging report remains outstanding, separate from the independently reproduced local execution.

## Boundaries

Fictional data only; loopback only; no remote service, real model, client records, filing or communications. This launcher does not qualify hosting, production authentication, legal accuracy or licensing. The main-app receipt inbox remains untrusted and does not automatically update case data or CRI.
