# EarthCoop Docs Center Recovery Gap Matrix

**Original audit date:** 2026-09-30  
**Operational sync:** 2026-10-01, after official-v1 registration and recovery integration  
**Status:** Current recovery/cutover matrix  
**Target repository:** `saeidshojae/EarthCoop-docs`  
**Current preview runtime:** recovered EarthCoop Knowledge Center `0.8.0` on `docs-preview.earthcoop.ir`  
**Production target:** `docs.earthcoop.ir` only after explicit live UAT and cutover approval

## 1. Purpose

This document now records the **current** recovery state after the 2026-10-01 official-v1 release and the subsequent recovered-runtime integration work. It supersedes the pre-integration interpretation of this matrix while preserving the original recovery principles: do not redesign the recovered 0.8 center unnecessarily, do not infer legal effect from publication state, and do not redo capabilities that already exist in the repository/runtime.

The remaining program is intentionally narrower:

1. verify official-v1 on the live preview;
2. reconcile stale editorial surfaces (`guides`, `status`, `map`, `glossary`);
3. connect already-reviewed English guides without re-translating them;
4. verify cross-repository links and perform a separately approved production cutover;
5. design interactive clause feedback and later language expansion as separate work.

## 2. Current governed baseline

### 2.1 Official-v1 foundational release

`releases/foundational/2026-10-01/document-registry.registered.json` is the registered release evidence for the ten foundational documents. `FC`, `CH`, `CO`, `EX`, `ECON`, `DG`, `JUD`, `LOC`, `ETH`, and `STD` are all:

- version `1.0`;
- epoch `official-v1`;
- status `effective`;
- registered/effective on `2026-10-01`.

Any pre-v1 version number or prior `registered/non-effective` expectation is historical evidence only and must not be used as the current Preview UAT expectation.

### 2.2 ECON-REF-01 official-v1 reference release

`releases/foundational/2026-10-01/reference-registry.registered.json` records `ECON-REF-01` as:

- version `1.0`;
- epoch `official-v1`;
- status `registered-reference`;
- `independentLegalEffect: false`.

`docs-manifest.json` maps the same current rendition as `documentId: ECON-REF-01`, content class `reference`, version `1.0`, slug `reference/economy/econ-ref-01`. The ingestion-level `official_draft` metadata must not be confused with legal effectiveness, and the reference must never be represented as effective legislation merely because it is registered/current.

The old identifier `econ-ref-01-fa-0-1` is not the current official-v1 document identity and must not remain a required UAT/cutover contract.

### 2.3 Language truth

- Persian (`fa`) is the current display locale of the recovered runtime.
- Reviewed English product/API guides exist in repository evidence but are not yet fully connected to the recovered runtime.
- Full English translations of the foundational corpus are not yet available.
- Genuine Arabic documentation is not yet available.
- Legacy Mintlify `ar/` paths containing Persian RTL compatibility material are not Arabic renditions and must never create Arabic availability/SEO claims.

## 3. Current Recovery Gap Matrix

| Capability / work item | Current state after official-v1 integration | Classification | Remaining action | Priority |
| --- | --- | --- | --- | --- |
| Historical 0.8 UI/UX | Recovered and retained as the runtime baseline | **Complete / guardrail** | Preserve; no redesign without separate approval | P0 guardrail |
| Ten foundational documents | Current governed sources are official-v1 `1.0 / effective` | **Connected; live UAT pending** | Verify all ten on Preview, including status/version, deep links, anchors and controls | P0 |
| Foundational version/status semantics | Registry + manifest now carry official-v1 truth | **Connected; UAT pending** | Confirm reader never falls back to pre-v1/non-effective labels | P0 |
| Generic Reference content class | Runtime recovery work now supports governed reference ingestion rather than foundational-only filtering | **Implemented; UAT pending** | Verify navigation, direct/static route, breadcrumb, search and SEO on Preview | P0 |
| `ECON-REF-01` | Current repository rendition is 1.0 and part of recovered content generation | **Implemented; UAT pending** | Verify current route/alias, version 1.0, reference classification and non-legislative semantics | P0 |
| TOC / stable anchors | Recovered reader behavior retained and extended through generated content | **Implemented; UAT pending** | Live anchor/deep-link verification for foundational + ECON-REF-01 | P1 |
| Copy / permalink / print / history | Recovered controls retained | **Implemented; UAT pending** | Functional live UAT | P1 |
| PDF downloads | Baseline foundational PDF support retained | **Implemented; policy/UAT pending** | Verify current availability/version behavior and reference-document policy | P1 |
| Full-text search | Recovered search generation now covers governed body content, including reference integration work | **Implemented; UAT pending** | Verify body-text queries and stable result anchors on Preview | P0 |
| Search visibility policy | Governed content/search generation exists | **Implemented with policy guardrails** | During UAT confirm no stale/false-language material is promoted as current | P0 |
| Persian (`fa`) | Live display locale | **Complete / guardrail** | Preserve RTL and canonical role | P0 guardrail |
| English product/API guides | 31 reviewed guides preserved in repository evidence | **Present, not runtime-mapped** | Route + navigation + search + locale integration only; do not retranslate | P1 |
| English foundational translations | Mostly unavailable/not translated | **Intentionally unavailable** | Separate future translation/review project | P2 |
| Genuine Arabic | No audited corpus | **Not implemented** | Future translation/review project; keep unavailable until genuine | P2 |
| Legacy `ar/` Persian mirror | Compatibility/history only | **Guardrail** | Never treat path presence as Arabic availability | P0 guardrail |
| Persian 0.8 guide pages | Visible historical snapshot; product truth may be stale | **Recovered, needs editorial audit** | Audit against current EarthCoop behavior and update from verified facts | P0/P1 |
| `/status/` | Historical/recovered surface | **Needs review** | Reconcile with current repository/application evidence | P1 |
| `/map/` | Historical/recovered surface | **Needs review** | Reconcile module/system map with current platform | P1 |
| `/glossary/` | Historical/recovered surface | **Needs review** | Reconcile with governed terminology and current canonical names | P1 |
| Static SEO generation | Recovery work regenerates preview-safe static/SEO output from current content | **Implemented; live UAT pending** | Verify canonical, sitemap, robots, structured routes and no production-origin leak | P0 |
| Preview robots/noindex | Environment-specific preview safety is part of recovered build/deploy contract | **Implemented; live UAT pending** | Verify `robots.txt`, `X-Robots-Tag`, page noindex | P0 |
| `hreflang` | Must reflect only genuine alternate renditions | **Guarded / future expansion** | Do not emit Arabic now; expand with genuine locales later | P1/P2 |
| Auto-deploy Preview | Strict FTPS, artifact/rollback and live SHA/runtime smoke are already established | **Complete / guardrail** | Preserve; do not redesign deployment during content cleanup | P0 guardrail |
| Main EarthCoop docs links | Cross-repo contract exists | **Cutover dependency** | Re-check final official-v1/reference route contract before Production | P0 cutover |
| Production cutover | Not performed | **Intentionally pending** | Separate reviewed plan after live UAT + editorial truth cleanup | Final gate |
| Per-clause feedback/comments | No complete authenticated moderation subsystem evidenced | **Decision recorded, not implemented** | Separate subsystem design after/beside cutover; not a blocker for Persian launch | P2 |

