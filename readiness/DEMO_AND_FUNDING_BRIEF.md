# CaseBrief: demonstrable scope and funding milestones

Prepared November 11, 2026. Working document, not an investor claim of production readiness.

## Product statement

CaseBrief is a case intelligence platform intended to help defense teams organise a case record, inspect source-linked discrepancies, and keep human review decisions traceable. The initial proposed pilot is Idaho pretrial defense using fictional possession and search-and-seizure scenarios. Legal accuracy, attorney adoption and measurable time savings remain to be established.

## Five-minute demonstration

1. Open CaseBrief on the analysis host and select **Compare fictional documents**.
2. Load **Conflicting traffic-stop times**, acknowledge fictional-only use, and compare. Explain that this demonstration uses explicit-time rules; it does not demonstrate general AI understanding.
3. Read the two exact quotations. Record passage support with a reason, then confirm or dismiss the factual candidate with a separate reason. Confirmation is a local human disposition, not attorney validation.
4. Download the receipt. Inspect the decision history and host audit events. Reopen a saved review to demonstrate read-only historical access.
5. Load **Matching times**. Explain that an empty result does not establish a consistent case record.
6. Load **Lab result**. Explain that this falls outside the time-rule method's coverage. Do not describe a missing finding as an exculpatory-evidence review.
7. Show the explicit UMG status. If it is not configured, say so. If connected, distinguish governance acceptance/quarantine from substantive correctness.

## Evidence and limitations

| Item | Evidence or outstanding work |
| --- | --- |
| Existing integration baseline | PR #14, commit c3d0538c308f6993a95b480e7bb5399cd2d9d7b4; Actions run #89 passed. Draft and unmerged. |
| Current demo fixes | Host-aware navigation, guided scenarios, current receipt decisions/audit, read-only history, late-response display guards. See the accompanying PR for exact-head validation. |
| Real UMG runtime | Repository contains independent November 4 runtime replay results. This is not evidence that the complete application adapter path passed. |
| Complete real-runtime path | Existing opt-in adapter test needs the checksum-verified October 30 base plus November 4 overlay running alongside CaseBrief. Overlay was not found in this session's accessible recent ZIP inventory. |
| Browser access | A running development preview must be verified. An editor URL or queued build is insufficient. |
| Case linkage | Main-app receipt import remains untrusted and quarantined. It does not update a case, CRI, timeline or evidence automatically. |
| Analysis quality | Exact quote matching and deterministic timing rules are demonstrated engineering capabilities, not measured legal precision or recall. No live general-model evaluation is claimed. |
| Authentication and audit | Local session and SQLite controls are development mechanisms, not qualified production identity, tenant isolation or independently anchored audit. |

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
- Provide the November 4 runtime overlay again only if it cannot be recovered in the running environment. Do not send credentials or client records.

## Engineering acceptance checklist

- [ ] Correct branch/version visibly identified in the running preview.
- [ ] Open main app, follow document-review link, and complete all three demo scenarios.
- [ ] Confirm/dismiss/reopen enforce reasons and passage-support rules.
- [ ] Downloaded receipt includes the latest decision and corresponding host audit event.
- [ ] Source edits invalidate the active comparison; delayed responses do not restore stale review controls.
- [ ] Saved receipts survive refresh/restart and open read-only.
- [ ] Main-app receipt import remains explicitly untrusted; no silent case mutation.
- [ ] Actual UMG adapter test recorded against the verified November 4 runtime, with zero dispatch.
- [ ] Phone-width layout and browser console checked on the delivered build.
- [ ] Delivered URL is a tested application preview, not an editor link.
