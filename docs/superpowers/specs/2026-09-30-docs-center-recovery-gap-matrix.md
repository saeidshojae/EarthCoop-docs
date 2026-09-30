# EarthCoop Docs Center Recovery Gap Matrix

**Date:** 2026-09-30  
**Status:** Recovery audit baseline  
**Target repository:** `saeidshojae/EarthCoop-docs`  
**Current preview runtime:** recovered EarthCoop Knowledge Center `0.8.0` on `docs-preview.earthcoop.ir`  
**Production target:** `docs.earthcoop.ir` only after explicit UAT/cutover approval

## 1. Purpose

This document freezes the recovery audit after restoring the historical EarthCoop Knowledge Center 0.8 UI/runtime and reconnecting current governed foundational content. It prevents a second round of accidental redesign or forgotten work by separating four states:

1. **Recovered / connected** — implemented in the preview runtime and fed from current governed sources where applicable.
2. **Present in repository but not connected** — completed repository work exists, but the recovered 0.8 runtime does not yet expose it.
3. **Recovered but stale / needs regeneration** — the 0.8 feature exists, but its content, routes, SEO metadata, or evidence snapshot is old and must be generated from current sources.
4. **Decision recorded, implementation not evidenced** — discussed/approved behavior exists in project history, but no complete implementation was found in the recovered runtime or current repository.

The matrix is evidence-first. Presence of a file, translation candidate, or technical status does not change legal effect. `REGISTRY_MODEL.md`, `docs-manifest.json`, `document-registry.json`, and registered release snapshots retain their existing authority boundaries.

## 2. Evidence baseline

### 2.1 Repository governance

- `REGISTRY_MODEL.md` defines the separation between public baseline, knowledge-center ingestion, and registered release evidence.
- `docs-manifest.json` is the knowledge-center ingestion contract and currently models logical document identities with `fa`, `en`, and `ar` renditions.
- Legacy Mintlify `ar/` paths can contain Persian RTL compatibility content and are **not evidence of a genuine Arabic translation**.
- Material changes remain branch + PR only; legal text/status/authority must not be inferred or rewritten by recovery work.

### 2.2 Historical runtime recovery source

The supplied pre-auto-deploy backup contained the complete EarthCoop Knowledge Center 0.8 runtime/source, including UI modules, document reader, mobile navigation, theme, search, route/render modules, PDFs, static HTML pages, SEO assets, and the deployable package.

The recovery pipeline pins the historical package identity with SHA-256:

`e1c5938f381db7b7f0efeef527dd828c96e13adc9de5a913de624796c6ae0704`

Important recovered paths/evidence include:

- `index.html`, `app.js`, `styles.css`
- `src/ui/router.js`
- `src/ui/search-dialog.js`
- `src/ui/mobile-navigation.js`
- `src/ui/document-reader-controls.js`
- `src/pages/document-reader.js`
- `src/data/search-index.js`
- `src/content/document-packages/...`
- `src/content/seo-routes.js`
- `src/render/seo-head.js`
- `src/render/structured-data.js`
- `src/render/static-page.js`
- `sitemap.xml`
- `robots.txt`
- static routes such as `documents/*/index.html`, `guides/*/index.html`, `status/`, `map/`, `glossary/`
- PDF artifacts for the ten foundational documents

### 2.3 Repository history after 0.8

Relevant repository evidence includes:

- `a7599bdb...` — governed knowledge-center content pipeline.
- `176b6697...` — current foundational document packages.
- `f9d4d2f2...` — `ECON-REF-01` Persian draft 0.1 added and registered.
- `34a69302...` — `ECON-REF-01` exposed in Persian navigation.
- `0d62c704...` — multilingual registry v2, evidence-backed English product-guide truth alignment, terminology/freshness validation.
- `6facb3a3...` — independent Docs Center preview auto-deploy infrastructure.
- `3ea5cfc2...` — recovered 0.8 runtime connected to current governed foundational content.
- `7945768f...` — preview-safe `.htaccess`, validator hardening, hidden-file rollback protection.

The main EarthCoop application also contains a `DocsCenterLinkContractTest` that expects the self-hosted Docs Center, all ten foundational documents, `ECON-REF-01`, publication policy, and canonical links from footer/welcome/authenticated navigation.

## 3. Recovery Gap Matrix

