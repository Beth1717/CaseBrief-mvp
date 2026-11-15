# CaseBrief: demonstrable scope and funding milestones

Updated November 15, 2026. Working document, not an investor claim of production readiness.

## Product statement

CaseBrief is a case intelligence platform intended to help defense teams organise a case record, inspect source-linked discrepancies, and keep human review decisions traceable. The initial proposed pilot is Idaho pretrial defense using fictional possession and search-and-seizure scenarios. Legal accuracy, attorney adoption and measurable time savings remain to be established.

## Five-minute demonstration

1. Start the assembled local desktop demo and use the comparison page it opens, or open CaseBrief on the analysis host and select **Compare fictional documents**. GitHub Pages serves the static frontend; it is not the integrated UMG service. Rehearse the complete browser flow before presenting.
2. Load **Conflicting traffic-stop times**, acknowledge fictional-only use, and compare. Explain that this demonstration uses explicit-time rules; it does not demonstrate general AI understanding.
3. Read the two exact quotations. Record passage support with a reason, then confirm or dismiss the factual candidate with a separate reason. Confirmation is a local human disposition, not attorney validation.
4. Download the receipt. Inspect the decision history and host audit events. Reopen a saved review to demonstrate read-only historical access.
5. Load **Matching times**. Explain that an empty result does not establish a consistent case record.
6. Load **Lab result**. Explain that this falls outside the time-rule method's coverage. Do not describe a missing finding as an exculpatory-evidence review.
7. Show the explicit UMG status. If it is not configured, say so. If connected, distinguish governance acceptance/quarantine from substantive correctness.

## Evidence and limitations

| Item | Evidence or outstanding work |
| --- | --- |
| Existing integration baseline | PR #14 merged into main November 14 Mountain Time, incorporating PRs #15 and #16. Baseline main commit: 69b2eccfabf462474af4d48472124dcfad214587. Latest integration-branch host-adoption validation passed November 12; Pages deployment passed after merge. Pages deployment does not prove a running backend. |
| Current demo fixes | Host-aware navigation, guided scenarios, current receipt decisions/audit, read-only history, late-response display guards. PR #15 exact-head Actions run #90 passed 17 analysis tests and 29 application/integration/browser suites. These CI checks are distinct from actual-runtime browser verification. |
| Real UMG runtime | November 12 replay passed and was reproduced November 15 in the assembled package: SUCCEEDED, fresh accepted 0/quarantined 1, separate CaseBrief proposal 1, zero dispatch, valid audit chain, two persisted decisions, read-only restart recovery and stale-review rejection; see LOCAL_INTEGRATED_DEMO.md. Real-runtime browser verification remains open. |
| Complete real-runtime path | Actual HTTP host → adapter → November 4 UMG → saved review passed locally, including source invalidation and restart recovery. Launcher verifies runtime hashes and explicitly reports two supplied report-manifest discrepancies. |
| Browser access | Assembled desktop package and launcher delivered privately to Beth November 15. Linux launcher/served-page smoke check passed; Windows execution and actual-runtime browser replay are unverified. Chromium failed before page load due to environment socket restrictions. Replit returned no usable preview and publication status found=false; project page returned 404. An editor URL or queued build is insufficient. |
| Case linkage | Main-app receipt import remains untrusted and quarantined. It does not update a case, CRI, timeline or evidence automatically. |
| Analysis quality | Exact quote matching and deterministic timing rules are demonstrated engineering capabilities, not measured legal precision or recall. No live general-model evaluation is claimed. |
| Authentication and audit | Local session and SQLite controls are development mechanisms, not qualified production identity, tenant isolation or independently anchored audit. |

## Remaining investor-demo delivery work

[Issue #17](https://github.com/Beth1717/CaseBrief-mvp/issues/17) is the shared task for independent browser verification, defect reports and hosting investigation. Muse has not been activated or confirmed assigned by creating the issue. Record the exact tested commit and actual-runtime evidence there. Keep owner ZIP archives and private links out of the public repository.

A local investor presentation can proceed after the delivered build passes the browser walkthrough and Beth can operate it. A shareable online demo additionally requires a running, access-controlled deployment. Neither is currently marked ready.

## Milestone-based use of funding

No funding amount, revenue, valuation, adoption count or time-saving result is asserted here. Build a costed ask after obtaining actual engineering, hosting and attorney-review quotes.

| Milestone | Deliverable | Evidence required before calling it complete |
| --- | --- | --- |
| 1. Usable synthetic demonstration | Stable browser link and complete source-to-review walkthrough | Exact-version automated tests; browser test; real-runtime integration receipt where UMG is claimed |
| 2. Attorney-adjudicated evaluation | Labelled Idaho pilot scenarios and measured findings quality | Named reviewer approval; documented misses/false positives; calibrated thresholds; validated templates and sources |
| 3. Private pilot infrastructure | Authenticated case access, scoped storage, durable audit, recovery and deletion | Access/isolation tests; restore exercise; provider/security and ownership decisions |
| 4. Bounded defender pilot | One agreed organisation, workflow, owner and evaluation protocol | Written participation terms; baseline task measurements; explicit success criteria and stop conditions |

## Beth's decisions and introductions

- Identify an attorney or defense organisation willing to evaluate fictional cases and define a bounded pilot.
- Confirm who owns and licenses the UMG runtime and what deployment/use rights apply before commercial commitments.
- Choose the fundraising ask only after costing the above milestones and specifying the runway it buys.
- November 4 overlay recovered and tested; no resend is needed. The supplied report-manifest discrepancies remain documented for owner correction.

## Engineering acceptance checklist

- [ ] Correct branch/version visibly identified in the running preview.
- [ ] Open main app, follow document-review link, and complete all three demo scenarios.
- [ ] Confirm/dismiss/reopen enforce reasons and passage-support rules.
- [ ] Downloaded receipt includes the latest decision and corresponding host audit event.
- [ ] Source edits invalidate the active comparison; delayed responses do not restore stale review controls.
- [ ] Saved receipts survive refresh/restart and open read-only.
- [ ] Main-app receipt import remains explicitly untrusted; no silent case mutation.
- [x] Actual UMG adapter and persistent review tested against the pinned November 4 runtime, with zero dispatch; report-manifest discrepancies documented separately.
- [ ] Phone-width layout and browser console checked on the delivered build.
- [ ] Delivered URL is a tested application preview, not an editor link.