## 4. Work already completed — do not repeat

The following are no longer recovery gaps and must be reused rather than recreated:

- recovered 0.8 visual/runtime baseline;
- governed foundational consolidation and official-v1 release evidence;
- exact version/status/authority semantics in registry/manifest data;
- generic recovered governed-content integration needed to expose reference content;
- `ECON-REF-01` current 1.0 source/registration and recovered-runtime integration work;
- generated full-text search support for governed document body content;
- preview-safe SEO/static generation and environment-specific indexing protections;
- locale-truth guardrails preventing legacy `ar/` mirrors from becoming false Arabic renditions;
- strict Preview auto-deploy, rollback artifact, recovered validator and live source-SHA/runtime smoke check;
- repository evidence for the already-reviewed English product/API guides;
- the main EarthCoop canonical docs-link test/configuration work already present in the application repository.

No future task should reopen these items merely because the original 2026-09-30 matrix classified them as missing before later PRs landed.

## 5. Remaining editorial truth work

The major unresolved content risk is no longer the foundational law corpus. It is the explanatory/product documentation around it.

### 5.1 Persian 0.8 guides

Treat the recovered Persian guides as an **under-audit historical snapshot** until each guide is checked against current EarthCoop behavior. Do not bulk relabel them as current merely because they render successfully.

### 5.2 Status / Map / Glossary

`/status/`, `/map/`, and `/glossary/` remain explicitly `needs_review`. They must be checked against current repository/application truth and canonical terminology before Production cutover.

### 5.3 English guides

The 31 previously reviewed English product/API guides must be **connected**, not translated again. The remaining work is route, navigation, search and locale integration while preserving review/freshness metadata.

## 6. Current dependency order

The old R1–R8 sequence described the pre-integration state and is no longer the execution plan. The current order is:

**C1 — Operational docs sync:** align UAT/runbook/matrix with official-v1.  
**C2 — Live Preview UAT:** verify official-v1 documents, ECON-REF-01, search, SEO safety, controls, deep links, mobile and 404.  
**C3 — Editorial truth cleanup:** Persian guides + `/status/` + `/map/` + `/glossary/`.  
**C4 — English guide runtime integration:** route + navigation + search + locale; no retranslation.  
**C5 — Cross-repo cutover gate:** verify EarthCoop application link contracts against the final route model.  
**C6 — Production cutover:** separate reviewed plan and explicit approval for `docs.earthcoop.ir`.  
**C7 — Deferred interactive/language work:** clause feedback/moderation, foundational English translation and genuine Arabic as separate projects.

## 7. Preview indexing policy

Until explicit production cutover approval, `docs-preview.earthcoop.ir` remains a UAT environment. Preview must remain non-indexable even while canonical/static/structured SEO generation is tested. Preview SEO output must use the preview origin and must not leak a production canonical contract before cutover.

## 8. Definition of Preview readiness

Preview is ready for the production-cutover planning stage only when:

1. all ten foundational documents visibly match the official-v1 registered release (`1.0 / effective`);
2. `ECON-REF-01` is version `1.0`, discoverable/searchable as a reference, and is not represented as independently effective legislation;
3. full-text search, TOC/anchors, copy/print/history/available-PDF controls, deep links/direct refresh, mobile navigation and 404 pass live UAT;
4. preview robots/noindex/canonical behavior is verified live;
5. Persian/English/Arabic availability claims match reality;
6. guides/status/map/glossary are either reconciled to current truth or remain visibly/operationally marked as under audit rather than silently current;
7. final cross-repository link contracts are compatible;
8. no production-domain change has been made as part of recovery/UAT;
9. production cutover has its own plan and explicit approval;
10. no recovery/editing task changes legal text, legal effect or registered release history implicitly.
