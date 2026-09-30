# EarthCoop Docs Center Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore all evidenced post-0.8 Docs Center work onto the recovered 0.8 UX/runtime without redesigning the product, fabricating translations, changing legal semantics, or weakening preview-first deployment safety.

**Architecture:** Keep the recovered 0.8 runtime as the visual/interaction shell. Replace its historical fixed data/SEO artifacts with generated outputs from the current governed manifest/registry/release model: one normalized content catalog feeds navigation, search, static routes, locale availability, and SEO. Deferred interactive feedback/comments remain a separate subsystem and are not implemented by this plan.

**Tech Stack:** Node.js 22 ESM build/validation scripts, recovered static HTML/CSS/JS 0.8 runtime, GitHub Actions, cPanel static hosting, strict FTPS.

**Spec:** `docs/superpowers/specs/2026-09-30-docs-center-recovery-gap-matrix.md`

## Global Constraints

- Preserve the recovered EarthCoop Knowledge Center 0.8 UI/UX baseline; no redesign in this plan.
- Read and obey `REGISTRY_MODEL.md` before touching version/status/registry/manifest/navigation semantics.
- `document-registry.json` remains public-baseline/translation-status authority; `docs-manifest.json` remains ingestion/review authority; release snapshots remain immutable evidence.
- Do not change foundational article text, numbering, legal meaning, legal effect, authority, or release history.
- Persian (`fa`) is canonical for current foundational documents.
- Legacy Mintlify `ar/` paths containing Persian are compatibility aliases, never genuine Arabic translations.
- English/Arabic availability is driven only by an explicitly registered usable rendition, never by path/file existence alone.
- Preview remains `docs-preview.earthcoop.ir`; no production cutover or production-domain deployment in this plan.
- Behavior-changing scripts/validators/build logic use RED→GREEN TDD.
- Required final gates: `node --test`, `node scripts/validate-docs-manifest.mjs .`, terminology/freshness validators, recovered build, recovered validator, preview UAT.

## Review Focus

- A `reference` document such as `ECON-REF-01` must become discoverable without accidentally promoting every manifest entry or changing legal/public status.
- A legacy `ar/...` Persian mirror must never create an Arabic locale, `hreflang=ar`, Arabic navigation, or Arabic search result.
- A registered-but-not-effective document may be reviewable without being mislabeled effective/public/current in a legal sense.
- SEO generation must use the target environment origin and must not leave stale production canonical/sitemap values on preview.
- Search/navigation/static routes must derive from the same eligible content catalog so a document cannot appear in one surface and disappear from another.

---

### Task 1: Introduce one governed recovered-runtime content catalog

**Files:**
- Create: `scripts/build-recovered-content-catalog.mjs`
- Modify: `scripts/generate-legacy-docs-center-data.mjs`
- Modify: `scripts/build-recovered-docs-center.mjs`
- Test: `tests/recovered-content-catalog.test.mjs`
- Test: `tests/legacy-docs-center-generator.test.mjs`

**Interfaces:**
- Consumes: `docs-manifest.json`, `buildCurrentFoundational(rootDir)`, locale policy.
- Produces: `buildRecoveredContentCatalog(rootDir, options) -> { documents, references, locales, routeEntries }`.

- [ ] **Step 1: Write the failing catalog tests**

