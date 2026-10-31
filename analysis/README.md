# Local fictional document analysis

Run `npm ci --ignore-scripts`, then `npm run start:analysis`. Open
`http://127.0.0.1:8780/analysis/`. The same server serves the existing demo at `/`;
its local top-bar link opens the document comparison workspace. No public browser
connection policy is relaxed. Nothing is deployed by this command.

## What works

- Enter two to twelve fictional text extracts; documents are not a fixed replay.
- The explicit-time method detects differing 24-hour times for matching event labels
  using statements such as `The traffic stop began at 22:14.` It does not understand
  arbitrary documents or establish legal contradictions. Every empty rules result is
  `NEEDS_INPUT`, never a claim that the record is consistent.
- The local Ollama client sends bounded JSON-schema requests, rejects incomplete,
  malformed or tool-calling responses, and returns structured factual candidates.
- Exact unique quotes are located in authorised source text and converted to UTF-8
  byte spans with SHA-256 versions. Invented/ambiguous quotes and unknown sources
  quarantine the candidate. Citation validity does not establish semantic truth.
- Current host identity, grant and source snapshot can be rechecked after inference
  through `currentRequest` in the engine. The local server owns its fixed fictional
  session; this is not production login or multi-tenant authorisation.
- Findings remain proposals; explicit user confirmation, dismissal and reopening
  require a reason and optimistic review version. Download a JSON review receipt.
- Insufficient evidence, quarantine, failure and an actual empty successful model
  comparison remain distinct. No model output performs a human review action.

## Use a locally installed model

No model, model weights or API key are bundled. Choose a local Ollama model already
installed on the machine and set its exact model name:

```bash
CASEBRIEF_OLLAMA_MODEL='your-installed-model:tag' npm run start:analysis
```

The endpoint defaults to `http://127.0.0.1:11434/api/chat`. Optional
`CASEBRIEF_OLLAMA_ENDPOINT` accepts only the explicit 127.0.0.1 HTTP `/api/chat`
route. The client never downloads a model or uses a cloud endpoint. The operator
must independently ensure that the selected Ollama model is local, including its
runtime configuration; a local URL alone does not prove that every possible
model is offline. The explicit `:cloud` suffix is rejected.

The selected model must support structured output and the configured context
window. Inputs are capped at 48,000 UTF-8 bytes; that byte limit is not a tokenizer
proof. Models can still miss or misinterpret facts. Validate the exact installed
model on fictional packets before claiming quality or enabling any client data.
No real model inference was run during this implementation because no local model
was configured in the build environment. HTTP protocol tests use an explicit test
double and do not count as model-quality tests.

Official interface references:
- https://docs.ollama.com/api/chat
- https://docs.ollama.com/capabilities/structured-outputs

## Optional actual UMG service

Start the supplied external October 30 working release in another terminal using
its `tools/start_local.py`. Do not copy its vendor code into this repository.
Then start CaseBrief with:

```bash
CASEBRIEF_UMG_ENDPOINT='http://127.0.0.1:8767/v0.1/record-consistency' npm run start:analysis
```

The bridge sends the unchanged revision-2 request shape and checks the real response
with `integration/umg-runtime-rev2.cjs`. It does not fabricate a compiler receipt or
convert a UMG quarantine into approval. Analysis candidates and UMG results are
reported separately. The host analysis envelope `casebrief.analysis.result.v1` is a
separate CaseBrief structure, not a modification of revision 2 or a new signed
UMG contract.

### Reproduced external-runtime limitation

The original full ZIP matched SHA-256
`35c87ae0c92a9b48fe8d77d1d638620470f46c796885957f495284fad87a8476` and its
908-entry delivery manifest passed verification before execution. Through the
actual service the original sample returned SUCCEEDED with compiler EXECUTED.
A fresh pair, `The fictional interview began at 03:08.` and
`The fictional interview began at 04:19.`, produced one new CaseBrief rule candidate.
The actual UMG compiler executed, but accepted zero and quarantined one with
`UNREVIEWED_OR_MUTATED_FINDING`. Its source gates acceptance against the single
`REVIEWED_FINDINGS['i1']` sample plus matching pinned source content.

That is a concrete UMG limitation, not a transport failure. The maintainer must
agree and implement a general candidate-validation path if fresh findings are to
be accepted by UMG. Structural validation still must not be described as factual
or legal approval. Until then this workspace supports CaseBrief proposals with a
visible pending UMG result, not qualified end-to-end approval of arbitrary findings.

## Checks

```bash
npm run test:analysis
node analysis/tests/browser.cjs
npm run test:runtime
# Only with the real supplied service running:
node analysis/tests/real-umg.cjs
```

The unit/HTTP tests cover fresh source values, uncertain/consistent/unrelated
inputs, hostile source instructions in the rules path, Unicode quote coordinates,
unsupported citations, revoked/changed host snapshots, nested private reasoning,
model protocol errors/timeouts, CSRF, explicit human events and stale decisions.
The browser test covers actual entry, source display, review, JSON download and
mobile layout. These checks do not establish model prompt-injection robustness or
attorney validation.

## Boundaries and next implementation

This is a local synthetic development component. Source records and review events
are held in process memory, capped per session and lost on restart. Downloaded
receipts are mutable snapshots, not a durable audit ledger. Text extraction/OCR,
PDF page mappings, full-case retrieval, an authenticated persistent backend,
production tenant isolation and selected model/provider qualification remain open.
It does not change CRI, import candidates into existing authoritative case state,
or share attorney work product with family recipients. The main demo remains
synthetic and its `connect-src 'none'` policy remains intact.
