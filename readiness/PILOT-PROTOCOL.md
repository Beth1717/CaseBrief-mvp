# Small synthetic defender pilot: protocol v0.1

Proposed evaluation design. No participant, court/county, review appointment, budget or result is asserted.

## Before a session

Use fictional packets only. Recruit a participating Idaho defense attorney; record consent, role, packet version, application commit and evaluation date. Have a reviewer independently establish expected findings, missing records and negative controls before seeing application output. The current deterministic seed is a rehearsal packet, not a held-out accuracy test.

Include at least: conflicting sequencing with unverified clocks, uncertain ownership, duplicate inventory, missing laboratory/custody records, a consistent-record negative control, removal/change of a cited source, and a restricted record absent from recipient output. Broaden/change fictional packets to test generalisation; the current rule-based detector is tuned to the existing fixture text and should be expected to have limited transfer.

The attorney should distinguish a factual observation from a legal conclusion, assess each cited passage, identify missed issues, and separately review whether the CRI policy is useful. No factual test establishes court-template validity or score calibration.

## Session steps

1. Record manual review duration and findings on the fixed packet without CaseBrief assistance.
2. Run the assisted review with the same task definition; record duration, all surfaced findings, unsupported suggestions, missed findings and citation corrections. Use multiple equivalent packets/counterbalanced order where possible to reduce learning effects.
3. Inspect the source passage for every detected issue; confirm/dismiss/reopen with reasons. Change a source and verify prior confirmation is invalidated.
4. Review duplicate handling, missing-record status and CRI arithmetic. Confirming a finding must not imply the missing evidence was supplied.
5. Attempt recipient access to unreleased/internal material; release selected sources, revoke, and confirm denial on later reads. Record any disclosure as a stop condition.
6. Export the review receipt and record whether the source/decision/event links can be followed. Rate usefulness and note confusing or unnecessary work.

## Evaluation file

Copy `pilot-evaluation-template.json` to a local working file. It contains no results. After actual adjudication, set `adjudication.status` to `reviewed`, enter the reviewer identifier and ISO review time, and add rows:

```json
{
  "id": "packet-version-and-observation-id",
  "kind": "finding",
  "expected": true,
  "detected": false,
  "basis": "Reviewer reference to the synthetic source and expected factual observation"
}
```

`kind` is `finding` or `missing_record`. `expected` is independent human ground truth, not copied from model output. `detected` is what the tested application actually surfaced. Include expected-but-missed rows and false-positive/negative-control rows, not just successes. Store protected source references in an appropriate review system when live data is eventually authorised; this repository is synthetic-only.

For each genuinely paired timing observation:

```json
{
  "id": "unique-session-id",
  "packetId": "synthetic-packet-version",
  "reviewerId": "actual-reviewer-identifier",
  "baselineMinutes": 10,
  "assistedMinutes": 12
}
```

The numbers above explain the format only; they are not CaseBrief measurements. Do not copy them as collected results. Save raw observations and limitations with the report.

Run `node scripts/pilot-scorecard.cjs path/to/working-evaluation.json`.

Precision = true positives / detected positives. Recall = true positives / expected positives. Missing-record performance is reported separately. Undefined denominators are null, never 100%. Timing reduction = (total baseline − total assisted) / total baseline; slowdowns remain negative. Review metadata is asserted input, not authenticated attorney approval. Do not commit participant personal data.

## Stop/revise criteria and outputs

Any unauthorised disclosure, unsupported legal conclusion presented as verified, source-change failure, invented authority, or unrecorded human decision blocks expansion. Record the defect and repeat the affected flow after repair. A small synthetic success does not clear live-data gates.

Before testing, ask the participating attorney/buyer to agree acceptable factual precision/recall, error severity, usefulness and workflow time targets. No numeric success threshold has been agreed. CRI calibration and court-template validation require separate written review, not a scorecard checkbox.

Deliver a sample-size-labelled scorecard, raw observation ledger, defect list, attorney comments, and an explicit decision on the next synthetic iteration. Measure review time including verification and corrections. For buyer interviews, ask about existing tools, biggest record-review bottlenecks, procurement owner/process, training and migration burden, acceptable contract structure and budget. These are uncollected commercial questions, not willingness-to-pay evidence.
