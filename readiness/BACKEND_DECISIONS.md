# Backend decisions still requiring an owner

The local synthetic host prototype now supplies an executable example of source snapshots, invocation binding, pending proposals, reasoned review, SQLite transaction rollback and audit linkage. It does not select a production backend, identity service, cloud, database, model or budget.

| Decision | Preparation completed | Decision or evidence still needed |
| --- | --- | --- |
| Identity and organizations | Host scope separates tenant, matter and actor; negative local tests | Identity provider, verified onboarding, MFA/recovery, membership/delegation policy and server session verification |
| Runtime and analysis | Actual adapter tested with checksum-pinned release; interface conditions recorded | Chris's release/contract adoption, analysis owner and executable provider/model path |
| Source protocol | Host records exact source-row digests and required versions outside revision-2 messages | Joint hash/version/citation and tenant binding contract; immutable originals and ingestion version store |
| Persistence | Local SQLite state and audit committed together; restart and failure tests | Production data store/operator, access policies, encryption, migrations, backups/restore and retention/hold policy |
| Audit | Minimal local events, digest linkage, state rollback on failed event write | Trusted time, external integrity/retention controls, access/read/export audit, recovery and incident ownership |
| Operations | Loopback-only runner and explicit source pins | Deployment region, service authentication, credentials, provider terms, monitoring, incident response and operating budget |

## Minimum next decision record

For each selected service record owner, purpose, environment/region, data recipients, contract terms, training/retention/deletion, secrets/access, monthly and usage costs, backup/recovery responsibility, and evidence location. Mark unselected items explicitly. Do not interpret local SQL persistence as a hosted security approval.

No secret, paid subscription, external deployment or confidential transfer is needed to run the current synthetic tests. Those choices remain open because no authorized provider/operator/budget has been selected.
