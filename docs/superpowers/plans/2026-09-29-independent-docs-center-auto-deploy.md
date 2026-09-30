# Independent Docs Center Auto-Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic three-locale static EarthCoop Docs Center from `EarthCoop-docs`, validate it in CI, and automatically deploy only generated output to `docs-preview.earthcoop.ir` after an approved merge to `main`.

**Architecture:** The independent frontend lives under `site/` and consumes governed repository metadata/content through a Node 22 build pipeline. `scripts/build-docs-center.mjs` emits a self-contained `dist/` with hash-based routing, locale-aware navigation, full-text search data, and `deployment-manifest.json`; CI validates and smoke-tests that artifact before an FTPS deployment job is allowed to run. `docs.earthcoop.ir` stays on its current runtime until a separate post-UAT cutover decision.

**Tech Stack:** Node.js 22 built-ins for build/validation/tests; static HTML/CSS/vanilla JavaScript runtime; GitHub Actions; `SamKirkland/FTP-Deploy-Action` pinned to a reviewed commit SHA; cPanel/FTPS; hash routing (`/#/...`).

**Spec:** `docs/superpowers/specs/2026-09-29-independent-docs-center-auto-deploy-design.md`

## Global Constraints

- Initial deployment target is only `docs-preview.earthcoop.ir`; do not change DNS or runtime for `docs.earthcoop.ir` in this plan.
- Source lives in `site/`; generated output lives in `dist/`; `dist/` is not authoritative source and must not be committed.
- Production-compatible document deep links remain `/#/documents/{id}`.
- Supported application locales are exactly `fa` (RTL), `en` (LTR), and `ar` (RTL).
- Missing translations must be represented explicitly; never silently present Persian content as Arabic or English.
- `document-registry.json`, `docs-manifest.json`, release evidence, and legal/editorial status semantics remain authoritative under `REGISTRY_MODEL.md`.
- Build inclusion, Git presence, or deployment must never create or imply legal effectiveness.
- Existing repository validation remains mandatory: `node --test` and `node scripts/validate-docs-manifest.mjs .`, plus terminology/freshness checks already present in CI.
- Deployment credentials must exist only as GitHub Actions secrets: `DOCS_FTP_SERVER`, `DOCS_FTP_USERNAME`, `DOCS_FTP_PASSWORD`, `DOCS_FTP_SERVER_DIR` (and `DOCS_FTP_PORT` only if host configuration actually requires it).
- FTPS deploy uploads only `dist/**`; no repository internals, source MDX, tests, `.git`, workflows, or environment files.
- Third-party deployment actions must be pinned to reviewed commit SHAs before merge.
- No destructive remote clean-slate deletion by default.
- Preview deployment must perform an HTTP smoke check after upload and verify the live `deployment-manifest.json` source SHA before the workflow is considered successful.

## File Structure

- Create: `site/index.html` — static application shell and no-script fallback.
- Create: `site/styles.css` — shared responsive styles and RTL/LTR rules.
- Create: `site/app.js` — hash router, locale switcher, document rendering, navigation, TOC, copy/print/download controls.
- Create: `site/search.js` — client-side full-text search over generated search index.
- Create: `site/assets/` — version-controlled logo/icons needed by the independent runtime.
- Create: `scripts/docs-center-lib.mjs` — focused pure functions for source selection, frontmatter/body normalization, routes, locale/status metadata, and search extraction.
- Create: `scripts/build-docs-center.mjs` — deterministic build orchestration from repository source to `dist/`.
- Create: `scripts/validate-docs-center.mjs` — static artifact validation and security/deep-link checks.
- Create: `tests/docs-center-source.test.mjs` — source-selection/status/fallback contracts.
- Create: `tests/docs-center-build.test.mjs` — deterministic build/deployment-manifest/search-index contracts.
- Create: `tests/docs-center-runtime.test.mjs` — static runtime contract checks without a browser dependency.
- Create: `tests/docs-center-deploy-workflow.test.mjs` — workflow trigger, gating, secret names, deploy scope, post-deploy check, and SHA-pinning contract.
- Create: `.github/workflows/deploy-docs-preview.yml` — build artifact + preview FTPS deployment after `main` validation.
- Modify: `.gitignore` — ignore `dist/` if not already ignored.
- Modify: `.github/workflows/validate-knowledge-content.yml` — add independent Docs Center build/validation gate on PR and `main`.
- Create: `docs/operations/docs-preview-deployment.md` — cPanel root, required secrets, first-deploy checklist, rollback, UAT, and cutover boundary.
- Create: `audits/knowledge-center/2026-09-29-independent-center-baseline.md` — provenance record for recovered/reconstructed 0.7.x baseline.