Assert that the catalog includes all ten eligible foundational documents plus `ECON-REF-01`, preserves each `documentId`, `contentClass`, version, legalStatus, authority, canonicalLanguage, rendition statuses, and does not treat arbitrary `reference`/guide entries as foundational.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/recovered-content-catalog.test.mjs tests/legacy-docs-center-generator.test.mjs`  
Expected: FAIL because no shared recovered content catalog exists and `reference` is still filtered out.

- [ ] **Step 3: Implement `buildRecoveredContentCatalog()`**

Use explicit supported classes: `foundational_document` and governed `reference`. Foundation content continues through `buildCurrentFoundational()`; reference content reads its registered manifest source without synthesizing legal state.

- [ ] **Step 4: Adapt legacy package generation to consume the catalog**

Keep existing 0.8 package shape for foundational documents; add a reference-package representation with stable route ID `econ-ref-01-fa-0-1` compatible with the main EarthCoop link contract.

- [ ] **Step 5: Run focused tests and verify GREEN**

Expected: all catalog/generator tests pass; no legal source files changed.

- [ ] **Step 6: Commit**

`feat(docs): add governed recovered content catalog`

---

### Task 2: Add reference navigation, route, reader, and visibility policy

**Files:**
- Create: `scripts/recovered-route-policy.mjs`
- Modify: `scripts/build-recovered-docs-center.mjs`
- Modify: `scripts/render-recovered-static-documents.mjs`
- Test: `tests/recovered-reference-routing.test.mjs`
- Test: `tests/render-recovered-static-documents.test.mjs`

**Interfaces:**
- Consumes: Task 1 catalog.
- Produces: `buildRecoveredRouteEntries(catalog)`, stable SPA/static routes for eligible references.

- [ ] **Step 1: Write failing `ECON-REF-01` route/visibility tests**

Assert discoverability in a dedicated Reference collection, stable deep link compatible with the EarthCoop contract, correct `official_draft` display, and no claim of legal effect.

- [ ] **Step 2: Verify RED**

Run focused tests; expected failure because recovered runtime currently exposes only foundational generated packages.

- [ ] **Step 3: Implement generic reference routing/navigation**

Do not special-case title/layout around ECON only; route generation keys from `contentClass: reference`, stable ID/slug, and visibility policy.

- [ ] **Step 4: Reuse the recovered 0.8 reader/static renderer**

Where reference markdown has no article structure, render document body faithfully without inventing provisions.

- [ ] **Step 5: Verify GREEN and commit**

`feat(docs): expose governed reference documents`

---

### Task 3: Reconnect the real locale/rendition model to the 0.8 runtime

**Files:**
- Modify: `scripts/docs-center-locale-policy.mjs`
- Create: `scripts/recovered-locale-catalog.mjs`
- Modify: `scripts/build-recovered-docs-center.mjs`
- Test: `tests/docs-center-locale-policy.test.mjs`
- Test: `tests/recovered-locale-catalog.test.mjs`

**Interfaces:**
- Consumes: Task 1 catalog rendition metadata.
- Produces: locale availability per content identity plus global UI locale availability.

- [ ] **Step 1: Add failing locale-truth tests**

Pin these cases: FA current ⇒ available; EN `not_translated` ⇒ unavailable; legacy `ar/...` Persian path even if metadata is malformed ⇒ never genuine Arabic; genuine registered EN usable rendition ⇒ available; missing translation must remain explicitly unavailable rather than silently masquerading as FA.

- [ ] **Step 2: Verify RED**

Expected failure because recovered deployment currently hardcodes `displayLocales: ['fa']`.

- [ ] **Step 3: Implement locale catalog**

Return per-document locale availability and direction (`fa/ar=rtl`, `en=ltr`) only for genuine renditions.

- [ ] **Step 4: Emit locale metadata for the recovered runtime**

Keep Persian-only UI behavior when no genuine alternative is available; do not add an Arabic selector until real Arabic content exists.

- [ ] **Step 5: Verify GREEN and commit**

`feat(docs): reconnect governed locale availability`

---

### Task 4: Build one full-text search/navigation corpus from eligible current content

**Files:**
- Create: `scripts/build-recovered-search-index.mjs`
- Modify: `scripts/build-recovered-docs-center.mjs`
- Modify generated recovered data entrypoint under `dist/src/content/...` through the build script only
- Test: `tests/recovered-search-index.test.mjs`

**Interfaces:**
- Consumes: Task 1 catalog, Task 2 routes, Task 3 locale availability.
- Produces: records `{documentId, contentClass, locale, title, heading, anchor, body, status, version, route}`.

- [ ] **Step 1: Write failing full-text coverage tests**

Assert body-term hits for a foundational article and ECON-REF-01 body text; locale filtering; correct route/anchor; hidden/ineligible renditions absent.

- [ ] **Step 2: Verify RED**

Expected failure because current recovered search coverage is not generated from the complete governed catalog.

- [ ] **Step 3: Implement deterministic search-index generation**

Normalize Persian search text consistently with the existing 0.8 search behavior; preserve stable anchors.

- [ ] **Step 4: Connect recovered runtime search to generated index**

Do not replace the 0.8 search UX; only replace its data source.

- [ ] **Step 5: Verify GREEN and commit**

`feat(docs): index recovered governed content`

---

### Task 5: Regenerate all SEO/static-route assets from the current route registry

**Files:**
- Create: `scripts/build-recovered-seo.mjs`
- Modify: `scripts/render-recovered-static-documents.mjs`
- Modify: `scripts/build-recovered-docs-center.mjs`
- Modify: `scripts/validate-recovered-docs-center.mjs`
- Test: `tests/recovered-seo.test.mjs`
- Test: `tests/validate-recovered-docs-center.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–4 route/content/locale catalogs and recovered 0.8 `seo-head.js`, `structured-data.js`, `static-page.js` renderers.
- Produces: static pages, canonical/OG/Twitter/JSON-LD, `sitemap.xml`, `robots.txt`, optional `hreflang` only for genuine alternates.

