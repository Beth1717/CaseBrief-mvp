# CaseBrief × UMG v0.2.1 — Host-adoption status

## Current status

**Guarded host integration candidate implemented on branch `umg-host-adoption-v0.2.1`; not yet production deployment.**

Frozen CaseBrief baseline: `e8f9a5444fbee8b518e587530cc77b9d6d5dc912`.

Ported host baseline: `96116ec08f857ff54a111c7ea11cfe6ebd8b8bf4`
(`main`, modular v3 security build).

UMG remediation package used for this pass:

`CaseBrief_UMG_Remediation_v0.2.1.zip`

SHA-256:

`0fd7ad2bf3e857d65a8363a82368cd127091c9f2b2db5c5e71fb01a5cc1e28cc`

The supplied fresh-extraction receipt reports the remediation package as locally qualified, with no real client data, deployment, publication, or remote push performed by the sender. CaseBrief host adoption remained explicitly unverified in that receipt; this branch is the first CaseBrief-side adoption pass.

## What is now implemented on the CaseBrief side

`integration/host-controls.js` introduces a narrow guarded host boundary around the current synthetic Record Consistency Review. It does four things that the old direct `data.issues` renderer did not:

1. **Matter authorization gate** — the active actor must have an explicit matter grant before `switchCase` can change the active matter. Denials are recorded through CaseBrief activity logging.
2. **Reviewed finding/source catalogue** — a candidate consistency finding is accepted only when its finding id, category, statement, and ordered source ids exactly match a reviewed synthetic catalogue entry. Unknown or mutated candidates are quarantined rather than silently accepted.
3. **Independent expectation ledger** — expected record `BC-1841-A` is tracked outside the issue/inventory row. Removing the ordinary missing-evidence finding therefore does not erase the unresolved expectation.
4. **Audit-visible guard decisions** — each guarded analysis records accepted finding ids, quarantined finding ids, expectation states, and the control version.

The guarded boundary is now explicitly linked to the project-authored sleeve `SLV.CASEBRIEF.LEGALANALYSIS.v0.1` revision 1. Installation and analysis audit events include the sleeve identity; analysis events also include the applied control-block IDs. `integration/tests/casebrief-sleeve-contract.cjs` verifies that the adapter manifest matches the checked-in sleeve and that the external-action stack remains both `BLOCKED` and locked `OFF`.

This is intentionally conservative. It does not attempt to infer semantic truth from arbitrary prose and citations. It implements the same trust-boundary principle described by the v0.2.1 remediation: trusted source identity and reviewed interpretation are separate from proposed inference.

## Four-probe adoption target

The original four probe assertions remain the acceptance target:

1. supported contradiction remains visible;
2. unsupported assertion is rejected/quarantined;
3. wrong-matter actor is denied;
4. missing expected record remains visible even after the ordinary finding row is removed.

`integration/tests/host-adoption.cjs` now loads the modular host scripts and the guarded host controls before running those same four assertions.

A local semantic check of the ported control module passed all four intended behaviours. Capture the authoritative clean-checkout receipt against the exact GitHub head after the rebased branch is published.

## Demo integration

`integration/umg-host-adoption.html` launches the existing CaseBrief UI and installs the guarded host controls into that same-origin synthetic application at runtime. This keeps the main public demo unchanged until the adoption PR is reviewed while still providing a concrete integrated candidate.

## What this does NOT claim

- It is not a live connection to Christopher's UMG runtime.
- It is not authenticated production authorization.
- Browser-local audit history remains mutable and is not a tamper-proof production audit log.
- The reviewed finding catalogue is synthetic and hard-coded for the validation fixture.
- The expectation ledger is synthetic and does not assert that every real-world matter should contain body-camera evidence.
- No real client data should be entered into this public/static MVP.

## Next engineering gate

Before merge to the public demo or any real-data environment:

- run the four host-adoption probes from a clean checkout and capture stdout, environment, exact head SHA, and package hash;
- run the modular `tests/state.cjs` regression;
- run `integration/tests/casebrief-sleeve-contract.cjs` to prevent adapter/sleeve drift;
- run browser regression with Chromium/Playwright where available;
- replace the synthetic grant/catalogue stores with authenticated server-side CaseBrief repositories before handling real matters;
- map these host controls to the actual UMG/PB1 service boundary rather than treating the browser module as the production security boundary.