## Review Focus

1. **A registered document without an English or Arabic rendition:** language switch must show that locale as unavailable/fallback-labeled, never render Persian while claiming `en` or `ar`.
2. **A malformed or incomplete manifest/registry record:** build must fail closed before `dist/` or deployment is considered valid.
3. **Direct load/refresh of a deep hash route:** static `index.html` must boot and resolve `/#/documents/{id}` without server rewrite support.
4. **A document containing script-like HTML/MDX:** generated/runtime rendering must not execute arbitrary source scripts or inline event handlers.
5. **Two merges close together:** deployment concurrency must serialize preview deployments so an older artifact cannot overwrite a newer successful deployment.

---

### Task 1: Recover and Record the Independent Docs Center Baseline

**Files:**
- Create: `audits/knowledge-center/2026-09-29-independent-center-baseline.md`
- No product/runtime change in this task.

**Interfaces:**
- Consumes: historical package facts (`earthcoop-knowledge-center-0.7.1` latest known good baseline; earlier `0.6.0`, `0.6.1`, `0.7.0`), cPanel preview root `/home3/btboeapy/docs-preview.earthcoop.ir`, and current repo state.
- Produces: a provenance checklist naming which historical files/behaviors were recovered versus reconstructed; later tasks must use this as the UI/runtime compatibility baseline.

- [ ] **Step 1: Inspect available historical artifacts and prior branch evidence**

Search current repo history/branches and available project/library files for the latest 0.7.x package/source. Record exact recoverable filenames and hashes where available; do not invent missing source.

- [ ] **Step 2: Write the baseline audit**

Record at minimum: latest known package version, cPanel document root, observed runtime files/features (including logo/CSS baseline), whether original source bytes were recovered, and explicit reconstruction gaps.

- [ ] **Step 3: Verify the audit contains no unresolved ambiguous deployment path**

Run: `grep -n "docs-preview.earthcoop.ir\|/home3/btboeapy/docs-preview.earthcoop.ir\|0.7.1" audits/knowledge-center/2026-09-29-independent-center-baseline.md`

Expected: all three facts are present, with missing source explicitly labeled rather than guessed.

- [ ] **Step 4: Commit**

```bash
git add audits/knowledge-center/2026-09-29-independent-center-baseline.md
git commit -m "docs: record independent docs center baseline"
```

### Task 2: Define Source Selection, Locale, and Safety Contracts

**Files:**
- Create: `scripts/docs-center-lib.mjs`
- Create: `tests/docs-center-source.test.mjs`

**Interfaces:**
- Consumes: `document-registry.json`, `docs-manifest.json`, glossary/translation metadata, repository content files.
- Produces:
  - `loadDocsCenterModel(rootDir: string) -> Promise<DocsCenterModel>`
  - `resolveRendition(document: DocumentModel, locale: 'fa'|'en'|'ar') -> RenditionResolution`
  - `normalizeSourceText(source: string, path: string) -> NormalizedDocumentText`
  - `sanitizeSourceMarkup(source: string) -> string`
  - `makeDocumentRoute(documentId: string) -> string` returning `/#/documents/{id}`.

- [ ] **Step 1: Write failing source-contract tests**

