# Applying the legal-tech brief: implementation and remaining evidence

This follow-up is based on draft PR #11 (`6423a14de20b7049dc45ca5ffe651a3b37f5561d`) so the new review controls act on the existing fresh-document analysis workspace. It is intentionally proposed against that branch; PR #11 must be reviewed/merged before this follow-up reaches main. PR #10's host/store/intake experiment remains separate. Its six reusable fictional packets and worksheet are carried forward here; it is not silently merged or declared approved.

## Work completed in this change

| Recommendation | Result | Reviewable evidence |
| --- | --- | --- |
| Separate citation linkage, proposition support and attorney validation | Analysis UI/API/receipts expose independent states; confirmation requires a human support assessment; reassessment reopens confirmation | `analysis/verification.cjs`, `analysis/tests/verification.test.cjs`, browser workflow |
| Test contradictory/exculpatory material and false alerts | Thirteen fictional packets, including prior six, plus a runner recording actual provider output and quotation-linked proposals | `readiness/review-packets/`, `scripts/evaluate-analysis.cjs` |
| Do not invent attorney labels or model accuracy | Reference labels, false positives/misses, precision/recall and legal accuracy stay null until independent adjudication | Coverage report; existing adjudicated scorecard unchanged |
| Test large-record usability | Permission filtering before query/pagination; at most 50 document rows rendered; search and source drawer retained | Node 100/1,000/5,000 benchmark, 5,000-record browser regression |
| Test changing evidence and handoffs | Existing source/authorization invalidation retained; new semantic reassessment invalidation; explicit verification states in receipts | Existing engine/receipt tests plus new API and browser checks |
| Research buyer, budget and device constraints | Short optional digital survey and neutral interview prompts derived from the current six-page PDF | `research/quick-survey.html`, JSON question spec and `research/README.md` |
| Keep security claims bounded | No public runtime network policy relaxation, legal signoff, authenticated audit or hosting credential assumptions | Trust boundary below |

## Evaluation coverage and limitations

The rules method recognises direct explicit time differences only. It does not detect general exculpatory meaning, infer ownership, determine missing material from arbitrary discovery, or evaluate legal authority. The exculpatory-lab and unsupported-allegation packets deliberately expose that coverage limit. A NEEDS_INPUT result is not a successful legal review. General model accuracy and prompt-injection robustness require the exact selected model and independently labelled held-out packets. No such result is fabricated here.

Source references preserve indexed quotations and versions. File originals, OCR correctness, evidentiary authenticity and chain of custody remain separate. The library pagination reduces browser rendering work; it does not implement server-side search, full-case model ingestion or production scale. All fictional document data still exists in the browser.

## Presentation and local research use

- Use `npm run start:analysis` for the fresh-document workspace at `http://127.0.0.1:8780/analysis/`. Record passage support and a reason before confirming; inspect the downloaded receipt.
- Use `npm start` for the main demo and short survey at `http://127.0.0.1:8765/research/quick-survey.html`. Survey answers download explicitly and are not sent or stored automatically. Agree a return channel separately.
- `npm run evaluate:analysis` observes the actual rules method; `npm run benchmark:documents` records Node rendering/filtering timings. CI records those reports and runs the actual browser checks. Timing observations are engineering measurements, not lawyer time saved.

## Remaining evidence that engineering preparation cannot supply

1. An independent participating attorney must establish packet labels, review failure severity, validate the workflow, and separately assess CRI policy and Idaho legal sources/templates. The packet set is drafted, not attorney-labelled.
2. A named buyer/office must answer procurement, hardware, onboarding and budget questions. No survey was sent and no response or commitment is asserted.
3. Selected backend/hosting/identity/provider owners must approve architecture and terms. PR #10's SQLite experiment and this memory-based workbench do not constitute an authenticated production service or tamper-evident audit system.
4. Chris must resolve the documented fresh-candidate quarantine behavior and provide reviewed contract/runtime/provider/operator/licensing evidence. This change does not relabel UMG quarantine as acceptance or manufacture a compiler receipt.
5. The exact selected model and hosted end-to-end path need qualification. A successful local test double proves transport behavior only.

The evidence-backed investor demo can be refined while these gates are open. None of the above authorises confidential-client use, court filing or external communication release.
