# Docs Reader Capability Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore and permanently guard the recovered Docs Center 0.8 document-reader capabilities—PDF download, copy, print, history/permalink and provision navigation—without redesigning the UI, changing legal content, or touching Production.

**Architecture:** Treat the hash-pinned `earthcoop-knowledge-center-0.8.0` archive as the presentation/capability baseline and the current governed registries/manifests as content authority. First prove the deployed candidate still carries the baseline reader capabilities, then make the smallest integration changes needed to preserve/reconnect them after current-content generation and static rendering. Harden the recovered validator so future green CI cannot silently ship a reader that lost those capabilities.

**Tech Stack:** Node.js 22 ESM scripts/tests, recovered static HTML/CSS/JS 0.8 runtime, GitHub Actions validation, cPanel Preview via strict FTPS.

**Spec:** `docs/superpowers/specs/2026-09-30-docs-center-recovery-gap-matrix.md`

## Global Constraints

- Preserve the recovered EarthCoop Knowledge Center 0.8 UI/UX baseline; no redesign in this plan.
- Do not change foundational article text, numbering, legal meaning, legal effect, authority, or registered release history.
- Preview remains `docs-preview.earthcoop.ir`; Production `docs.earthcoop.ir` remains out of scope.
- Persian remains the only live display locale at this checkpoint.
- Legacy Mintlify `ar/` content must never become genuine Arabic availability.
- Existing full-text search, SEO/static generation, route/reference integration, TOC polish and Preview safety must remain intact.
- Behavior-changing work follows RED → GREEN TDD.
- Avoid repeated full CI while diagnosing: use focused tests first; use repository/full recovered validation only at the final gate.

## Review Focus

- Static rendering must not suppress a PDF/download control merely because its VM bootstrap omitted runtime download metadata.
- Current-content regeneration must not overwrite or disconnect baseline reader capability metadata.
- Copy/print/permalink/history/provision navigation must survive both SPA/hash navigation and direct static document routes.
- Foundational PDF availability must remain tied to the ten current foundational documents without implying that `ECON-REF-01` has a PDF when no governed PDF exists.
- Validator success must mean the final deployable artifact—not only the original recovery archive—still exposes the required reader capabilities.

---

### Task 1: Establish an evidence-first reader capability diagnostic

**Files:**
- Create: `scripts/audit-recovered-reader-capabilities.mjs`
- Test: `tests/recovered-reader-capability-audit.test.mjs`

**Interfaces:**
- Consumes: a materialized/built recovered runtime directory.
- Produces: `auditRecoveredReaderCapabilities({ outDir }) -> { pdfFiles, controlEvidence, downloadEvidence, issues }`.

- [ ] **Step 1: Write failing tests for the capability inventory**

Cover: discovery of PDF files anywhere under the final artifact; detection of copy, print, download, history/permalink and provision-navigation evidence in reader/runtime source; and an explicit issue when a required capability is absent.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/recovered-reader-capability-audit.test.mjs`

Expected: FAIL because the audit module does not exist.

- [ ] **Step 3: Implement the read-only audit**

Do not mutate the runtime. Recursively inspect files and report evidence/absence only. Keep detection tolerant of implementation details; do not require guessed PDF filenames.

- [ ] **Step 4: Run the focused test and verify GREEN**

Expected: PASS.

- [ ] **Step 5: Use the audit against the real recovered candidate in CI once**

Add a temporary/diagnostic invocation only on this branch or run the script against a built `dist-recovered` candidate, capture the exact PDF paths and reader-control evidence, and use that evidence to remove all remaining filename/selector guesses before Task 2. Do not deploy this branch to Preview.

- [ ] **Step 6: Commit**

`test(docs): inventory recovered reader capabilities`

---

### Task 2: Add failing regression contracts for the final deployable artifact

**Files:**
- Modify: `tests/validate-recovered-docs-center.test.mjs`
- Modify: `scripts/recovered-uat-policy.mjs` only after RED is observed.
- Test: `tests/validate-recovered-docs-center.test.mjs`

**Interfaces:**
- Consumes: Task 1 evidence from the real 0.8 candidate.
- Produces: validator failures when required final-artifact reader capabilities disappear.

- [ ] **Step 1: Add a fixture that deliberately lacks one reader capability at a time**

Pin PDF availability for the ten foundational documents, copy, print, download, permalink/history and provision navigation using only evidence confirmed in Task 1.

- [ ] **Step 2: Run the focused validator test and verify RED**

Run: `node --test tests/validate-recovered-docs-center.test.mjs`

Expected: new cases FAIL because the current validator accepts capability-incomplete artifacts.

- [ ] **Step 3: Implement the minimal validator/policy assertions**

Reuse the read-only capability audit rather than duplicating regex/inventory logic.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `node --test tests/recovered-reader-capability-audit.test.mjs tests/validate-recovered-docs-center.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

