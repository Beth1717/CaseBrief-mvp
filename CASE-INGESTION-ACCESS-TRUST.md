# CaseBrief Case Ingestion + Access & Trust Architecture

Status: implementation target and MVP prototype contract  
Scope: Founding Pilot onboarding, identity/organization/matter authorization, case ingestion, provenance, docket refresh, duplicate handling, and CRI presentation.

## Non-negotiable product boundary

The public GitHub Pages MVP is a synthetic, browser-local demonstration. It is not a production authentication boundary and must never hold real client, discovery, privileged, criminal-history, payment, authentication-secret, or other confidential production data.

Production CaseBrief is a hosted SaaS application. It is not distributed as downloadable desktop software.

## Founding Pilot delivery model

The pilot is paid and approval-only.

Public marketing flow:

1. Request Pilot Access.
2. Verify professional identity and organization.
3. CaseBrief approves or rejects the application.
4. Approved participant accepts the pilot agreement and payment terms.
5. CaseBrief issues a single-use, expiring invitation.
6. User enrolls MFA or a passkey.
7. User joins the approved organization tenant.
8. Matter access is granted separately.

There is no public self-service pilot signup and no “free trial” wording when payment is required.

The public application must not collect client facts, case files, discovery, or confidential matter information.

## Access & Trust authorization model

Authorization is evaluated as separate gates:

Identity -> Organization Membership -> Matter Assignment -> Permission -> Resource Classification

Passing one gate never implies the next gate.

Examples:

- A verified attorney in Firm A cannot access Firm B.
- A Firm A user does not automatically see every Firm A matter.
- A client or family/support user cannot search for matters.
- External users enter through explicit matter-scoped invitations.
- Privileged attorney work product remains restricted even within an otherwise authorized matter.

Production controls required:

- server-verified identities;
- phishing-resistant MFA/passkeys where feasible;
- organization/tenant isolation;
- matter-level ACLs;
- role/permission enforcement;
- short-lived sessions and secure re-authentication for sensitive actions;
- expiring/single-use invitations;
- append-only or tamper-evident audit history;
- encryption in transit and at rest;
- secrets/key management;
- malware scanning and file-type validation;
- backup, recovery, monitoring, and incident response;
- retention, deletion, and legal-hold controls;
- vendor/model data-handling controls;
- payment handled by a compliant payment provider rather than CaseBrief storing card data.

Frontend visibility is not authorization. All protected production operations must be enforced server-side.

## Case Ingestion Engine

Every matter begins as a Case Shell:

- jurisdiction;
- court;
- case number;
- parties/client;
- matter type;
- owning organization;
- authorized users/roles.

The case is then built from source classes that remain distinct:

### Court record
Docket entries, hearing information, public filings/documents, case status, charges/claims, parties, counsel, judge, and other lawfully available court data.

### Firm-provided file
Discovery, reports, transcripts, correspondence, video/audio, photographs, evidence records, exports from practice-management systems, and other private material supplied by the authorized organization.

### Human-entered verification
Attorney/investigator notes, corrections, verified dates, witness information, strategy metadata, and other authorized human input.

### CaseBrief-derived
Extracted entities, timeline events, contradictions, missing-item flags, summaries, CRI inputs, source-grounded narrative, and other machine-derived assertions.

CaseBrief-derived data never silently overwrites an original source.

## Ingestion pipeline

Production target:

1. Receive source into a quarantine boundary.
2. Validate file type/size and reject dangerous formats.
3. Malware scan.
4. Compute cryptographic integrity hash.
5. Detect exact duplicates by hash.
6. Store the immutable original separately from derived data.
7. Classify source type and confidentiality.
8. Extract text/metadata.
9. Create source-linked assertions.
10. Detect conflicts without choosing a winner.
11. Require human verification where appropriate.
12. Promote approved material for case-intelligence use.
13. Record every transition in the audit trail.

The MVP prototype now demonstrates source classes, SHA-256 integrity metadata, quarantine, verification, duplicate detection, source-linked assertions, and audit events using synthetic fixtures only.

## Provenance contract

Every material derived assertion should be able to answer:

- What is being asserted?
- Which matter owns it?
- Which original source supports it?
- Where within the source is the support?
- Who or what extracted/entered it?
- When was it created?
- What extraction/confidence state applies?
- Has an authorized human verified it?
- Has the assertion or source changed?
- What audit events affected it?

Conflicting assertions may coexist. CaseBrief should surface the conflict rather than erase one version.

## Docket synchronization

Docket refresh is additive/delta-based.

A refresh records:

- provider/source;
- check time;
- newly observed events/documents;
- changed metadata;
- removed/unavailable material when detectable;
- resulting case-intelligence changes;
- audit event.

Historical observations are retained. A refresh does not silently replace prior state.

Approved APIs/data providers should be used where available. Scraping that violates court/provider terms is not an acceptable production dependency.

## CRI presentation rule

Locked UX behavior:

- The CRI ring hover/focus explains what the Case Readiness Index means.
- The hover does not show category deductions, issue names, or score breakdown.
- Clicking the CRI opens the detailed panel with factor categories, deductions, underlying review items, source links, and scoring effects.
- CRI is a review/readiness indicator only and never predicts merit, guilt, innocence, or legal outcome.

Future CRI scoring should distinguish human-verified information from unresolved/unverified information and make score changes explainable.

## AI data-minimization rule

AI/model calls receive the minimum case context required for the authorized task.

Production model/vendor requirements include:

- no training on customer case data unless explicitly authorized by the customer;
- minimized retention;
- documented subprocessors and transfer paths;
- role/matter authorization before retrieval;
- privileged-source filtering before model context assembly;
- no raw privileged content in routine application logs;
- source identifiers returned with derived outputs;
- audit events for tool/model actions.

External analysis systems integrate into the CaseBrief trust boundary through controlled contracts. CaseBrief should not dump an entire matter into another application merely because an analytic component is useful.

## Release gate before real case data

Do not move from synthetic MVP to live legal data until server-side authentication, tenant isolation, matter ACLs, secure storage, malware scanning, encryption, secrets management, audit integrity, retention/deletion controls, vendor/model controls, backups, monitoring, incident response, and a documented threat/security review are in place.