Tests must assert: exactly `fa/en/ar`; correct RTL/LTR metadata; untranslated locale never masquerades as another locale; `makeDocumentRoute('econ-ref-01-fa-0-1')` yields `/#/documents/econ-ref-01-fa-0-1`; malformed required manifest fields reject; raw `<script>`, `onerror=`, and `javascript:` are stripped/rejected by normalization.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/docs-center-source.test.mjs`

Expected: FAIL because `scripts/docs-center-lib.mjs`/exports do not yet exist.

- [ ] **Step 3: Implement the minimal pure library**

Use Node built-ins only. Preserve governed statuses verbatim and keep source-selection logic separate from presentation.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/docs-center-source.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run repository regression gates**

Run:
```bash
node --test
node scripts/validate-docs-manifest.mjs .
node scripts/validate-terminology.mjs .
node scripts/check-translation-freshness.mjs .
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/docs-center-lib.mjs tests/docs-center-source.test.mjs
git commit -m "feat(docs): define independent center source contracts"
```

### Task 3: Recreate the Static Docs Center Runtime Shell

**Files:**
- Create: `site/index.html`
- Create: `site/styles.css`
- Create: `site/app.js`
- Create: `site/search.js`
- Create/Copy: `site/assets/earthcoop-logo.svg` or the verified current logo asset from repository baseline.
- Create: `tests/docs-center-runtime.test.mjs`

**Interfaces:**
- Consumes: generated `content-index.json`, `search-index.json`, `deployment-manifest.json` from Task 4.
- Produces: static runtime capable of hash routing, document rendering, TOC, locale switching, print/copy/download, search, and responsive RTL/LTR rendering.

- [ ] **Step 1: Write failing runtime contract tests**

Assert the shell contains no Mintlify dependency; router recognizes `#/documents/{id}`; locale setter applies `lang` and `dir`; print/copy/download controls exist; download exports the currently displayed source/rendition rather than an unrelated locale; search module filters by active locale; unavailable rendition UI is explicit; runtime does not use `innerHTML` with raw source text.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/docs-center-runtime.test.mjs`

Expected: FAIL because `site/` runtime does not yet exist.

- [ ] **Step 3: Implement the minimal static shell based on the recorded 0.7.x baseline**

Preserve baseline layout/branding where recoverable. Use DOM construction/text nodes for document content and generated safe HTML only where Task 2 explicitly permits it. Keep router hash-based.

- [ ] **Step 4: Run focused runtime tests**

Run: `node --test tests/docs-center-runtime.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site tests/docs-center-runtime.test.mjs
git commit -m "feat(docs): restore independent static docs center shell"
```

### Task 4: Build Deterministic `dist/`, Search Index, and Deployment Metadata

**Files:**
- Create: `scripts/build-docs-center.mjs`
- Create: `tests/docs-center-build.test.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Task 2 `loadDocsCenterModel`, Task 3 `site/` assets, source commit SHA from `GITHUB_SHA` or `git rev-parse HEAD`.
- Produces:
  - `buildDocsCenter({rootDir, outDir, sourceSha, builtAt}) -> Promise<BuildSummary>`
  - `dist/content-index.json`
  - `dist/search-index.json`
  - `dist/deployment-manifest.json`
  - copied static runtime/assets under `dist/`.

- [ ] **Step 1: Write failing build tests**

Use a temp fixture directory. Assert two builds with the same fixed `sourceSha` and `builtAt` produce byte-identical governed outputs; manifest contains repository, SHA, build schema version, locales `[fa,en,ar]`, file count, and hashes; search body includes body text/headings, not only title; route records use `/#/documents/{id}`; downloadable source/rendition metadata is locale-specific; malformed source fails closed.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/docs-center-build.test.mjs`

Expected: FAIL because builder is absent.

- [ ] **Step 3: Implement deterministic builder**

Sort all emitted records and file lists deterministically. Do not embed wall-clock time unless supplied through `builtAt`; CI supplies it explicitly. Copy only `site/` deployable files plus generated JSON.

- [ ] **Step 4: Run build tests and verify GREEN**

Run: `node --test tests/docs-center-build.test.mjs`

Expected: PASS.

- [ ] **Step 5: Build the real repository artifact**

Run:
```bash
rm -rf dist
node scripts/build-docs-center.mjs --out dist
```

Expected: `dist/index.html`, runtime assets, content/search indexes, and deployment manifest exist.

- [ ] **Step 6: Verify generated output is untracked**

Run: `git status --short`

