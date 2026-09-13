# CaseBrief Security Model — MVP and Production Gates

Security is a core product capability, not a post-launch add-on. CaseBrief is intended to hold highly sensitive legal, privileged, evidentiary, and personal information. The product must therefore demonstrate least privilege, traceability, data minimization, human control, and explicit security boundaries from the MVP onward.

## What the static MVP enforces now

The public MVP uses synthetic records only. Within the limits of a browser-only static demo it now demonstrates and enforces:

- Role-based demo identities for lead attorney, co-counsel, investigator, and client.
- Permission checks before protected views and actions.
- Privileged attorney-note classification and denial to non-privileged roles.
- Role-filtered document listings so restricted records are not rendered into the visible document table.
- AI source filtering through the active role before citations are shown to the user.
- Attorney-only drafting/review actions and permission-gated authority research.
- Separate client↔counsel and internal-team communication permissions.
- A restricted client communications view that hides internal team contacts.
- Matter-scoped activity events for security denials, role changes, session locks, sensitive-action prompts, AI activity, review decisions, drafting, and communication actions.
- Audit data minimization: AI prompt text and prepared message bodies are not intentionally duplicated into semantic audit-event details; metadata such as character counts, sources, targets, identities and action outcomes is recorded instead.
- Sensitive-action confirmation before draft clipboard egress and audit export.
- Manual Privacy Mode that conceals the entire case workspace from shoulder surfing/screensharing.
- Manual session lock plus automatic lock after 15 minutes of inactivity.
- Escaped user-controlled text before HTML rendering in core case surfaces.
- `Referrer-Policy: no-referrer` via page metadata.
- A static-demo Content Security Policy that blocks network connections, objects/plugins and base-tag rewriting while restricting active content to the demo origin. Inline script/style allowance remains because the prototype still uses inline event handlers/styles.
- A visible Security Center that shows the active role, allowed/denied permissions, demonstrable safeguards and production security gates.

These controls are useful for validating UX, least-privilege behaviour and the investor/pilot security story. They do **not** make a public static site appropriate for real client data.

## Important static-demo boundary

Client-side authorization can be bypassed by a determined person using browser developer tools because all static application code and synthetic data are delivered to the browser. Local browser storage is mutable. Demo identities are not cryptographically verified. Browser timestamps are not trusted server timestamps. The current communication feature does not transmit messages.

No real client, discovery, privileged, medical, criminal-history, payment, authentication-secret, or other confidential production data should be entered into this public MVP.

## Mandatory production gates before real legal data

### Identity and authentication

- Server-verified identities.
- Phishing-resistant MFA/passkeys for legal professionals and administrators where feasible.
- Enterprise SSO/SAML/OIDC for firms, public defender offices and agencies.
- Secure password hashing if passwords are supported.
- Rate limiting, credential-stuffing protection and suspicious-login detection.
- Secure account recovery resistant to social engineering.
- Device/session inventory, remote revocation and step-up reauthentication for high-risk actions.

### Authorization and isolation

- Server-side role-, organization-, matter- and object-level authorization on every request.
- Least privilege by default.
- Matter membership and delegated access with explicit scope and expiration.
- Separate controls for privileged work product, discovery, evidence, client-visible material, experts, investigators and outside collaborators.
- Tenant isolation at the data-access layer; never rely on client-supplied tenant or matter IDs without server validation.
- AI retrieval must use the same authorization policy as direct human access so AI cannot become a permission bypass.

### Data protection

- TLS in transit and strong encryption at rest.
- Managed encryption keys, rotation, separation of duties and restricted key access.
- Encryption/key strategy appropriate to tenant and matter sensitivity.
- Secure secrets storage; no credentials or model/provider secrets in client bundles.
- Malware scanning, MIME validation, size limits, integrity hashing and quarantine for uploaded files.
- Content-disposition and browser controls for risky file types.

### Audit and integrity

- Append-only or tamper-evident server-side audit records transactionally coupled to important state changes.
- Trusted server timestamps and correlation/request IDs.
- Actor, delegated initiator, matter, target, action, outcome, source IDs and authorization decision captured where appropriate.
- Audit reads/searches/downloads/exports/shares as well as writes.
- Record denied access attempts and security-policy changes.
- AI audit should include model/runtime/version, retrieval/source IDs, tool calls, safety/permission decisions and human approval/release state without unnecessarily copying privileged content into logs.
- Integrity monitoring and security-alert workflows.

### Communications

- Authenticated secure portal messaging rather than ordinary email for privileged content by default.
- Encryption in transit and at rest.
- Matter membership checks on every conversation and attachment.
- Delivery/read status, revocation where legally permissible, retention rules and legal holds.
- Notification messages that do not expose privileged content on lock screens/email previews.
- Attachment scanning and download auditing.

### AI and model security

- Contracted provider terms appropriate for confidential legal data, including no training on customer case content where required.
- Defined retention and data-residency controls.
- Minimum necessary context sent to models.
- Source-grounded retrieval with authorization before retrieval, not after generation.
- Protection against prompt injection from uploaded documents and external research content.
- Tool allowlists, schema validation and human release gates for consequential actions.
- No autonomous filing, client advice, evidence modification or communication release without configured attorney authorization.
- Model/version change management and regression testing.

### Operational security

- Central monitoring, alerting and incident response.
- Vulnerability management, dependency scanning and patch process.
- Protected backups with tested restoration.
- Retention, deletion, preservation/legal-hold and data-export policies.
- Environment separation for development, staging and production.
- Production secrets and real data prohibited from public demo/test environments.
- Independent penetration testing/security assessment before sensitive pilot use and periodically thereafter.
- Written vendor/subprocessor inventory and data-flow map.

## Product principle

CaseBrief should make security visible without turning the interface into a warning screen. Users should be able to understand who can see a matter, why they have access, what AI used, what left the system, what changed, and who approved it.

The security promise is not “AI is safe because we say so.” The promise is that access is constrained, consequential actions are controlled, provenance is inspectable, sensitive content is minimized, and important activity is traceable.
