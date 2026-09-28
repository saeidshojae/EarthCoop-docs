# EarthCoop Independent Docs Center Auto-Deploy Design

**Date:** 2026-09-29  
**Status:** Design approved in chat; implementation not yet authorized  
**Target repository:** `saeidshojae/EarthCoop-docs`  
**Initial deployment target:** `docs-preview.earthcoop.ir` on cPanel  
**Production docs domain during rollout:** `docs.earthcoop.ir` remains on the existing runtime until UAT and explicit cutover approval

## 1. Purpose

Create a deterministic, repository-driven build and deployment path for the independent EarthCoop Docs Center so that an approved merge to `main` can automatically:

1. validate documentation and registry contracts;
2. build the independent static Docs Center from repository source;
3. verify the generated output;
4. deploy only the generated static output to the cPanel preview site via FTPS;
5. leave the current production docs domain unchanged until a separate, explicit migration decision.

The goal is to remove the historical manual workflow in which an external Work session created a cPanel ZIP package that was later uploaded/extracted manually.

## 2. Current-state findings

### 2.1 Repository role

`EarthCoop-docs` is the versioned source of documentation, foundational documents, registries, release snapshots, manifest metadata, and compatibility configuration. Repository governance explicitly warns not to assume Mintlify is the production runtime solely because `docs.json` remains present.

### 2.2 Historical independent Docs Center

The independent Docs Center was previously packaged as deployable static cPanel ZIPs outside the repository-driven workflow. The present `main` branch does not contain a reproducible independent frontend build pipeline that generates the historical deployment package from source.

Therefore, adding an FTP upload step directly to the current repository would be unsafe: it could deploy raw MDX/repository files instead of a generated static site.

### 2.3 Existing deployment precedent

The main EarthCoop application already uses GitHub Actions plus FTPS deployment to cPanel with credentials stored as GitHub Actions secrets. The Docs Center should reuse the deployment pattern, not the application artifact itself.

## 3. Scope

### In scope

- Reintroduce the independent Docs Center frontend/build source into `EarthCoop-docs` in a maintainable location.
- Produce a deterministic static output directory, tentatively `dist/`.
- Build content from repository-controlled manifests/registries rather than a manually assembled ZIP.
- Preserve multilingual behavior for Persian, English, and Arabic as defined by the current documentation registry/translation model.
- Preserve RTL for Persian and Arabic and LTR for English.
- Preserve search, table of contents, document navigation, version/status display, copy/print/download behaviors that are part of the approved independent Docs Center baseline.
- Add build-time validation and smoke tests.
- Add GitHub Actions deployment to the cPanel preview directory only after validation/build/tests pass.
- Upload only generated deployable files, not repository internals.
- Keep `docs.earthcoop.ir` on the current runtime during preview/UAT.

### Out of scope for this phase

- DNS cutover of `docs.earthcoop.ir`.
- Removal of Mintlify compatibility files.
- Changing legal status, document authority, baseline, or effectiveness.
- Rewriting foundational legal text.
- Automatic publication of files merely because they exist in Git.
- Production deployment without a successful preview/UAT checkpoint.

## 4. Source-of-truth boundaries

The independent Docs Center must preserve the repository's governance model:

- `document-registry.json` remains the public baseline and translation-status registry.
- `docs-manifest.json` remains the knowledge-center ingestion/review manifest.
- `releases/foundational/<date>/` remains registered release evidence.
- `published/foundational/` remains generated/review material where applicable.
- Presence in Git, inclusion in a build, or a technical status label must not be interpreted as legal effectiveness.

The frontend must render exact legal/editorial status values supplied by governed metadata. It must not infer that `registered`, `current`, `final`, `published`, or `effective` are equivalent.

## 5. Proposed repository layout

The implementation plan may refine names after inspecting historical package artifacts, but the design target is:

```text
EarthCoop-docs/
├─ app/ or site/                 # independent Docs Center source
│  ├─ index.html / templates
│  ├─ js/
│  ├─ css/
│  └─ assets/
├─ scripts/
│  ├─ build-docs-center.mjs
│  └─ validate-docs-center.mjs
├─ tests/
│  └─ docs-center-*.test.mjs
├─ dist/                         # generated, not authoritative source
├─ document-registry.json
├─ docs-manifest.json
└─ .github/workflows/
   └─ deploy-docs-preview.yml
```

`dist/` should normally be generated in CI and not treated as source-of-truth. Whether it is committed must be decided in implementation planning; the default recommendation is **not** to commit generated output.

## 6. Deterministic build contract

The build must be reproducible from a clean checkout of a specific commit.

Minimum build contract:

1. install only pinned/lockfile-controlled dependencies;
2. validate registry and manifest contracts;
3. load only approved content sources;
4. normalize document metadata into a generated content index;
5. generate language-specific navigation and searchable content;
6. emit static assets and content into `dist/`;
7. generate `dist/deployment-manifest.json` containing at least:
   - source repository;
   - source commit SHA;
   - build timestamp;
   - build version/schema version;
   - language set;
   - generated file count;
   - optional content/asset hashes;
8. fail closed if required files or metadata are invalid.

No deployment step may synthesize new legal/editorial status.

## 7. Multilingual and directionality contract

The independent runtime must use real application locales rather than the historical Mintlify `ar`-as-RTL compatibility workaround.

Required locales:

- Persian: `fa`, RTL, primary/source language for foundational legal content.
- English: `en`, LTR.
- Arabic: `ar`, RTL.

Language switching must resolve only to an existing/registered translation or an intentionally defined fallback. A missing translation must not silently masquerade as another language.

The translation registry/baseline introduced in the current repository should drive availability labels and fallback behavior.

## 8. Search contract

Search must operate on document body content, not title/abstract only.

At build time, produce a searchable index containing at least:

- document ID;
- locale;
- title;
- headings/anchors;
- body text or tokenized body representation;
- status/version metadata relevant to display;
- canonical document route.

Search results must preserve locale and navigate to the correct document/anchor.

## 9. Static route and hosting contract

The generated site must work correctly on ordinary cPanel static hosting without requiring a persistent Node/PHP application server.

The implementation must choose one of these route strategies during planning based on the verified cPanel baseline:

1. hash-based routing (`/#/...`) requiring no rewrite rules; or
2. clean paths with a tested `.htaccess` fallback to `index.html`.

The chosen strategy must preserve current inbound links used by the main EarthCoop application, especially document deep links. If compatibility redirects are needed, they must be explicit and tested.

## 10. CI gates

A push/merge must not deploy unless all required gates pass.

Expected order:

```text
checkout
  ↓
repository validators
  ↓
unit/contract tests
  ↓
independent Docs Center build
  ↓
static-output validation
  ↓
smoke tests against dist/
  ↓
artifact upload (for debugging/rollback)
  ↓
FTPS deploy to preview
  ↓
post-deploy HTTP smoke check
```

Repository-mandated commands remain required, including:

```bash
node --test
node scripts/validate-docs-manifest.mjs .
```

Additional focused Docs Center tests should be added test-first for behavior-changing build/deploy logic.

## 11. Deployment workflow

### Trigger

Initial target behavior:

- automatic deploy on successful push/merge to `main`;
- manual `workflow_dispatch` allowed for controlled re-deployment of the current commit.

### Safety

- deployment job depends on all validation/build jobs;
- use a concurrency group so deployments do not overlap;
- do not cancel an active deployment midway unless proven safe;
- use strict FTPS;
- credentials stored only in GitHub Actions secrets;
- deployment uploads only `dist/**` contents;
- never upload `.git`, source MDX trees, tests, GitHub workflow files, secrets, or local environment files;
- no destructive clean-slate deletion by default.

### Required repository secrets

Recommended secret names:

- `DOCS_FTP_SERVER`
- `DOCS_FTP_USERNAME`
- `DOCS_FTP_PASSWORD`
- `DOCS_FTP_SERVER_DIR`

Optional if needed by host:

- `DOCS_FTP_PORT`

The workflow must fail before upload if required secrets are absent.

## 12. Preview-first rollout

Phase 1 target is only `docs-preview.earthcoop.ir`.

During this phase:

- `docs.earthcoop.ir` remains unchanged;
- the preview is deployed automatically after `main` passes all gates;
- user acceptance testing is performed on the real cPanel-hosted preview;
- Mintlify remains available as rollback/reference until production cutover.

Minimum UAT acceptance areas:

- Persian navigation and RTL;
- English navigation and LTR;
- Arabic navigation and RTL;
- language switching;
- full-text search;
- table of contents/anchors;
- foundational document status/version display;
- ECON-REF-01 discoverability;
- deep links from the EarthCoop application;
- mobile layout;
- copy/print/download controls that are part of the approved baseline;
- 404/direct-refresh behavior;
- browser cache/update behavior.

## 13. Rollback

Every deployment should retain a downloadable CI artifact of the generated `dist/` for the source commit.

Preferred rollback path:

1. identify last known-good commit/artifact;
2. re-run the deployment workflow for that exact artifact/commit;
3. verify preview health;
4. do not rewrite documentation history simply to roll back hosting output.

The production docs domain remains an additional rollback boundary until cutover.

## 14. Production cutover checkpoint

Moving `docs.earthcoop.ir` from the current runtime to the independent cPanel deployment is a separate task and requires explicit approval after UAT.

Before cutover, verify:

- preview UAT passed;
- deep-link compatibility is proven;
- HTTPS certificate is valid;
- DNS target and cPanel document root are known;
- rollback DNS/runtime procedure is documented;
- production deployment secrets/directory are distinct or explicitly controlled;
- search engines/canonical URLs/redirects are reviewed;
- no Mintlify-only dependency remains required for public operation.

## 15. Security model

- No FTP password or username in repository content or logs.
- No `.env` deployment artifact.
- Actions use minimum `contents: read` permission unless another permission is demonstrably required.
- Third-party GitHub Actions should be pinned to a reviewed version; pinning to a commit SHA should be considered for the production-cutover phase.
- Generated content must escape/sanitize untrusted markup as appropriate for the chosen renderer.
- CI logs must not print secret values or server credentials.

## 16. Observability

Each successful workflow should make it easy to answer:

- what source commit is live on preview;
- when it was built/deployed;
- what build version produced it;
- whether validation/build/smoke/post-deploy checks passed.

`deployment-manifest.json` should be retrievable from the preview site or otherwise exposed in a non-sensitive diagnostics surface so the live version can be compared with `main`.

## 17. Implementation sequencing

The implementation plan should be dependency-ordered and test-first:

1. recover/inspect the most recent independent Docs Center package/source baseline;
2. define exact static runtime and deep-link compatibility requirements;
3. place independent frontend source under version control;
4. add failing build-contract tests;
5. implement deterministic build to `dist/`;
6. add full-text search index generation and locale tests;
7. add static-output/smoke tests;
8. add preview FTPS workflow with secret validation;
9. configure GitHub secrets and cPanel preview directory;
10. perform first controlled deployment;
11. run UAT;
12. only later design and approve production cutover.

## 18. Success criteria

This phase is complete when:

- a clean checkout of `EarthCoop-docs@<sha>` can deterministically build the independent Docs Center;
- all repository and Docs Center validation gates pass before deployment;
- merging an approved change to `main` automatically deploys only generated output to `docs-preview.earthcoop.ir`;
- the deployed preview exposes the exact source commit/build metadata;
- Persian, English, and Arabic behavior passes UAT;
- `docs.earthcoop.ir` remains unchanged until a separately approved cutover.

## 19. Non-goals / explicit safeguards

- Auto-deploy does **not** mean auto-approval of documentation content.
- Build inclusion does **not** create legal effect.
- Technical configuration does **not** gain legislative authority.
- Deployment automation must not bypass the repository's branch/PR governance.
- No production-domain migration occurs in this implementation phase.
