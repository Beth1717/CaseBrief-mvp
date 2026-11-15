# Synthetic ingestion recovery

The source-intake slice has been recovered from the intent of PR #2 without merging its stale security/core replacements, commercial assumptions or unpinned CI. `ingestion-demo.js` adds the Case Ingestion view to the existing static demo. All samples are fixed fictional strings; there is no file upload, court/provider request, malware scan, OCR/extraction or production intake service.

## Implemented flow

1. Attorney, co-counsel and investigator demo roles can import permitted fixed samples. Privileged internal notes remain unavailable to the investigator. Promotion/revocation additionally require review decisions.
2. SHA-256 identifies the UTF-8 bytes of the JSON-encoded synthetic payload string. It is not a hash of an original legal file, authenticity proof, or chain-of-custody certificate.
3. Exact duplicates within the active matter create no duplicate source or assertion. New content with the same external reference becomes a new quarantined version with the same logical document ID.
4. Quarantine stores sample originals and their derived assertions outside case documents and analysis. Derived assertions remain labelled as sample derivations, not independently verified facts.
5. Promotion requires a nonblank human reason and an unchanged role, matter, document and source snapshot after digest calculation. It creates an unreviewed case document; it does not confirm findings or authenticate content.
6. Replacing a promoted version preserves prior payload/hash/history, marks the old version superseded, disables its assertions and reopens linked findings. An older quarantined version cannot silently downgrade a newer promoted version.
7. Revocation removes the active document, disables its assertions and invalidates linked human review. Old payloads remain visible only to authorized intake roles as history; they are not active case inputs.
8. Source/document/assertion/review/event changes are staged and saved in one browser-storage write. Failure restores the previous in-memory state, reports the failure and creates no saved success. This is a browser demonstration, not a backend transaction guarantee.

Fixed court-notice variants exercise version deltas without inventing a verified deadline. Fixed discovery-manifest variants exercise replacement; a fixed internal note exercises privilege filtering. Original-file validation, ingestion extraction, duplicate-file policy, court APIs, archive/legal-hold and malware scanning remain production work.

## Protection and limitations

Every asynchronous operation captures the original active data object and actor/profile, then rechecks permissions after hashing. A switched matter/role or locked session prevents mutation. Payload/hash mismatch prevents promotion. General activity events contain version/reference/status metadata and a reason-recorded flag; human reasons remain on the protected source ledger, reducing indirect disclosure to an investigator viewing activity history.

Existing source classification and Idaho family-release allowlists remain in force. New imported documents are not automatically released to family recipients. The browser remains inspectable through developer tools and mutable local storage, so none of this authorizes real legal information or establishes production tenant isolation. The Node synthetic host prototype is separate and receives no requests from this browser.

## Reproduction

```sh
npm ci --ignore-scripts
npm run test:ingestion
npm start
```

Open the local app, choose Case Ingestion, import a sample, inspect quarantine, promote with a reason, import its updated version, promote, then revoke. Switch to investigator/client to inspect restrictions. No external account or paid service is needed.

Node tests cover quarantine exclusion, duplicate prevention, original-version preservation, replacement/revocation, reasons, privilege filtering, asynchronous matter/role changes, hash mismatch, downgrade refusal and storage rollback for import/promotion/revocation. The actual browser suite tests dialogs, reload persistence, escaped reasons, access restrictions and mobile containment. CI retains the previous 22 suites and adds these two, for 24 total.