- [ ] **Step 1: Write failing environment/SEO tests**

Assert preview canonical origin never becomes `docs.earthcoop.ir`; sitemap routes equal indexable current routes; robots policy is explicit for preview; ECON-REF-01 receives metadata; `hreflang=ar` is absent without genuine Arabic; JSON-LD/breadcrumbs reuse recovered 0.8 renderers.

- [ ] **Step 2: Verify RED**

Expected failure because some recovered static/SEO artifacts remain historical snapshots.

- [ ] **Step 3: Implement current route-driven SEO generation**

Reuse recovered renderer logic; do not invent a parallel SEO framework.

- [ ] **Step 4: Add fail-closed SEO validation**

Validator rejects stale production origin on preview, sitemap entries without routes, missing required canonical metadata, and legacy alias-derived Arabic alternates.

- [ ] **Step 5: Verify GREEN and commit**

`feat(docs): regenerate recovered SEO assets`

---

### Task 6: Audit and classify guides, status, map, and glossary without silently rewriting them

**Files:**
- Create: `docs/audits/2026-09-30-recovered-guide-truth-audit.md`
- Modify: `scripts/inventory-product-guides.mjs` only if needed for machine-readable classification
- Create: `scripts/build-recovered-editorial-status.mjs`
- Test: `tests/recovered-editorial-status.test.mjs`

**Interfaces:**
- Consumes: repository guide inventory/evidence and recovered 0.8 page inventory.
- Produces: classification `verified_current | needs_review | historical_snapshot | unavailable` for non-legal editorial pages.

- [ ] **Step 1: Write failing classification tests**

Pin that recovered Persian guides are not automatically `verified_current`, reviewed English repository guides are not automatically mapped to Persian, and historical status/map/glossary pages cannot silently claim current product truth.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Produce evidence audit and generated editorial-status metadata**

No broad content rewrite in this task. Record exact source/evidence for any `verified_current` claim.

- [ ] **Step 4: Surface under-audit state in recovered runtime where needed**

Preserve layout; update labels/metadata only.

- [ ] **Step 5: Verify GREEN and commit**

`docs: classify recovered editorial content truth`

---

### Task 7: Lock functional UAT contracts for recovered controls and mobile/deep links

