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
- Pilot-specific source preview generated only from role-permitted records;
  no Jordan Hale answers, body-camera claims or fictional court drafts.
- Pilot drafting blocked at UI and catalogue creation boundaries; filing
  readiness remains false until Idaho templates are validated.
- Pilot dashboard shows insufficient CRI data and no verified deadline.
- Validated 40/35/25 weighted arithmetic helper; no invented case score.
- Original host-adoption probes unchanged; original matter grants unchanged.
- Both new suites added to CI alongside the original nine suites.

## Remaining acceptance gaps

- The source preview is deterministic, not a model or issue detector.
- The pilot is not granted guarded-host access; its reviewed finding catalogue
  and laboratory/custody expectation ledger are not implemented.
- Item-level completeness/work/attention scoring and calibration remain open.
- Client document access currently follows broad role/classification rules,
  not the selected released-source list. Sharing, expiry and revocation need
  separate implementation. These tests do not certify recipient isolation.
- The original Jordan Hale fixture retains its older CRI implementation.
- Synthetic validation does not establish search legality, Idaho authority
  accuracy, live NeoUMG connectivity or production security.

## Validation at development time

The new Node suite and the five original Node suites passed locally. Browser
execution was blocked by an invalid Chromium download; a pre-existing Chromium
binary also failed at startup. No browser pass is claimed. The expanded GitHub
workflow supplies matching Playwright/Chromium and captures exact-head results.
The original Actions run #2 and open installation thread belong to the prior
host-adoption head and are not new validation or reviewer sign-off for this work.

Source pack: https://app.notion.com/p/3edf1cfb412181f0bf37e18fef82eaa3
