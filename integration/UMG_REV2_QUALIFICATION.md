# UMG revision-2 local adapter qualification

The October 5 delivered package uses `schemaVersion`, `contractRevision: 2`, `hostContext`, `constraints`, `acceptedFindings` and `sourceRefs`. The earlier `umg-runtime-contract.js` scaffold uses a different shape and is retained only for historical scaffold regressions. It must not be used as the service adapter.

The new Node-only `integration/umg-runtime-rev2.cjs` consumes the supplied revision-2 schemas. It is not loaded by `index.html`, does not change the browser's `connect-src 'none'` policy and is restricted to synthetic payloads sent to the explicit HTTP endpoint on 127.0.0.1. There is no production endpoint or browser runtime connection.

## Source and reproduction

Delivered ZIP: `CaseBrief_UMG_Runtime_Contract_v0.1_DRAFT.zip`

SHA-256: `4651e262a96f5801d449775d03129675a55ab8fae775d68caf873b222f7a54a6`

Size: 1,300,461 bytes.

On October 6 UTC / October 5 Boise, CaseBrief matched the ZIP checksum, verified all 833 manifest entries, and independently ran `python3 RUN_QUALIFICATION.py` from the unpacked package. Explicit lowering, pinned H4 compile, readiness, four fixture replays and 15 failure/fallback checks passed. The supplied Python runner skipped its optional schema step because Python jsonschema was absent; CaseBrief separately validated all four replay requests and responses against the delivered schemas with pinned Ajv 8.20.0.

Baseline runtime hash: `46b747e23af5dd3b66a91c310b79412a89b5bc02f13cd33c7046e181b22c257a`.

| Synthetic replay | Result | Compiler / Framework | Dispatch |
| --- | --- | --- | --- |
| Supported contradiction | SUCCEEDED; i1 accepted as a review proposal | EXECUTED / EXECUTED | 0 |
| Unsupported claim | SUCCEEDED; probe-unsupported-1 quarantined | EXECUTED / EXECUTED | 0 |
| Wrong matter | DENIED; protected request payload empty | NOT_EXECUTED / NOT_EXECUTED | 0 |
| Missing expected record | SUCCEEDED; BC-1841-A not_provided | EXECUTED / EXECUTED | 0 |

CaseBrief also sent the four requests through `invokeLocal` to the supplied local HTTP Framework wrapper and reproduced those status/execution/zero-dispatch outcomes. The adapter's automated test validates the real replay fixtures and independently tests transport, timeout, late-response rejection and fallback using an ephemeral loopback server. CI does not vendor or invoke Chris's full Framework package.

## Controls

- Exact schema/revision validation; enumerated roles/scopes and separate opaque invocation/correlation/audit IDs.
- Non-ALLOW construction strips sources, expected records and candidate findings.
- Source IDs are unique, sources remain matter-bound, expectation basis sources are authorised, expired/malformed authorization is rejected.
- Response invocation, matter, authorization decision and sleeve identities must match the request.
- Finding, expectation and provenance citations remain bound to supplied sources. Unsupported candidate proposals may be sent to exercise quarantine; returned unauthorised references are rejected.
- Accepted findings require citations and remain proposals; UMG cannot invent CaseBrief human confirmations/dispositions.
- Private/hidden reasoning is rejected recursively, including nested audit data.
- Effects remain zero; executed effects must be empty. Executed runtimes need compile/trace/revision receipts.
- Runtime requests are immutable snapshots; 30-second maximum deadline, bounded response size, no remote destinations, no redirect handling, no confidential payloads and no acceptance of late results.
- Missing host scopes, unavailable runtime, malformed/unsafe output, bad HTTP status and timeout return empty local fallback results. A non-ALLOW request returns BLOCKED on transport fallback.

## Development use

```bash
npm ci --ignore-scripts
npm run test:runtime
```

For actual local runtime replay, unpack Chris's checksum-matched ZIP outside this repository and start:

```bash
python3 framework-replay/casebrief_umg_local_framework_service.py --host 127.0.0.1 --port 8767
```

`invokeLocal(request)` uses `http://127.0.0.1:8767/v0.1/record-consistency` by default. Inputs must carry a CaseBrief-owned hostContext; `verifiedByHost` here represents the synthetic host assertion and is not production authentication. Do not derive production authority from a browser demo role.

Full Framework/vendor code is not copied into CaseBrief. Supplied schemas and reproduced synthetic pairs are preserved in `runtime-contract-v2/`; they retain draft status until both sides agree to freeze them.

## Remaining gates

NeoUMG lineage qualification is NOT RUN. H4 compatibility compile success is not lineage qualification. Production service authentication, tenant isolation, TLS/secrets, retention/deletion, durable cross-service audit, model/provider/subprocessor terms, CaseBrief-specific prompt-injection qualification, monitoring/incident response and hosting/support ownership remain open. No confidential-data approval or external-action permission is created by this result.