**Files:**
- Create: `tests/recovered-runtime-contract.test.mjs`
- Modify: `docs/operations/docs-preview-deployment.md`
- Test: existing recovered build/deploy tests as applicable

**Interfaces:**
- Consumes: completed recovered build.
- Produces: explicit pre-cutover UAT checklist and static/runtime contracts.

- [ ] **Step 1: Write failing/guard tests for route/control presence**

Pin document TOC, copy-link, print, PDF/history controls where supported, mobile navigation assets, direct static routes, 404 behavior, and all main-app deep-link aliases.

- [ ] **Step 2: Run tests and verify any real gaps**

Do not change working UI solely to make selectors convenient; adapt tests to stable semantic contracts.

- [ ] **Step 3: Fix only evidenced runtime regressions**

- [ ] **Step 4: Update UAT runbook**

Include desktop/mobile, full-text search, reference discovery, locale truth, SEO source inspection, copy/print/PDF/history, 404/direct refresh.

- [ ] **Step 5: Commit**

`test(docs): lock recovered runtime UAT contracts`

---

### Task 8: Cross-repository cutover compatibility gate

**Files:**
- EarthCoop-docs: `docs/operations/docs-preview-deployment.md`
- EarthCoop (separate follow-up branch): `config/docs-links.php` and `tests/Feature/Documentation/DocsCenterLinkContractTest.php` only if final route contract requires updates

**Interfaces:**
- Consumes: final Docs Center route catalog.
- Produces: verified route compatibility between Docs Center production candidate and EarthCoop links.

- [ ] **Step 1: Compare final route catalog with EarthCoop link contract**

Required identities include all ten foundational documents plus `ECON-REF-01`.

- [ ] **Step 2: If routes already match, record evidence and make no EarthCoop code change**

- [ ] **Step 3: If aliases are needed, add aliases in Docs Center first**

Prefer preserving inbound application links over changing the main application unnecessarily.

- [ ] **Step 4: Run targeted EarthCoop link-contract tests if any cross-repo change is required**

- [ ] **Step 5: Freeze production cutover checklist**

Do not change DNS/production deployment in this task. Production cutover remains a separate explicit approval.

---

## Deferred Separate Subproject: Per-provision feedback/comments

The prior project decision to support feedback/comments on individual clauses with a review/moderation queue is **not implemented by this recovery plan**. It requires an authenticated write backend, authorization/privacy/moderation rules, storage schema, abuse controls, and UI integration. Treat it as a separate spec/plan after the static recovery reaches production readiness.

## Final Verification Gate

After Tasks 1–8:

- [ ] Run `node --test`.
- [ ] Run `node scripts/validate-docs-manifest.mjs .`.
- [ ] Run `node scripts/validate-terminology.mjs .`.
- [ ] Run `node scripts/check-translation-freshness.mjs .`.
- [ ] Build recovered output with `node scripts/build-recovered-docs-center.mjs --out dist-recovered`.
- [ ] Validate with `node scripts/validate-recovered-docs-center.mjs --out dist-recovered`.
- [ ] Confirm no diff to foundational legal source/release history unless explicitly authorized.
- [ ] Deploy only to preview through the existing strict-FTPS workflow.
- [ ] Run live smoke and user UAT on `docs-preview.earthcoop.ir`.
- [ ] Request explicit production-cutover approval separately.

## Self-Review Result

- Spec coverage: all P0/P1 recovery gaps from the matrix map to Tasks 1–8; per-provision feedback is intentionally split into a later subproject.
- Type consistency: content catalog → routes/locales → search → SEO is a single dependency chain; downstream tasks do not invent parallel source-of-truth models.
- Guardrails: legacy `ar/` alias, legal-status separation, preview-only origin, reference visibility, and cross-repo deep links each have explicit tests.
- Proportion: implementation details are limited to interfaces, tests, and exact safety decisions; recovered 0.8 renderer/UI internals remain reused rather than rewritten.
