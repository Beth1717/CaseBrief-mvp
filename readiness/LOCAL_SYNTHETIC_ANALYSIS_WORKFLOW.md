# Local synthetic analysis-to-CaseBrief handoff

**Scope:** fictional documents only; loopback services only; no confidential-client data.

## 1. Start the November 4 UMG runtime

Use the immutable October 30 base archive and the November 4 overlay. Verify both archive hashes and the delta manifest before use. Apply the overlay to a fresh extraction of the base; do not edit the original archive.

From the merged package root:

```bash
python3 working-release/framework-replay/casebrief_umg_local_framework_service.py --host 127.0.0.1 --port 8767
```

Check readiness:

```bash
curl http://127.0.0.1:8767/ready
```

The supported service binds to loopback only. The November 5 independent replay and package test results are recorded in `readiness/UMG_NOV04_REPLAY_2026-11-05.md`.

## 2. Start the CaseBrief local analysis host

Use Node.js 24 or newer:

```bash
CASEBRIEF_UMG_ENDPOINT='http://127.0.0.1:8767/v0.1/record-consistency' npm run start:analysis
```

Open:
- Main CaseBrief demo: `http://127.0.0.1:8780/`
- Fictional-document workbench: `http://127.0.0.1:8780/analysis/`

If the UMG endpoint is not configured, the analysis workbench clearly reports `NOT_CONFIGURED`; its proposals are still local CaseBrief proposals and must not be represented as UMG-validated.

## 3. Analyse and review fictional documents

1. Add two or more fictional extracts.
2. Run the explicit-time rules or a separately configured local Ollama model.
3. Inspect the exact source quotations and source snapshot digest.
4. Assess passage support before confirming a proposal.
5. Use a reason for each disposition.
6. Download the local synthetic review receipt.

Every proposal remains `HUMAN_REVIEW_REQUIRED`. UMG provides governance/transport validation, not general semantic contradiction detection. Fresh arbitrary candidates may be quarantined by UMG even when the local CaseBrief analysis has produced a separate candidate proposal.

## 4. Import the receipt into the main CaseBrief workspace

1. Open the main CaseBrief demo at `http://127.0.0.1:8780/`.
2. Open **UMG Runtime / Analysis Trace**.
3. Use **Untrusted local receipt inbox** to import the downloaded JSON receipt.
4. The dashboard shows the number of quarantined imported receipts; the UMG screen shows the proposal summaries and source references.

The importer performs basic shape, synthetic-scope and zero-dispatch checks. It copies proposal statements and source locator metadata, not source quote text or reviewer reasons. It does not cryptographically authenticate the receipt. Every imported item is labelled `UNTRUSTED_QUARANTINED`.

**Import does not attach the proposal to the active matter or change case issues, CRI, chronology, evidence, witnesses, filings or communications.** The source workbench matter ID is not a main CaseBrief matter ID. Manual source mapping and separate attorney validation are required before any future case linkage. The inbox itself is browser-local storage, not the SQLite host audit ledger.

## 5. Boundaries

- Fictional/synthetic material only.
- No external dispatch, filing, messaging or case mutation.
- No production service authentication, tenant isolation, hosted operations or provider qualification.
- The local review actor is self-asserted.
- The SQLite audit chain is locally hash-chained, not externally signed or independently tamper-proof.
- Historical receipts become read-only after a browser-session refresh or server restart.
- The workflow does not establish legal correctness, attorney approval, or production readiness.

The local analysis workbench and receipt importer are engineering prototypes. They are not a substitute for the authenticated backend, source-release controls, attorney validation, retention/deletion policy, security testing and operational ownership required for a real public-defense pilot.