| Capability / work item | Evidence found | Current preview state | Classification | Required recovery action | Priority |
| --- | --- | --- | --- | --- | --- |
| Historical 0.8 UI/UX | Complete recovered runtime and source | Live on preview | **Recovered / connected** | Preserve visual/runtime baseline; no redesign without separate approval | P0 guardrail |
| Ten foundational documents | `docs-manifest.json`, `buildCurrentFoundational()`, current releases | Generated into 0.8 reader from current governed consolidated sources | **Recovered / connected** | Keep deterministic generation and exact status/version metadata | P0 guardrail |
| Foundational version/status display | 0.8 reader + current manifest metadata | Visible in preview | **Recovered / connected** | Preserve exact legal/editorial semantics | P0 guardrail |
| TOC / stable article anchors | 0.8 document reader + adapter | Visible for current foundational packages | **Recovered / connected** | Extend same contract to future reference documents where provisions exist | P1 |
| Copy link / print / document history controls | 0.8 baseline | Visible in preview | **Recovered** | Regression-test behavior after data-model expansion | P1 |
| PDF downloads for ten foundational documents | Recovered PDF artifacts and controls | Present for baseline documents | **Recovered** | Verify each PDF version/status against current package; define reference-document PDF policy | P1 |
| Full-text search engine | 0.8 search modules; previous requirement that body text be searchable | Runtime search exists, but current governed ingestion is mainly foundational | **Partially connected** | Build one generated search corpus for foundational + reference + approved guide content; preserve locale/anchor | P0 |
| `ECON-REF-01` | Manifest entry `contentClass: reference`, official draft 0.1; commits `f9d4d2f2`, `34a69302`; EarthCoop link contract expects it | Not visible in recovered preview | **Present, not connected** | Generalize ingestion from `foundational_document` to supported governed content classes and add Reference navigation/route/search | P0 |
| Generic Reference document class | Registry/manifest model supports `reference` | Adapter currently filters it out | **Present, not connected** | Add explicit reference package/renderer/navigation contract rather than special-casing only ECON-REF-01 | P0 |
| Multilingual registry v2 | `docs-manifest.json` schema v2; commit `0d62c704` | Runtime currently advertises `displayLocales: ['fa']` only | **Present, not connected** | Add locale-aware runtime model driven by registered renditions; never infer availability from files alone | P0 |
| Persian (`fa`) | Canonical language for foundational content | Live | **Recovered / connected** | Preserve RTL and canonical role | P0 guardrail |
| English (`en`) foundational translations | Manifest mostly `not_translated` | Not shown | **Correctly unavailable** | Show only genuine registered English renditions when they exist; no fabricated fallback as translation | P1 |
| English product guides | Commit `0d62c704` says evidence-backed English product guide truth alignment | Repository work exists but recovered runtime does not map it | **Present, not connected** | Inventory review-approved English guides, map to 0.8 route/navigation/search model, retain freshness metadata | P1 |
| Genuine Arabic (`ar`) | No verified Arabic corpus found | Not shown | **Not implemented** | Keep unavailable until genuine audited Arabic renditions are added | P2 |
| Legacy Mintlify `ar/` Persian mirror | Commits `ed26b9d9`, `a168031d`; repository instructions | Must not be exposed as Arabic | **Compatibility legacy only** | Add permanent regression rule: `ar/` path alone never creates an Arabic rendition | P0 guardrail |
| Persian guide pages from 0.8 | Recovered `guides/*` pages | Visible, but snapshot age/product truth may differ from current system | **Recovered but stale/under audit** | Audit each guide against current EarthCoop behavior; regenerate/update only from verified current facts | P0/P1 |
| Status / feature-truth page | Recovered `/status/` | Historical evidence snapshot | **Recovered but stale** | Generate status evidence from explicit repository/application evidence instead of freezing old claims | P1 |
| System map | Recovered `/map/` | Historical map page exists | **Recovered but needs audit** | Compare with current platform modules/nav and regenerate metadata/routes if needed | P1 |
| Glossary | Recovered `/glossary/` | Historical glossary exists | **Recovered but needs audit** | Reconcile with current governed terminology and terminology validator | P1 |
| SEO static pages | Recovered static pages and renderers | Foundational document pages are re-rendered; other recovered pages may retain old production-oriented metadata | **Partially recovered** | Generate all static pages from a single current route/content registry and target origin | P0 |
| Canonical tags / OpenGraph / Twitter metadata | 0.8 SEO renderer | Present historically; not uniformly regenerated today | **Partially recovered** | Regenerate per route with current title/description/status and environment origin | P0 |
| JSON-LD / structured data | `structured-data.js`, historical `WebSite`, `Organization`, `WebPage`, `Article`, `BreadcrumbList` | Found in 0.8 baseline; current coverage not fully regenerated | **Partially recovered** | Regenerate deterministically from current route/content model | P0 |
| `sitemap.xml` | Recovered 0.8 artifact | May contain historical/production routes and origin | **Recovered but stale** | Generate from current indexable route registry; preview should not become production-indexable by accident | P0 |
| `robots.txt` | Recovered 0.8 artifact | May reflect historical production policy | **Recovered but stale** | Generate environment-aware robots policy; preview non-production indexing policy explicit | P0 |
| `hreflang` | Multilingual requirement implies locale-aware SEO; no complete recovered evidence confirmed | Not active | **Gap** | Add only when genuine alternate renditions exist; never emit `ar` for legacy Persian mirror | P1 |
| Main EarthCoop docs links | `DocsCenterLinkContractTest.php`, `config/docs-links.php` contract | Main app expects production self-hosted routes including ECON-REF-01 | **Implemented in main app, cross-repo dependency** | Before cutover, align final route IDs/aliases and rerun main-app link contract | P0 cutover |
| Publication policy / source-of-truth distinction | 0.8/publication-policy link, registry model | Some UI exists; recovered route behavior needs verification | **Partially recovered** | Ensure runtime explains baseline vs registered/not-effective vs translation status without collapsing semantics | P0 |
| Search only current/public vs reviewable content policy | Manifest can include review candidates that are not public/effective | Current recovered search ingestion policy is not fully generalized | **Gap** | Define visibility policy per content class/status before adding references/guides to search | P0 |
| Per-clause feedback/comments | Prior project decision: feedback per clause with review queue | No complete runtime/repository implementation evidence found | **Decision recorded, not implemented** | Design separate authenticated feedback flow/API and moderation queue; do not pretend static 0.8 already supports it | P2 |
| Copy/print controls historical bug fixes | Prior project notes say copy/print initially did not work | Current controls visible; functionality needs UAT | **Recovered, needs UAT** | Add targeted browser/UAT contract before production cutover | P1 |
| Mobile navigation | 0.8 module recovered | UI baseline exists | **Recovered** | UAT responsive behavior after reference/multilingual nav expansion | P1 |
| Auto-deploy preview | PRs #13–#15, strict FTPS, validator, artifact, live SHA smoke | Live and green | **Recovered / completed** | Preserve; do not mix content recovery with deployment redesign | P0 guardrail |
| Production cutover | Prior spec explicitly keeps production unchanged pending UAT | Not performed by this recovery program | **Intentionally pending** | Only after gap closure + UAT + explicit approval | Final gate |