Expected: no `dist/**` files listed.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-docs-center.mjs tests/docs-center-build.test.mjs .gitignore
git commit -m "feat(docs): build deterministic independent docs artifact"
```

### Task 5: Validate and Smoke-Test the Static Artifact

**Files:**
- Create: `scripts/validate-docs-center.mjs`
- Modify: `tests/docs-center-build.test.mjs`
- Modify: `.github/workflows/validate-knowledge-content.yml`

**Interfaces:**
- Consumes: a completed `dist/` from Task 4.
- Produces: `validateDocsCenter(outDir: string) -> Promise<ValidationReport>` and a PR/main CI gate that fails if output is unsafe/incomplete.

- [ ] **Step 1: Add failing validation tests**

Fixtures must cover: missing `index.html`; manifest SHA mismatch; locale set not exactly `fa/en/ar`; broken content route target; unsafe script/event-handler payload; missing search body; deployment manifest referring to a nonexistent file; valid deep hash-route boot contract.

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/docs-center-build.test.mjs`

Expected: FAIL on absent validator.

- [ ] **Step 3: Implement validator**

Validator must never contact production or mutate source. It reads generated files only and exits nonzero on any contract violation.

- [ ] **Step 4: Add build + validation to existing CI**

After current repository validators, add:
```bash
node scripts/build-docs-center.mjs --out dist
node scripts/validate-docs-center.mjs dist
```

- [ ] **Step 5: Run full local-equivalent gate**

Run:
```bash
node --test
node scripts/validate-docs-manifest.mjs .
node scripts/validate-terminology.mjs .
node scripts/check-translation-freshness.mjs .
node scripts/build-docs-center.mjs --out dist
node scripts/validate-docs-center.mjs dist
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/validate-docs-center.mjs tests/docs-center-build.test.mjs .github/workflows/validate-knowledge-content.yml
git commit -m "test(docs): gate independent center build in CI"
```

### Task 6: Add Preview FTPS Deployment Workflow Contract

**Files:**
- Create: `tests/docs-center-deploy-workflow.test.mjs`
- Create: `.github/workflows/deploy-docs-preview.yml`

**Interfaces:**
- Consumes: validated `dist/`; GitHub secrets `DOCS_FTP_SERVER`, `DOCS_FTP_USERNAME`, `DOCS_FTP_PASSWORD`, `DOCS_FTP_SERVER_DIR`.
- Produces: serialized preview deployment on `main`, manual re-deploy via `workflow_dispatch`, retained build artifact, and post-deploy live SHA verification.

- [ ] **Step 1: Write failing workflow contract test**

Parse workflow text and assert: trigger is `push` to `main` plus `workflow_dispatch`; `permissions: contents: read`; build/validate occurs before deploy; artifact upload is present; concurrency group exists with `cancel-in-progress: false`; all four exact secret names are referenced; local-dir is `dist/`; protocol is FTPS; no production domain/DNS step; FTP action is pinned to full 40-hex commit SHA, not a mutable tag; a post-deploy HTTP check fetches only `https://docs-preview.earthcoop.ir/deployment-manifest.json` and fails unless its `sourceSha` equals `GITHUB_SHA`.

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/docs-center-deploy-workflow.test.mjs`

Expected: FAIL because workflow does not exist.

- [ ] **Step 3: Verify and pin third-party action SHAs**

Use the same reviewed major deployment action pattern already used by EarthCoop, but resolve and record exact commit SHAs for `actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, and `SamKirkland/FTP-Deploy-Action` before committing workflow.

- [ ] **Step 4: Implement preview workflow**

The workflow must rebuild from checkout; do not reuse untrusted PR artifacts for deployment. It must fail if required secrets are absent without printing secret values. `server-dir` comes only from `DOCS_FTP_SERVER_DIR`. After FTPS upload, use a bounded-retry HTTP request to the preview `deployment-manifest.json`; only the preview hostname is permitted, and source SHA mismatch fails the job.

- [ ] **Step 5: Run workflow contract + all tests**

Run:
```bash
node --test tests/docs-center-deploy-workflow.test.mjs
node --test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/docs-center-deploy-workflow.test.mjs .github/workflows/deploy-docs-preview.yml
git commit -m "ci(docs): add gated preview FTPS deployment"
```

### Task 7: Document cPanel/Secrets Setup and Rollback

**Files:**
- Create: `docs/operations/docs-preview-deployment.md`

