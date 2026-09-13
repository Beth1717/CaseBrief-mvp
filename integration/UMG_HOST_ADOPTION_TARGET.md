# CaseBrief × UMG host-adoption target

Status: **synthetic integration target for CaseBrief MVP**. This file does not claim production deployment or live UMG connectivity.

## Frozen CaseBrief baseline

- Repository: `Beth1717/CaseBrief-mvp`
- Branch at handoff start: `main`
- Frozen commit: `e8f9a5444fbee8b518e587530cc77b9d6d5dc912`
- Commit message: `Update CaseBrief CRI, review decisions and prototype activity history`
- Current port base: `96116ec08f857ff54a111c7ea11cfe6ebd8b8bf4`
- Current host layout: modular v3 scripts with security and runtime enforcement.
- Host shape: public static HTML/JavaScript prototype using synthetic records and browser-local storage.
- Current UMG screen: seeded deterministic sandbox review only; it does **not** call the live UMG runtime.

## Exact local commands

Static state regression:

```bash
node tests/state.cjs
```

Browser regression, with Playwright + Chromium available:

```bash
python -m http.server 8765
node tests/browser.cjs
node integration/tests/browser-host-adoption.cjs
```

Host-adoption defect probes added on this branch:

```bash
node integration/tests/host-adoption.cjs
```

The host-adoption probes are intentionally expected to fail against the frozen baseline until the UMG remediation controls are adopted into the real CaseBrief path.

## Code path exercised

The current Record Consistency Review is implemented through the modular host:

- `views-system.js` owns `runConsistency()`.
- `core.js` owns `workspace`, `data`, `record(...)`, `syncPicker()`, and `switchCase(id)`.
- `security.js` and `security-runtime.js` provide the broader v3 client-side permission demonstration.
- `core.js` exposes the narrow same-origin `caseBriefHostApi` used by the host controls.

This is the current host path to replace or wrap for the first guarded UMG integration. The safe target is not merely the visual UMG panel: the authorization, source-grounding, expectation-retention and audit decisions need to sit on the state/service boundary used by every path that can surface or change a finding.

## Synthetic fixture

See `integration/fixtures/record-consistency-target.json`.

It defines:

1. one authorized matter (`matter-001`),
2. one unauthorized/wrong matter (`matter-002`) for the synthetic actor,
3. trusted source IDs for the authorized matter,
4. an expected body-camera record (`BC-1841-A`) that remains an independent expectation even if no inventory row is present,
5. an adversarial unsupported assertion whose cited source is not in the trusted source set.

No real client information is used.

## Four-test validation target

See `integration/tests/host-adoption.cjs`.

The four probes are:

1. **Baseline known finding:** the seeded consistency review still surfaces a known supported contradiction.
2. **Unsupported assertion rejection:** a finding with an untrusted/nonexistent source must not be accepted merely because its category and citation-looking field are present.
3. **Wrong-matter denial:** the synthetic actor authorized only for `matter-001` must not be able to switch into/read `matter-002`.
4. **Missing-record retention:** removing an inventory/finding row must not silently erase the independently expected `BC-1841-A` concern.

The frozen baseline should pass probe 1 and fail probes 2–4. That failure pattern is the evidence needed before adopting the v0.2.1 remediation. After integration, rerun the **same probes unchanged** and capture the new PASS receipt.

## Authorization fixture

Synthetic actor:

```json
{
  "actor_id": "demo-reviewer",
  "allowed_matter_ids": ["matter-001"],
  "denied_matter_ids": ["matter-002"]
}
```

This is intentionally stricter than the current demo implementation, which has a visible matter switcher but no server-enforced identity or authorization layer.

## Technical contact / ownership

CaseBrief repository owner: `Beth1717`.

Host-specific questions should be routed through the CaseBrief project owner. Engineering changes must preserve the boundary that CaseBrief remains the application/system-of-record and final human review authority; UMG must not self-grant host permissions or silently mutate authoritative CaseBrief state.

## Evidence to capture on the first adoption run

Capture all of the following, without changing the four probes between before/after runs:

- frozen CaseBrief commit SHA;
- remediation package version/hash;
- exact commands executed;
- stdout/stderr and exit code for each test command;
- before-run result showing probes 2–4 fail on the frozen baseline;
- patch/commit that wires the remediation into the CaseBrief host path;
- after-run result showing all four probes pass;
- actor, matter and document/source IDs used in the synthetic fixture;
- audit/trace record proving the wrong-matter attempt was denied;
- provenance record proving the unsupported assertion was rejected/quarantined;
- expectation record proving `BC-1841-A` remains visible even without an inventory row;
- confirmation that no real client data, live production migration, public deployment or autonomous production approval occurred.

## Important limitation

This repository currently has no authenticated backend, durable database, verified identity, server-enforced tenancy, or live UMG adapter. Therefore this branch establishes a reproducible **host-adoption target**, not a production security claim. The v0.2.1 remediation should be wired into a service boundary before any real-client pilot.
