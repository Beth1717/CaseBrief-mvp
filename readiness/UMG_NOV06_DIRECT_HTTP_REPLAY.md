# November 6 direct loopback replay of the November 4 UMG service

This is an additional direct HTTP replay performed after extracting the supplied immutable October 30 base archive and applying the November 4 r1 overlay.

## Integrity and environment

- Base archive SHA-256: `35c87ae0c92a9b48fe8d77d1d638620470f46c796885957f495284fad87a8476` — matched.
- Delta archive SHA-256: `359a14ee5eeb60358330f752cacd87209ad00967cf03e2d9e04854fe074a78d5` — matched.
- Delta manifest: 40/40 entries matched.
- Python 3.13.5; jsonschema 4.26.0; Node.js 22.16.0.
- UMG service bound to `127.0.0.1:8767`; `/ready` reported READY, revision 2, Framework RC2, NeoUMG Alpha 1, real Framework and compiler execution, effects disabled and dispatch count zero.

## Direct HTTP requests

Each supplied synthetic request JSON was posted directly to `POST /v0.1/record-consistency` on the running local service. The response JSON was saved and inspected.

| Request fixture | Runtime | Status | Accepted | Quarantined | Quarantine reason | Dispatch |
| --- | --- | --- | ---: | ---: | --- | ---: |
| supported-contradiction | EXECUTED | SUCCEEDED | 1 | 0 | — | 0 |
| fresh-unreviewed | EXECUTED | SUCCEEDED | 0 | 1 | `UNREVIEWED_OR_MUTATED_FINDING` | 0 |
| changed-source | EXECUTED | SUCCEEDED | 0 | 1 | `UNREVIEWED_OR_MUTATED_FINDING` | 0 |
| embedded-instructions | EXECUTED | SUCCEEDED | 0 | 1 | `UNREVIEWED_OR_MUTATED_FINDING` | 0 |
| unknown-citation | EXECUTED | SUCCEEDED | 0 | 1 | `INVALID_CITATION_OR_SOURCE_REFERENCE` | 0 |

## Interpretation and boundary

The service executed the real Framework/H4 compiler for each request. The pinned reviewed sample was accepted. Fresh, mutated and hostile-input findings were quarantined; an unknown citation was quarantined. Every response reported zero external dispatch.

This independently reconfirms UMG's documented governance boundary. It does not establish broad semantic contradiction detection or legal correctness.

**Important:** This is a direct HTTP replay using UMG's supplied request fixtures. It is not yet the combined CaseBrief Node adapter → actual November 4 UMG service → CaseBrief persistent review flow. PR #14's exact-head CI tests the CaseBrief bridge with a contract-valid local test service. The combined live adapter replay remains an explicit open acceptance item.
