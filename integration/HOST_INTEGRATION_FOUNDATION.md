# CaseBrief host integration foundation

Status: implemented and locally tested for fictional data only. This is a Node-only in-process persistence experiment, not a deployed backend, authentication system, contractual approval or browser integration. Node 24 is required for the built-in SQLite API.

## Implemented boundary

`trusted synthetic host callback → immutable invocation and source snapshot → actual revision-2 Node adapter → loopback Framework/H4 → response validation and current-host recheck → atomic pending proposal and audit → explicit human review`

The public browser does not import these modules. Its CSP and external-action block remain unchanged. No provider or model is called. Runtime compiler execution does not establish new contradiction inference.

## Components

- `host/synthetic-review-coordinator.cjs` accepts an explicitly synthetic host callback and tenant/matter/actor scope. The callback supplies authoritative context, source rows and required `sourceVersions`. It is **trusted test input**, not a verified login or browser role.
- `host/synthetic-review-store.cjs` uses SQLite to persist invocations, pending findings, human decisions and linked audit events. State updates and corresponding events share a transaction. An audit-write failure rolls back the mutation; failure before invocation prevents transport.
- `scripts/qualify-umg-package.py` checksum-verifies the exact October 30 archive, all 908 listed files and the unchanged wire schemas, extracts to a temporary directory, starts loopback only, and runs `tests/umg-live-package.cjs` through CaseBrief's actual adapter. It never vendors Chris's runtime into the repository.

## Host contract

Construct `SyntheticReviewStore({filename, syntheticOnly:true})`. Pass it to `createSyntheticCoordinator({store, readContext, invoke})`. `readContext(scope)` is synchronous and must return a JSON-compatible synthetic context matching the requested tenant, matter and actor; include source versions keyed by source ID. The default `invoke` uses the local adapter. An injected invoke callback is for controlled tests or an explicitly configured loopback endpoint.

Use `run(scope)` to create a new operation. The coordinator always generates new invocation/correlation/audit IDs, regardless of fixture IDs. It records a request digest and a host snapshot of exact source rows plus source versions. It preserves revision-2 wire values, including nullable `contentHash`, so the fixture-bound service remains compatible. This host digest is **not** a replacement for the future cross-service source-version protocol.

After transport, the host rechecks current identity, authorization, source versions and exact content, expectations, candidate findings and mode inside the state/audit transaction. Changed or revoked context rejects the result. Only a validated `SUCCEEDED` response becomes a pending human-review record. This initial coordinator conservatively rejects `NEEDS_INPUT`, including any partial findings, until their acceptance semantics are agreed.

Use `get(scope,id)` for result reads. It denies reads without current analysis access. Changes invalidate prior review and return no stale source-derived findings or decision reasons. Use `review({scope,id,findingId,decision,reason,expectedRevision})` for confirm/dismiss/reopen; it requires current `review_decisions`, an unchanged host snapshot, a reason and optimistic concurrency. It creates no missing-record disposition or filing readiness.

The underlying store methods are internal persistence APIs. They do not consult live authorization; do not expose them as routes or use `store.get` as a public read boundary. The host callback and scope require real server authentication before future deployment. The current record read is deliberately restricted to the invocation's original actor; no shared counsel/delegation policy has been implemented.

## Persistence and limits

SQLite WAL with synchronous FULL and transactions is exercised with real temporary on-disk databases. Restart retains synthetic decisions. Failed result or decision audit writes roll back. A crash can leave an invocation RUNNING; no recovery process may convert it into accepted findings without a fresh reviewed policy. Close stores only after pending operations finish.

Audit events contain identifiers, digests, finding IDs, outcome and local timestamps. Source text, full runtime audit payloads and decision reasons are excluded from general events. Human reasons remain in the synthetic invocation record. Events are hash-linked and update/delete triggers block ordinary SQL modifications. This detects some accidental corruption; an administrator able to change the database and triggers can rewrite the chain. There is no external signature, anchored audit chain, protected clock, encryption, retention policy, access service, backup/restore qualification or production tamper-proof guarantee.

## Reproduction

```sh
npm ci --ignore-scripts
npm run test:runtime
npm run test:boundary
npm run test:host
npm run test:live-umg -- /absolute/path/to/CaseBrief_UMG_Integration_Response_FULL_2026-10-30.zip
```

The archive pin is SHA-256 `35c87ae0c92a9b48fe8d77d1d638620470f46c796885957f495284fad87a8476`; a different release requires explicit review and new qualification. The runner uses Python standard library plus Node/Ajv already declared by CaseBrief. It does not require the supplemental Python `jsonschema` evaluator.

CI runs the original 20 suites, the boundary and synthetic-host suites, and two ingestion suites (24 total). The intake UI is a separate browser-only demonstration; it does not call this host store. The optional actual-package test is local because the third-party archive is not redistributed or fetched by CI. Browser validation requires matching Playwright Chromium; a failed local browser download is not a pass.

## Production dependencies still open

Chris's written review and intended release; actual analysis architecture and executable model path; tenant/source protocol agreement; service identity and authentication; selected hosting/provider and data-handling terms; production authorization/audit/retention/operations; independent security review; licensing/support. Attorney validation, CRI calibration, legal templates and commercial validation remain separate. Nothing here authorizes confidential data, external actions or a claim that the hosted product is ready.
