# Idaho pretrial pilot fixture

The selected workflow is Idaho pretrial defence involving possession and
search-and-seizure. All six records are fictional. Court/county, participant,
legal corpus and court templates remain unselected or unvalidated.

`fixtures/idaho-pretrial.json` binds the Notion pack to the application's v3
matter/document/evidence/witness/timeline schema. `appState` is the only data
loaded into the application. Expectations, negative controls and CRI arithmetic
inputs stay outside application/model input. No expected finding is seeded as
an actual detected finding. S04/S05 are deliberately identical duplicates.

## Run

From the repository root:

```sh
node tests/idaho-pretrial.cjs
npm install --no-save --no-package-lock playwright@1.62.1
npx --no-install playwright install chromium
python3 -m http.server 8765 --bind 127.0.0.1
```

In a second terminal:

```sh
node tests/browser-idaho-pretrial.cjs
```

The browser suite stores `appState` in a clean isolated browser workspace and
reloads the actual application. It does not change the default public fixture
or grant the pilot matter host-adoption authority. Do not import real records.

## Implemented in this change

- Schema binding, record/detail rendering and persistence tests.
- Pilot-specific source preview generated only from role-permitted records.
- Deterministic source-derived candidate findings for sequencing, unresolved ownership and an exact duplicate record; these remain **AI-detected — not human-confirmed** review prompts.
- Pilot-specific CRI ruleset `casebrief.cri.idaho-pretrial.v0.2`: 40% record completeness, 35% work control, 25% attention control, with item-level deductions and a current synthetic fixture score of 63%.
- Attorney-controlled read-only recipient release. Only S01-S04 are releaseable by the pilot allowlist; privileged S06 is mechanically excluded. Expiry and revocation remove later reads.
- Pilot drafting blocked at UI and catalogue creation boundaries; filing readiness remains false until Idaho templates are validated.
- Pilot dashboard has no inherited deadline.
- CaseBrief↔UMG v0.1-draft contract scaffold with host attestation, deny-without-payload behavior, source-bound response validation, zero dispatch and local fallback.
- Original host-adoption probes and grants remain unchanged.
- New Idaho Node/browser suites plus UMG contract suite are included in CI alongside the original host-adoption suites.

## Remaining acceptance gaps

- The candidate findings and CRI are deterministic synthetic pilot logic, not a validated model assessment or attorney legal conclusion.
- The pilot is not granted guarded-host authority merely by existing in the workspace; future UMG analysis must use the explicit CaseBrief host-attestation contract.
- The separate Founding Pilot / ingestion branch now conflicts with current `main` and must be reconciled deliberately.
- The original historical fixture retains its older CRI implementation.
- Synthetic validation does not establish search legality, Idaho authority
  accuracy, live NeoUMG connectivity or production security.

## Validation

Previous exact head `84e303fdfff492d784902e69b8cf7f73f92eb44d` passed eleven suites in GitHub Actions run #3. The current revision expands the suite with UMG draft-contract validation and updated Idaho Node/browser acceptance checks. Treat the current-head Actions result as authoritative once complete.

No browser, compiler, hosted service or production-security result is claimed unless an exact-head receipt explicitly shows it.

Source pack: https://app.notion.com/p/3edf1cfb412181f0bf37e18fef82eaa3

## Finding lifecycle and CRI follow-up (PR #4)

See [PILOT_FINDINGS_CRI_SLICE.md](PILOT_FINDINGS_CRI_SLICE.md) for the current
item policy, acceptance criteria and exact files. Candidate findings retain
human decisions and source-change history. Source edits reset review credit.
The segmented precision ring keeps its central value and explains CRI on
hover/focus; activation shows auditable calculation details. Applicability
requires a reason, canonical provision remains separate from disposition, and
reviewer-only calculation exports carry meaning/time/version.

PR #4 parent head `df9bbc53de274118d85df08df710632e7a1b4d61` passed all fourteen
Node/browser suites in Actions run #14. Use the latest PR-head receipt for the
follow-up revision rather than treating that parent receipt as current evidence.
