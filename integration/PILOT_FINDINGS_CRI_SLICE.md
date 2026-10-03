# Automated findings and item-level CRI pilot slice

## Current source state

PR #3 is merged at `e91ed6bbb163109e14b78f0f071c64af61883c3c`.
Its final source head is `fe8e5615c5880c1b7596bdfbc677fecb8e732ea8`;
the PR reports 12 passing suites in Actions run #13. The supplied
`84e303fdfff492d784902e69b8cf7f73f92eb44d` / eleven-suite run #3 is a historical
baseline. The current checklist already records the candidate catalogue and
item-level CRI as implemented. This change closes specific acceptance gaps
on that implementation; it does not repeat the earlier slice.

Sources:
- https://github.com/Beth1717/CaseBrief-mvp/pull/3
- https://app.notion.com/p/3edf1cfb4121818a87eed9976b036022?pvs=204

## Concrete feature sequence

1. Reconcile deterministic source-derived candidates with existing decisions.
   Keep stable finding IDs, current source citations, previous decisions and
   source-change history. Changed or removed support reopens the item for review.
2. Record authorised confirm/dismiss/resolve/reopen decisions with required
   reasons, actor, time, source-span snapshots, CRI before/after and ruleset.
   Confirmation retains the existing deduction; dismissal/resolution clears
   attention deductions; reopening restores them.
3. Compute three capped item ledgers and unrounded weighted contributions.
   Only canonical documents keyed by `recordId` supply missing expectations.
   Applicability decisions require an authorised reviewer and reason; excluded
   expectations leave the active completeness denominator. Missing qualifying
   inventory or an empty applicable template produces Insufficient data.
4. Render the segmented precision ring, explanation on hover/focus and
   calculation detail on activation. Keep the central value visible. Details
   show component values/contributions, item deductions, status, sources,
   corrective action, calculation time and ruleset. Restrict factor content
   and disposition to the legal review workspace.
5. Add focused Node/browser checks to the existing exact-head CI workflow.

## Versioned scoring policy

The approved component weights remain 40% completeness, 35% work control and
25% attention control. The unchanged initial synthetic arithmetic is
80 × .40 + 60 × .35 + 40 × .25 = 63.

`casebrief.cri.idaho-pretrial.v0.2` makes the item policy explicit:
- Completeness has the existing 20-point synthetic budget distributed over
  applicable canonical expectations. Dispositions cannot supply records.
- Work control has a 40-point synthetic budget distributed over distinct
  indexed source-review tasks. Exact duplicate excerpts form one task, and all
  copies must be reviewed. This replaces v0.1's overlapping timing/missing-item
  work deductions, so factual findings are not charged in two ledgers.
- Attention uses the existing 30/20/10 candidate weights, deduplicated by
  finding ID and capped at 100 component points. Confirmation adds no deduction.
- Ruleset selection/migration is audited. v0.1 receipts describe v0.1 and are
  not validation of these changed item rules. Calibration remains pending.

The item-policy revision is reviewable rather than a claim of attorney-approved
calibration. The system remains deterministic synthetic logic, not a live model.

## Exact changed files

| File | Change |
|---|---|
| `pilot-runtime.js` | Finding reconciliation/history, decision permission checks, canonical completeness, capped item scoring, applicability, ring/detail/review rendering |
| `styles.css` | Pilot ring explanation, persistent central value, narrow detail layout |
| `tests/idaho-pretrial.cjs` | Expected pilot ruleset becomes v0.2; existing 63% arithmetic retained |
| `tests/pilot-findings-cri.cjs` | Focused Node acceptance checks |
| `tests/browser-pilot-findings-cri.cjs` | Focused browser acceptance checks |
| `.github/workflows/host-adoption-validation.yml` | Run both focused suites alongside the existing twelve |
| `integration/PILOT_FINDINGS_CRI_SLICE.md` | Scope, sequence, item policy, acceptance and validation receipt |

## Acceptance criteria and focused tests

| Acceptance criterion | Verification |
|---|---|
| Composite reconciles with unrounded 40/35/25 contributions and final integer rounding | Node fixture starts at 63; details render contributions and total |
| Confirm does not double-deduct; dismiss/resolve/reopen recalculate | Node + browser: timing 63 → confirm 63 → dismiss 71 → reopen 63; ownership resolution 68 |
| No double deduction across work/attention ledgers | Node: five distinct source-review tasks, three finding deductions; disposition never completes source-review tasks |
| Decisions require permission, valid disposition and nonblank reason | Node: direct recipient call, invalid status and blank reason rejected |
| Reasons, actor, time, citations and ruleset survive reload | Node: event fields and source-span lengths; Node/browser restored history |
| Source changes reopen review and clear confirmation without dropping history | Node/browser: changed sequencing source; Node: removed support retained and each change logged once |
| Missing canonical records remain missing after dispositions or status-text edits | Node: free-text 'result received'/'custody missing' cannot supply records; canonical LAB-E02 can |
| Inapplicable expectations leave denominator; empty inputs do not become 100 | Node: explicit exclusion, denominator 1 then 0; empty records → null/Insufficient data |
| Hover/focus explains meaning, central value remains visible, activation opens calculation | Browser: focused ring, computed opacity, explanation copy, Enter activation and pointer activation |
| Narrow detail is readable and contains time/version/corrective actions | Browser at 390px: dialog bounds, calculation timestamp/ruleset; Node HTML content |
| Recipients cannot alter decisions or retrieve restricted factor details | Node/browser: direct handlers denied, dashboard hides review queue and factor statements |
| Existing host boundary and other controls remain compatible | Existing Node state, Idaho, host, sleeve, remediation, decision-security and UMG contract suites |

## Validation receipt

Executed locally and passed (eight Node suites):
- `tests/state.cjs`
- `tests/idaho-pretrial.cjs`
- `tests/pilot-findings-cri.cjs`
- `integration/tests/host-adoption.cjs`
- `integration/tests/casebrief-sleeve-contract.cjs`
- `integration/tests/remediation.cjs`
- `integration/tests/decision-security.cjs`
- `integration/tests/umg-runtime-contract-v0.1.cjs`

`git diff --check` passed. The focused browser suite could not launch locally:
Chromium is absent and the Playwright download returned an invalid/truncated
archive. Browser acceptance remains unverified pending the fourteen-suite CI
workflow. No passing browser result is claimed in this receipt.

## Scope boundary

No changes to attorney validation, future broker-enforced UMG integration,
pilot host catalogue/grants, released-source sharing or the historical fixture's
CRI. No default fixture change. No live model, legal conclusion, production
security claim or external actions. Audit remains browser-local MVP storage.