`test(docs): guard recovered reader capabilities`

---

### Task 3: Repair only the broken reader integration path

**Files:**
- Modify only files proven responsible by Task 1/2, expected candidates:
  - `scripts/render-recovered-static-documents.mjs`
  - `scripts/build-recovered-docs-center.mjs`
  - `scripts/generate-legacy-docs-center-data.mjs`
- Test: existing recovered build/static-render tests plus focused new regression tests.

**Interfaces:**
- Consumes: governed document packages plus baseline 0.8 reader/download data.
- Produces: final static and SPA document routes with the same required reader capabilities.

- [ ] **Step 1: Write the smallest failing test for the proven break point**

If the evidence confirms the current static VM bootstrap `documentDownloads: {}` suppresses download UI, the test must reproduce exactly that loss and assert the current foundational PDF action remains visible/connected. If a different break point is proven, test that instead.

- [ ] **Step 2: Run focused tests and verify RED for the expected reason**

Do not change production code until the failing behavior is demonstrated.

- [ ] **Step 3: Implement the minimal repair**

Preserve baseline reader control code and feed it the current governed download metadata instead of replacing controls or redesigning markup. Do not fabricate a reference-document PDF.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run only affected recovered build/static-render/validator tests first.

- [ ] **Step 5: Commit**

`fix(docs): preserve recovered reader capabilities`

---

### Task 4: Final regression and Preview-only verification

**Files:**
- Modify operational docs only if observed behavior requires an explicit UAT clarification.

**Interfaces:**
- Consumes: final candidate from Tasks 1–3.
- Produces: a reviewable branch that is safe to merge only if all established contracts remain green.

- [ ] **Step 1: Run the complete repository test suite**

Run: `node --test`

Expected: PASS.

- [ ] **Step 2: Run manifest/terminology/freshness validators**

Run:
- `node scripts/validate-docs-manifest.mjs .`
- `node scripts/validate-terminology.mjs .`
- `node scripts/check-translation-freshness.mjs .`

Expected: PASS.

- [ ] **Step 3: Build and validate both current independent and recovered candidates**

Run:
- `node scripts/build-docs-center.mjs --out dist`
- `node scripts/validate-docs-center.mjs --out dist`
- `node scripts/build-recovered-docs-center.mjs --out dist-recovered`
- `node scripts/audit-recovered-reader-capabilities.mjs --out dist-recovered`
- `node scripts/validate-recovered-docs-center.mjs --out dist-recovered`

Expected: PASS, with ten foundational PDFs and all required reader controls evidenced in the final recovered artifact.

- [ ] **Step 4: Review the complete branch diff before PR**

Reject any unrelated legal/editorial/UI/deployment changes.

- [ ] **Step 5: Open PR and run one final CI gate**

Do not merge until the exact PR head is green and reviewed. After merge, Preview auto-deploy may run; Production remains untouched.

---

## Separate subsystem: private publishing assistant

The prior private/local publishing assistant is intentionally **not** reconstructed in this plan. Historical evidence places its final implementation after the last pushed `feature/publish-current-docs` branch state; its reported contract was loopback-only, Host-controlled, exact human confirmation, one-time 32-byte per-change token, one-time candidate consumption, package/checksum generation, and exclusion of private/admin files from the public package. That subsystem requires its own recovery/reimplementation plan after the public reader regression is closed, so reader repair cannot accidentally expose admin functionality.