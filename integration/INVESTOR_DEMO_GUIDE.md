# CaseBrief investor demonstration

Status: synthetic investor demonstration, with a separately qualified local UMG adapter. Not a confidential-data pilot deployment.

## Positioning

CaseBrief is a case intelligence platform that connects case records, source-linked review, operational readiness and auditable human decisions in one matter workspace. The initial workflow is Idaho pretrial defence for possession and search-and-seizure matters.

The product hypothesis is that organising records and outstanding work around reviewable decisions will help defence teams reduce avoidable review effort and surface gaps earlier. Time savings, accuracy gains, traction, revenue and willingness to pay have not yet been measured. Do not present them as achieved results.

## Launch the investor build

This build includes the reviewed pilot lifecycle from merged PR #4 and the investor-demonstration changes. GitHub Pages reflects these features only after the investor changes reach its publishing source and deployment finishes.

From an existing repository checkout:

```bash
git fetch origin
git switch investor/demo-readiness
npm ci --ignore-scripts
npm start
```

Open http://localhost:8765/?demo=investor, select the Lead attorney demo role, click **Investor walkthrough**, then **Start guided investor demo**. Python 3, Node.js 20+ and npm are needed for these developer commands. Hosting the browser demo itself requires only its static files.

The first launch creates the tested synthetic Idaho pilot beside the existing fictional and intake cases. It preserves existing decisions on later launches. Use **Reset synthetic pilot** for a fresh rehearsal: confirmation is required, only this pilot's records are reset, and prior activity history is retained. This is not a data-erasure control.

## Five-minute demonstration

| Step | Show | Say |
| --- | --- | --- |
| Case overview | 63% CRI, procedural posture, unverified deadline state | “This is operational readiness, not a prediction of the case outcome.” |
| Documents | S01 incident report and S02 camera transcript | “We keep the conflicting accounts inspectable. Clock accuracy still needs investigation.” |
| Review queue | Confirm the sequencing finding with a reason | “Confirmation records a human judgement without pretending the outstanding work is complete.” |
| Assistant | Ask “What records are missing?” | “The answer stays with the permitted record and points back to its sources. This browser response is deterministic.” |
| Drafting | Generate an internal review memo; edit and save a version | “Useful review work can proceed while court templates await attorney validation. This is not a court filing.” |
| Family access | Release S01/S02, preview, revoke, preview again | “Only selected records are released read-only. Internal notes, comparisons and drafts remain withheld.” |
| History | Inspect the decisions, memo and release events | “The prototype shows the audit workflow; production needs a durable authenticated server record.” |

Do not infer search legality, guilt, substance identity or ownership from the synthetic packet. Do not invent a deadline when no verified order is recorded.

## Demonstrable capabilities

- Tested synthetic Idaho pilot available through normal UI.
- Source-linked deterministic findings and reason-required confirm/resolve/dismiss/reopen decisions.
- CRI: 40% record completeness, 35% work control, 25% attention control; inspectable item deductions, insufficient-data state, revision-bound source reviews and duplicate handling.
- Focus/hover explanation, click/tap calculation drawer, frosted panels and mobile containment.
- Permitted-source assistant, internal memo creation, draft editing/versioning and existing fictional filing demonstrations.
- Family release/revocation, protected recipient views and direct drawers, role-change drawer closure and render-time view permission checks.
- Scoped rehearsal reset, preserved history, existing case switching, simulated communication and audit exports.
- Node-only UMG revision-2 schema/semantic adapter with synthetic-only loopback transport, response validation and safe fallback.

## Pilot evidence to collect next

| Gate | Evidence needed | Proposed responsibility |
| --- | --- | --- |
| Attorney validation | Factual-finding review, scoring-policy calibration, Idaho workflow/court-template signoff | CaseBrief + participating Idaho counsel |
| Workflow usefulness | Baseline vs assisted record-review time, supported/unsupported findings, missed-record detection and attorney-rated usefulness | CaseBrief + pilot participants |
| Buyer fit | Workflow interviews, budget owner, purchasing route and willingness to pay | CaseBrief |
| Confidential-data readiness | Server authentication, matter/tenant access, durable audit, secure storage, retention, backup and incident controls | CaseBrief backend owner |
| UMG deployment | Named hosting/operations owner, authentication, isolation, TLS/secrets, data/provider terms, injection testing and support responsibilities | Chris + CaseBrief |
| Contract freeze | Agreement on revision 2 fields, response semantics, source locators and audit identifiers after adapter review | Chris + CaseBrief |

These are proposed owners and evidence requirements, not claimed commitments or completed milestones. An investor demo can be presented before the confidential-data gates are completed; a real-data pilot cannot.

## Presentation-day checks

Use only synthetic records. Rehearse the seven steps, verify the role and 63% baseline after reset, check source drawer and memo editing, demonstrate revocation and inspect history. Keep the existing fictional court-drafting example separate from the unvalidated Idaho court workflow. Use the local static build if network availability is uncertain.

## Updated previews

A local preview shows this branch immediately after fetching/checking it out and restarting the server. The GitHub Pages preview updates only after the intended changes reach its configured publishing source and deployment finishes. Do not describe a PR branch as already live on Pages. Asset version strings have been refreshed for changed/new browser assets.
