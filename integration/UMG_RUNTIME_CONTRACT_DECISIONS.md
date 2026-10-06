# CaseBrief x UMG runtime contract decisions

Status: **accepted for local synthetic adapter development; not frozen for production**.

This records the CaseBrief owner return for the five items requested in the October 2, 2026 Final Reconciliation & Runtime Integration Response.

## 1. v0.1-draft request/response shape

**Workable as a development contract.** CaseBrief will treat it as replaceable until the real Framework/NeoUMG service is bound and replayed against the synthetic fixtures.

Required invariants:

- CaseBrief supplies and owns the actor, tenant, matter, operation and authorization decision.
- A denied authorization carries **no protected source extract, expected-record payload or candidate finding**.
- Operations are limited to `READ_ONLY_ANALYSIS` or `PLAN_ONLY`.
- `externalEffectsAllowed` is always `false`.
- Responses are accepted only from the enumerated status set.
- Any response with `effects.dispatchCount != 0` is rejected.
- Returned finding citations must refer only to source IDs supplied in that request.
- Candidate findings remain proposals until CaseBrief human review/disposition.
- CaseBrief does not request or persist private model chain-of-thought.

Implementation scaffold: `integration/umg-runtime-contract.js`.

## 2. CaseBrief roles/scopes to represent

CaseBrief remains the authorization authority. The first adapter needs only the minimum host identity and scope facts required for the requested analysis.

Roles represented at the CaseBrief boundary:

- case owner / lead attorney;
- authorised co-counsel;
- explicitly delegated staff/investigator;
- defendant/family read-only recipient;
- CaseBrief system actor.

Relevant CaseBrief scopes:

- `case_view`;
- `privileged_work_product`;
- `ai_use`;
- `review_decisions`;
- `authority_research`;
- `audit_view`.

Drafting, export, sharing/release, messaging and any future external action remain CaseBrief-side capabilities. They are not granted merely because UMG can analyse a matter.

## 3. Minimum source extract / locator

For the first local adapter CaseBrief can supply:

- stable CaseBrief source ID;
- CaseBrief locator pointing back to the source/span or indexed excerpt;
- the minimum authorised text extract needed for the task.

The adapter should not forward entire case files by default. Privileged/restricted sources are filtered before request construction. Future contract revisions may add classification/hash/version metadata, but those are not required to begin local contract work.

## 4. Identifiers

CaseBrief will generate separate identifiers for each concern:

- request ID — unique adapter invocation;
- correlation ID — groups retries/fallbacks belonging to the same user operation;
- audit ID — CaseBrief audit event/receipt linkage;
- UMG trace/build/runtime references — returned by UMG when a real runtime actually executes.

IDs are opaque. They must not embed client names, case numbers, PII or privileged content.

## 5. First adapter target

**Local-development only until a UMG hosting environment and production gates are qualified.**

The first path is synthetic, non-persistent and zero-dispatch. A remote endpoint is not required to continue CaseBrief development.

Before confidential matter data may cross the service boundary, the parties still need to qualify service authentication, tenant isolation, TLS/secrets, retention/deletion, durable cross-service audit, production model/provider/subprocessors, prompt-injection handling, monitoring/incident response and hosting/support/SLA ownership.

## Current runtime posture

CaseBrief host-adoption PR #1 is merged. The Idaho pretrial pilot remains synthetic. The adapter contract is development scaffolding, not proof of NeoUMG execution or production security.

## October 5/6 revision-2 qualification update

Chris supplied the local Framework/H4 package. CaseBrief matched its ZIP fingerprint, reproduced the four scenarios and 15 failure checks, and built/tested `umg-runtime-rev2.cjs` against the actual revision-2 schemas and HTTP wrapper. The old scaffold above uses an earlier message shape and is retained for historical tests only. See `UMG_REV2_QUALIFICATION.md`. Contract freeze and all confidential-data production gates remain open.
