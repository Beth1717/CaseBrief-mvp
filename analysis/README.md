# Local fictional document analysis

Run `npm ci --ignore-scripts`, then `npm run start:analysis`. Open
`http://127.0.0.1:8780/analysis/`. The same loopback server serves the existing
synthetic CaseBrief demo at `/`; its local top-bar link opens this workspace. The
public browser demo retains its `connect-src 'none'` policy. Nothing is deployed.

## What works

- Enter two to twelve fictional text extracts; documents are not a fixed replay.
- The explicit-time method detects differing 24-hour times for matching event labels.
  It does not understand arbitrary documents or establish legal contradictions.
  Every empty rules result is `NEEDS_INPUT`, never a claim that the record is consistent.
- The optional local Ollama client sends bounded JSON-schema requests and rejects
  malformed, incomplete or tool-calling responses. No model is bundled.
- Exact unique quotations are located in authorised source text and converted to
  UTF-8 byte spans with SHA-256 source versions. Invented, ambiguous or unknown
  citations quarantine a candidate. Citation validity is not semantic truth.
- The actual revision-2 adapter validates request/response schemas, invocation
  identity, matter and authorization bindings, source membership, runtime receipts,
  private-reasoning exclusion and zero external dispatch.
- The browser receives only proposals that pass CaseBrief's source/citation checks
  and the configured UMG response gate. All remain `HUMAN_REVIEW_REQUIRED`.
  UMG acceptance is not attorney approval or legal correctness.
- The workbench distinguishes CaseBrief analysis proposals from UMG accepted and
  quarantined findings. Fresh candidates quarantined by UMG are never described as
  UMG-validated; the UI displays the separate UMG status and reason.
- Human passage-support assessment, confirmation, dismissal and reopening require
  an explicit reason and optimistic revision. Confirmation requires `SUPPORTED`
  passage assessment. Changing assessment after confirmation reopens the finding.
- Source edits send a host invalidation for the associated client run. Late UMG
  results are rejected from promotion after invalidation.
- The local SQLite review ledger persists invocation metadata, proposals,
  dispositions and append-only hash-chained audit events across browser reloads
  and server restarts. The database defaults to
  `readiness/results/casebrief-synthetic-review.sqlite`; override with
  `CASEBRIEF_REVIEW_DB`. SQLite files are git-ignored.
- After a server restart, historical receipts remain inspectable but read-only:
  the prior local session/source authorization context is intentionally not
  restored. A new comparison establishes a new review context.

## Run with the actual local UMG service

Start Chris's separately supplied and checksum-verified local package on loopback
port 8767. Do not copy its vendor runtime into this repository. Then start CaseBrief:

```bash
CASEBRIEF_UMG_ENDPOINT='http://127.0.0.1:8767/v0.1/record-consistency' npm run start:analysis
```

Only the exact `http://127.0.0.1/v0.1/record-consistency` route is accepted by
the adapter. The CaseBrief host request uses revision 2 unchanged. The separate
`casebrief.analysis.result.v1` structure is CaseBrief-owned and does not modify
the UMG wire contract.

### Known UMG limitation

Chris's November 4 response confirms that the current UMG release provides
governance/transport validation, not general semantic contradiction discovery.
The maintained service may quarantine fresh arbitrary candidates as
`UNREVIEWED_OR_MUTATED_FINDING`. CaseBrief can preserve a separately labelled
source-linked proposal for human review, but must not describe that proposal as
UMG-validated. The original pinned sample is not evidence of general finding quality.

## Local Ollama model

No model, model weights or API key are bundled. To use a model already installed
locally:

```bash
CASEBRIEF_OLLAMA_MODEL='your-installed-model:tag' npm run start:analysis
```

The endpoint defaults to `http://127.0.0.1:11434/api/chat`. Optional
`CASEBRIEF_OLLAMA_ENDPOINT` accepts only the explicit loopback HTTP `/api/chat`
route. The client does not download a model or use a cloud endpoint. The operator
must independently verify the installed model and Ollama runtime are local; a
loopback URL alone does not prove all inference is offline. The explicit `:cloud`
suffix is rejected.

Inputs are capped at 48,000 UTF-8 bytes; that is not a tokenizer proof. Model
outputs can miss or misinterpret facts. No live model-quality result is claimed.
HTTP protocol tests use a test double and do not count as model-quality evidence.

## Persistence and security boundary

This is a local synthetic-development ledger, not a production audit system.
The database uses SQLite transactions, WAL/full synchronous settings, update/delete
triggers on audit events and a hash chain. This makes accidental alteration
detectable within the local store; it is not a signed, externally anchored or
independently tamper-proof audit service.

The local session token and fixed local actor are not production authentication.
There is no server-side multi-tenant identity, MFA, SSO, workload identity, TLS
termination, managed secrets, hosted tenant isolation, backup/retention service,
incident response, penetration test or security certification. The review ledger
stores synthetic proposal quotations and local review reasons. Do not place real
client data in it.

Text extraction/OCR, PDF page mapping, full-case retrieval, authenticated
persistent backend, production identity, provider qualification, hosted operations,
attorney validation and Idaho template/source validation remain open. This
workbench does not change CRI, file court documents, send messages, or perform
external case mutations. Family recipients do not receive attorney work product.

## Checks

```bash
npm run test:analysis
node analysis/tests/browser.cjs
node analysis/tests/persistent-review.test.cjs
npm run test:host
npm run test:boundary
npm run test:runtime
```

The analysis suite covers source snapshots, exact quote coordinates, unsupported
citations, private-reasoning rejection, local model protocol errors/timeouts,
human review and passage-support transitions. The persistent integration tests
exercise actual revision-2 request/response validation, durable dispositions,
audit-chain verification, invalid response rejection, `NEEDS_INPUT`, source
invalidation during an asynchronous runtime call, and read-only historical access
after restart. Browser checks cover actual entry, source display, review, receipt
download and mobile layout.

## Evaluation and attorney review

Run `npm run evaluate:analysis` for observed rules output on the versioned fictional
packet set, or `npm run evaluate:analysis -- ollama` only after installing and
configuring a suitable local model. Draft review questions are not sent to the
provider. Precision, recall, false-positive/miss rates and legal accuracy remain
null until independent adjudication. The exculpatory-lab and unsupported-allegation
packets deliberately expose current coverage limits. The packet set is drafted,
not attorney-labelled.

Quote linkage, human proposition-support assessment and attorney validation are
separate. Local reviewer identity is self-asserted; `attorneyValidation` remains
`NOT_ESTABLISHED`. A passing synthetic test is not an attorney approval or
production readiness decision.