## 4. What must not be re-done

The following work already exists and must be reused rather than recreated:

- the recovered 0.8 visual/runtime baseline;
- governed foundational consolidation (`buildCurrentFoundational()` and release evidence);
- registry/manifest version-status semantics;
- multilingual registry v2 and translation freshness concepts;
- evidence-backed English product-guide review work already present in the repository;
- `ECON-REF-01` source, manifest registration, and historical navigation decision;
- 0.8 SEO renderer/static-route infrastructure;
- strict preview auto-deploy, rollback artifact, recovered validator, and live source-SHA smoke check;
- main EarthCoop canonical docs-link configuration/tests.

## 5. Explicit non-evidence / unknowns

The audit did **not** find sufficient evidence to claim these are already implemented:

- genuine Arabic documentation;
- complete English foundational translations;
- an operational per-provision feedback/comment moderation queue;
- a current generated Persian product-guide corpus aligned with all recent EarthCoop behavior;
- complete locale-aware `hreflang` output;
- production cutover readiness.

These remain gaps, not lost completed features.

## 6. Recovery order

Recovery work should proceed in dependency order:

**R1 — Governed content coverage:** Reference class + ECON-REF-01 + visibility rules.  
**R2 — Locale model:** real `fa/en/ar` availability driven only by registered renditions; English mapped where genuinely reviewed; Arabic unavailable until real.  
**R3 — Search/navigation:** regenerate route/navigation/search indexes across all eligible classes/locales.  
**R4 — SEO regeneration:** route registry → static pages, canonical, OG/Twitter, JSON-LD, sitemap, robots, and later hreflang.  
**R5 — Guide/status/map/glossary truth audit:** preserve 0.8 UX while replacing stale claims with verified current evidence.  
**R6 — Functional UAT:** copy, print, PDF, history, search, deep links, mobile, direct refresh/404.  
**R7 — Cross-repo cutover gate:** verify EarthCoop `docs-links` contracts and production-domain plan.  
**R8 — Deferred interactive features:** clause feedback/comments and moderation workflow as a separately designed subsystem.

## 7. Preview indexing policy

Until explicit production cutover approval, `docs-preview.earthcoop.ir` is a UAT environment. SEO infrastructure must be testable there, but preview should not accidentally compete with or replace the production documentation domain in search indexes. The build must make the preview indexing policy explicit and environment-specific while still allowing verification of canonical/structured-data generation.

## 8. Definition of recovery complete

Recovery is complete only when:

1. the 0.8 UI/UX baseline remains recognizably intact;
2. all intended governed content classes, including `ECON-REF-01`, are discoverable under explicit visibility rules;
3. locale switching reflects only genuine registered renditions;
4. full-text search covers the eligible governed corpus and anchors correctly;
5. SEO assets are deterministically generated from the same current route/content registry;
6. guide/status/map/glossary claims are either verified-current or clearly marked as not current;
7. copy/print/PDF/history/mobile/deep-link behavior passes UAT;
8. preview remains non-production until explicit cutover approval;
9. main EarthCoop canonical links are compatible with the final route model;
10. no recovery task changes legal text, legal effect, registered release history, or public baseline implicitly.