**Interfaces:**
- Consumes: Task 6 secret names/workflow; verified cPanel preview root `/home3/btboeapy/docs-preview.earthcoop.ir`.
- Produces: operator checklist sufficient to configure GitHub secrets and safely perform first deployment/rollback without exposing credentials.

- [ ] **Step 1: Write the operations runbook**

Include: exact secret names; cPanel preview document root; how to derive FTP `server-dir` from the FTP account root rather than assuming the absolute filesystem path; TLS/FTPS requirement; first-deploy backup; workflow verification; live `deployment-manifest.json` SHA check; rollback to last known-good artifact/commit; explicit statement that `docs.earthcoop.ir` is out of scope.

- [ ] **Step 2: Add a documentation contract assertion**

Extend `tests/docs-center-deploy-workflow.test.mjs` to assert the runbook contains all secret names, preview hostname, live SHA verification, rollback procedure, and production-cutover prohibition.

- [ ] **Step 3: Run focused tests**

Run: `node --test tests/docs-center-deploy-workflow.test.mjs`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/operations/docs-preview-deployment.md tests/docs-center-deploy-workflow.test.mjs
git commit -m "docs: add preview deployment and rollback runbook"
```

### Task 8: Final Branch Verification and PR

**Files:**
- Review all changes from this plan; no unrelated code changes.

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces: one reviewable PR that is safe to merge but cannot successfully deploy until repository secrets point to the preview cPanel target.

- [ ] **Step 1: Run the final local-equivalent validation gate from a clean generated state**

Run:
```bash
rm -rf dist
node --test
node scripts/validate-docs-manifest.mjs .
node scripts/validate-terminology.mjs .
node scripts/check-translation-freshness.mjs .
node scripts/build-docs-center.mjs --out dist
node scripts/validate-docs-center.mjs dist
```

Expected: PASS.

- [ ] **Step 2: Inspect generated deployment manifest**

Assert source SHA equals branch HEAD, languages are exactly `fa/en/ar`, and no secret/server credentials appear anywhere under `dist/`.

- [ ] **Step 3: Review branch diff for protected areas**

Confirm no files under `releases/foundational/**` changed, no foundational legal text was altered, no `document-registry.json` baseline/status was silently changed, and no credential was added.

- [ ] **Step 4: Push/open PR and wait for existing + new CI gates**

PR summary must state: preview-only deployment, no production cutover, required secrets are not in Git, and first live FTPS deployment occurs only after secrets are configured.

- [ ] **Step 5: Stop before merge for deployment-secret checkpoint**

Do not merge until the user has configured or authorized configuration of the four preview secrets and the preview FTP account/directory has been confirmed. If the tooling cannot write GitHub secrets, provide exact UI steps rather than requesting credentials in chat.

### Task 9: First Controlled Preview Deployment and UAT Checkpoint

**Files:**
- No source changes unless deployment/UAT finds a defect.

**Interfaces:**
- Consumes: merged Task 8 PR, configured preview secrets, cPanel preview host.
- Produces: live `docs-preview.earthcoop.ir` whose `deployment-manifest.json` identifies the exact merged commit.

- [ ] **Step 1: Verify merge-triggered workflow completes validation/build/artifact stages**

Expected: all pre-deploy gates PASS before FTPS step starts.

- [ ] **Step 2: Verify FTPS deploy and built-in post-deploy HTTP SHA check succeed**

Expected: preview deploy PASS and workflow confirms live `deployment-manifest.json.sourceSha == main HEAD`; `docs.earthcoop.ir` remains unchanged.

- [ ] **Step 3: Independently verify live version identity**

Open preview deployment manifest and compare source SHA to merged `main` SHA outside the workflow log.

- [ ] **Step 4: Run focused live UAT**

Verify Persian RTL, English LTR, Arabic RTL/unavailable-translation behavior, language switching, full-text search, TOC/anchors, ECON-REF-01 discoverability, `/#/documents/{id}` deep links, mobile layout, copy/print/download controls, refresh/cache behavior, and representative 404/missing-document handling.

- [ ] **Step 5: Record UAT result**

If all acceptance points pass, record preview as candidate for later production-cutover design. Do **not** switch `docs.earthcoop.ir` in this plan.
