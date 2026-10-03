# EarthCoop Docs Production Cutover Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare EarthCoop Knowledge Center for a future safe Production cutover while preserving the current Preview and without touching Production/DNS during implementation.

**Architecture:** Introduce an explicit deployment profile (`preview` vs `production`) into the recovered build, make SEO/headers/static rendering profile-aware, validate each profile independently, and add manual Production deploy/rollback workflows. Update the main EarthCoop application's docs-link contract in a separate repository branch so it emits stable non-hash document routes.

**Tech Stack:** Node.js 22, GitHub Actions, static HTML/JS/CSS recovered runtime, Apache `.htaccess`, strict FTPS, Laravel/PHP tests in the EarthCoop application.

**Spec:** `docs/superpowers/specs/2026-10-03-docs-production-cutover-readiness-design.md`

## Global Constraints

- Do not deploy to `docs.earthcoop.ir`, modify DNS, or submit Search Console data without explicit owner approval.
- Preview origin remains exactly `https://docs-preview.earthcoop.ir` and remains globally non-indexable.
- Production origin is exactly `https://docs.earthcoop.ir` and is indexable only according to governed route policy.
- No legal document text, registered release evidence, document status, or version is changed by this work.
- English guide mappings and Persian/English language behavior must remain unchanged.
- Production FTPS credentials/server directory must be separate from Preview credentials/server directory.
- Every implementation task follows RED → GREEN and ends with targeted verification before broader validation.
- Changes to `saeidshojae/EarthCoop` and `saeidshojae/EarthCoop-docs` use separate branches/PRs; no direct writes to either `main`.

## Review Focus

1. A Production artifact must never inherit Preview `noindex` or `docs-preview.earthcoop.ir` metadata.
2. A Preview artifact must never become indexable merely because the build gained Production mode.
3. An invalid deployment target/origin combination must fail closed rather than silently generate mixed metadata.
4. Legacy document links from the main EarthCoop application must resolve to current stable routes, especially `ECON-REF-01`.
5. Production deployment/rollback must verify the exact source SHA actually served after FTPS upload.

---

### Task 1: Add explicit recovered deployment profiles

**Files:**
- Create: `scripts/recovered-deployment-profile.mjs`
- Modify: `scripts/build-recovered-docs-center.mjs`
- Modify: `scripts/render-recovered-static-documents.mjs`
- Test: `tests/recovered-deployment-profile.test.mjs`

**Interfaces:**
- Produces: `resolveRecoveredDeploymentProfile({ target, canonicalOrigin }) -> { target, canonicalOrigin, indexable, seoPreview, globalNoindex }`
- Consumed by: build, static renderer, `.htaccess`, site config, manifest, SEO generation.

- [ ] **Step 1: Write failing profile tests**
  - `preview + https://docs-preview.earthcoop.ir` => non-indexable, SEO preview mode, global noindex.
  - `production + https://docs.earthcoop.ir` => indexable, SEO production mode, no global noindex.
  - Any crossed/unknown target-origin pair => throws.

- [ ] **Step 2: Run targeted test and confirm RED**
  - Run: `node --test tests/recovered-deployment-profile.test.mjs`
  - Expected: FAIL because resolver does not exist.

- [ ] **Step 3: Implement deployment profile resolver**
  - Validate bare HTTPS origin.
  - Allow only the two exact target/origin pairs from the spec.

- [ ] **Step 4: Thread profile through recovered build**
  - Add CLI `--target preview|production` and `DOCS_DEPLOYMENT_TARGET` fallback.
  - Preview default remains unchanged for existing CI.
  - Replace hard-coded `preview: true`, `indexable: false`, `previewIndexing` semantics with profile-derived values.
  - Manifest records `deploymentTarget` and `indexing: enabled|disabled`.

- [ ] **Step 5: Run targeted tests**
  - Expected: PASS.

- [ ] **Step 6: Commit**
  - `feat(docs): add explicit preview and production build profiles`

### Task 2: Make generated HTML, headers, robots, and SEO profile-aware

**Files:**
- Modify: `scripts/render-recovered-static-documents.mjs`
- Modify: `scripts/build-recovered-docs-center.mjs`
- Modify as needed: `scripts/build-recovered-seo.mjs`
- Test: `tests/recovered-production-artifact-contract.test.mjs`
- Test existing Preview contracts.

**Interfaces:**
- Consumes: deployment profile from Task 1.
- Produces: profile-correct `.htaccess`, HTML robots metadata, canonical/OG/JSON-LD, `robots.txt`, sitemap.

- [ ] **Step 1: Write RED artifact tests**
  - Production HTML contains `docs.earthcoop.ir`, never `docs-preview.earthcoop.ir`.
  - Production HTML is not globally `noindex,nofollow`.
  - Preview remains `noindex,nofollow` and uses only Preview origin.
  - Production `.htaccess` keeps security/HTTPS headers but omits global `X-Robots-Tag: noindex, nofollow`.

- [ ] **Step 2: Run targeted tests and confirm RED**

- [ ] **Step 3: Replace Preview-only HTML patch with profile-aware static metadata patch**
  - Keep bilingual/language-runtime code unchanged.
  - Fail if a Production artifact contains the Preview host.

- [ ] **Step 4: Generate profile-aware Apache and SEO assets**

- [ ] **Step 5: Run targeted + existing Preview tests**
  - Expected: both profiles PASS.

- [ ] **Step 6: Commit**
  - `feat(docs): generate profile-safe SEO and hosting metadata`

### Task 3: Add a Production artifact validator without deploying

**Files:**
- Create: `scripts/validate-recovered-production-artifact.mjs`
- Modify: `.github/workflows/validate-knowledge-content.yml`
- Test: `tests/recovered-production-validator.test.mjs`

**Interfaces:**
- Consumes: Production `dist` generated with `--target production --canonical-origin https://docs.earthcoop.ir`.
- Produces: deterministic pass/fail gate for Production readiness.

- [ ] **Step 1: Write RED validator fixtures/tests**
  - Reject Preview hostname anywhere in public metadata/config.
  - Reject global noindex.
  - Reject wrong canonical origin or manifest target/indexing state.
  - Require sitemap/robots consistency and current runtime invariants.

- [ ] **Step 2: Run and confirm RED**

- [ ] **Step 3: Implement validator**

- [ ] **Step 4: Extend repository validation workflow**
  - Build Preview candidate and validate as today.
  - Separately build Production candidate into another directory and run Production validator.
  - Do not upload/deploy Production candidate from this validation workflow.

- [ ] **Step 5: Run full validation and confirm GREEN**

- [ ] **Step 6: Commit**
  - `ci(docs): validate production artifact without deployment`

### Task 4: Add manual Production deployment and rollback workflows

**Files:**
- Create: `.github/workflows/deploy-docs-production.yml`
- Create: `.github/workflows/rollback-docs-production.yml`
- Create: `docs/operations/docs-production-cutover-runbook.md`
- Test: workflow contract tests in `tests/docs-production-workflow-contract.test.mjs`

**Interfaces:**
- Production deploy inputs: source ref/SHA plus fixed confirmation phrase.
- Secrets: separate `DOCS_PROD_FTP_SERVER`, `DOCS_PROD_FTP_USERNAME`, `DOCS_PROD_FTP_PASSWORD`, `DOCS_PROD_FTP_SERVER_DIR`.
- Rollback input: retained Production artifact/run identifier plus explicit rollback confirmation.

- [ ] **Step 1: Write RED workflow contract tests**
  - Production workflow is `workflow_dispatch` only.
  - Requires exact confirmation.
  - Uses Production secrets only.
  - Executes tests + Production build + validator before FTPS.
  - Verifies live `deployment-manifest.json` source SHA afterward.
  - Rollback is manual and verifies restored live SHA.

- [ ] **Step 2: Run and confirm RED**

- [ ] **Step 3: Implement deploy workflow**
  - Upload exact Production candidate artifact before FTPS.
  - `dangerous-clean-slate: false`.
  - No DNS action.

- [ ] **Step 4: Implement rollback workflow and runbook**
  - Document preflight, explicit go/no-go point, smoke URLs, rollback trigger, and post-cutover Search Console steps.

- [ ] **Step 5: Run validation without dispatching Production workflow**

- [ ] **Step 6: Commit**
  - `ci(docs): add guarded production deploy and rollback gates`

### Task 5: Align EarthCoop application's docs-link contract

**Files (repository `saeidshojae/EarthCoop`, separate branch):**
- Modify: `config/docs-links.php`
- Modify: `tests/Feature/Documentation/DocsCenterLinkContractTest.php`
- Search/review: all callers of docs-links config.

**Interfaces:**
- Emits stable Production URLs consumed by footer/document links.
- Does not depend on Preview host.

- [ ] **Step 1: Create a separate EarthCoop branch from current `main`**

- [ ] **Step 2: Write RED expectations**
  - Foundational index => `/documents/`.
  - Publication policy => `/documents/publication-policy/`.
  - Foundational documents => `/documents/{slug}/`.
  - ECON-REF-01 id/slug => `econ-ref-01`.
  - No emitted link contains `/#/documents/` or `econ-ref-01-fa-0-1`.

- [ ] **Step 3: Run only documentation link contract tests and confirm RED**

- [ ] **Step 4: Update config and any direct callers**

- [ ] **Step 5: Run targeted documentation/footer tests, then the project-appropriate final validation gate**

- [ ] **Step 6: Open separate PR; do not merge until Docs Production artifact contracts are green**

### Task 6: Final readiness gate and owner handoff

**Files:**
- Update: `docs/operations/docs-production-cutover-runbook.md`
- Update plan checklist/evidence as needed.

**Interfaces:**
- Consumes green PRs/artifact validations from Tasks 1–5.
- Produces a single go/no-go report; it does not deploy.

- [ ] **Step 1: Verify current Preview remains live on the same source SHA and behavior**
  - Language switch, Search, Theme, document reader, PDF/download, 31 English guides.

- [ ] **Step 2: Build and validate the exact Production release candidate locally/CI without upload**

- [ ] **Step 3: Verify cross-repository link PR against the same route contract**

- [ ] **Step 4: Confirm manual Production/rollback workflows are present but have not executed**

- [ ] **Step 5: Produce go/no-go report**
  - Include exact Docs SHA, EarthCoop SHA/PR, expected Production origin, smoke checklist, and rollback artifact.

- [ ] **Step 6: Stop for explicit owner authorization before first Production deployment/DNS-related action**
