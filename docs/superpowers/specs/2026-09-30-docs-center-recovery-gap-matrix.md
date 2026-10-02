# EarthCoop Docs Center Recovery Gap Matrix

**Original audit date:** 2026-09-30  
**Operational sync:** 2026-10-02, after official-v1 registration, recovered-runtime integration, Persian editorial truth cleanup, economy/role guidance, and reference-page audit  
**Status:** Current recovery/cutover matrix  
**Target repository:** `saeidshojae/EarthCoop-docs`  
**Current preview runtime:** recovered EarthCoop Knowledge Center `0.8.0` on `docs-preview.earthcoop.ir`  
**Production target:** `docs.earthcoop.ir` only after explicit live UAT and cutover approval

## 1. Purpose

This document records the **current** recovery state after the official-v1 release and the subsequent recovered-runtime/editorial work. It supersedes the pre-integration interpretation of the original matrix while preserving the recovery principles: do not redesign the recovered 0.8 center unnecessarily, do not infer legal effect from publication state, do not redo capabilities already completed, and do not change Production as part of Preview work.

The remaining program is now narrower:

1. complete the remaining live Preview UAT evidence;
2. re-review the 31 English product/API guides against the current EarthCoop repository and connect the reviewed set to the recovered runtime;
3. verify final cross-repository links;
4. prepare and separately approve Production cutover;
5. treat foundational English translation, genuine Arabic, and interactive clause feedback as later projects.

## 2. Current governed baseline

### 2.1 Official-v1 foundational release

`releases/foundational/2026-10-01/document-registry.registered.json` is the registered release evidence for the ten foundational documents. `FC`, `CH`, `CO`, `EX`, `ECON`, `DG`, `JUD`, `LOC`, `ETH`, and `STD` are all version `1.0`, epoch `official-v1`, status `effective`, registered/effective on `2026-10-01`.

Any pre-v1 version number or prior `registered/non-effective` expectation is historical evidence only and must not be used as the current Preview UAT expectation.

### 2.2 ECON-REF-01 official-v1 reference release

`releases/foundational/2026-10-01/reference-registry.registered.json` records `ECON-REF-01` as version `1.0`, epoch `official-v1`, status `registered-reference`, with `independentLegalEffect: false`.

`docs-manifest.json` maps the same current rendition as `documentId: ECON-REF-01`, content class `reference`, version `1.0`, slug `reference/economy/econ-ref-01`. Ingestion metadata must not be confused with legal effectiveness, and the reference must never be represented as effective legislation merely because it is registered/current.

### 2.3 Language truth

- Persian (`fa`) is the current live display locale of the recovered runtime at this checkpoint.
- Thirty-one English product/API guides exist as reviewed English source pages. Their 2026-09-28 audit is being revalidated against the current EarthCoop `main` before runtime mapping because the application repository has materially advanced since that audit.
- Full English translations of the foundational corpus are not yet available.
- Genuine Arabic documentation is not yet available.
- Legacy Mintlify `ar/` paths containing Persian RTL compatibility material are not Arabic renditions and must never create Arabic availability/SEO claims.

## 3. Current Recovery Gap Matrix

| Capability / work item | Current state | Classification | Remaining action | Priority |
| --- | --- | --- | --- | --- |
| Historical 0.8 UI/UX | Recovered and retained as runtime baseline | **Complete / guardrail** | Preserve; no redesign without separate approval | P0 guardrail |
| Ten foundational documents | official-v1 `1.0 / effective` connected | **Implemented; live UAT evidence remains** | Finish exact Preview checks for visible metadata, routes, anchors and controls | P0 |
| Foundational display order / reader presentation | Corrected and regression-covered | **Complete; UAT guardrail** | Preserve conceptual reading order without treating card order as legal rank | P0 guardrail |
| Generic Reference content class | Governed reference ingestion connected | **Implemented; live UAT evidence remains** | Finish direct-route/search/SEO checks | P0 |
| `ECON-REF-01` | v1.0 integrated as non-legislative reference | **Implemented; live UAT evidence remains** | Verify visible reference semantics and route on Preview | P0 |
| TOC / stable anchors | Reader behavior retained and polished | **Implemented; UAT guardrail** | Final live spot-check | P1 |
| Copy / permalink / print / history | Recovered capabilities preserved and regression-guarded | **Implemented; UAT guardrail** | Final live spot-check | P1 |
| PDF downloads / branding / official identity | Foundational PDFs preserved; branding/version presentation corrected | **Complete; UAT guardrail** | Final live spot-check; do not invent reference PDF | P1 |
| Full-text search | Governed document body search implemented | **Implemented; UAT guardrail** | Re-test after English guide search integration | P0 |
| Persian learning-path guides | Eight recovered guide routes replaced with audited current content and stable continuation navigation | **Complete / current** | Maintain through evidence-based re-audit when product facts change | P0 guardrail |
| Economy/Bahar guide | Current guide and member story integrated with stable runtime route | **Complete / current** | Preserve in guide navigation/search | P1 guardrail |
| Role-based guides | Dedicated member/manager/inspector guidance added and runtime-integrated | **Complete / current** | Preserve route/navigation/search behavior | P1 guardrail |
| `/status/` | Reconciled against current EarthCoop evidence | **Audited current** | Re-audit only when capability truth materially changes | P1 guardrail |
| `/map/` | Reconciled with current platform/ecosystem architecture | **Audited current** | Re-audit only when architecture materially changes | P1 guardrail |
| `/glossary/` | Reconciled with canonical terminology and official-v1 boundaries | **Audited current** | Keep terminology validation green | P1 guardrail |
| Persian (`fa`) | Current live display locale | **Complete / guardrail** | Preserve RTL and canonical role | P0 guardrail |
| English product/API guides | 31 English source pages; 2026-09-28 truth audit exists | **Re-review active; not runtime-mapped yet** | Revalidate all 31 against current EarthCoop `main`, refresh audit evidence, then integrate routes/navigation/search/locale | P0/P1 active |
| English foundational translations | Mostly unavailable/not translated | **Intentionally unavailable** | Separate translation/review project | P2 |
| Genuine Arabic | No audited corpus | **Not implemented** | Future translation/review project | P2 |
| Legacy `ar/` Persian mirror | Compatibility/history only | **Guardrail** | Never treat as Arabic availability | P0 guardrail |
| Static SEO generation | Preview-safe static/SEO output regenerated from current content | **Implemented; extension needed for EN guides** | Add reviewed EN routes without Production canonical leakage | P0/P1 active |
| Preview robots/noindex | Environment-specific Preview safety established | **Complete / guardrail** | Keep unconditional noindex/nofollow through EN work | P0 guardrail |
| `hreflang` | Only genuine alternate renditions allowed | **Guarded** | Do not emit Arabic; do not imply EN foundational renditions from EN product guides | P0/P1 guardrail |
| Auto-deploy Preview | Strict FTPS, artifact/rollback and source-SHA smoke established | **Complete / guardrail** | Preserve | P0 guardrail |
| Main EarthCoop docs links | Cross-repo contract exists | **Cutover dependency** | Re-check after final route model | P0 cutover |
| Production cutover | Not performed | **Intentionally pending** | Separate reviewed plan after UAT | Final gate |
| Per-clause feedback/comments | Authenticated moderation subsystem not implemented | **Deferred** | Separate subsystem after/beside cutover | P2 |

## 4. Work already completed — do not repeat

The following are closed recovery/editorial tasks and must be reused rather than reopened:

- recovered 0.8 visual/runtime baseline;
- governed foundational consolidation and official-v1 release evidence;
- exact version/status/authority semantics in registry/manifest data;
- generic governed reference integration and `ECON-REF-01` v1.0 runtime exposure;
- recovered document-reader capability preservation: TOC, anchors, copy, permalink, print, history and foundational PDF controls;
- PDF official-v1 identity/branding fixes and Markdown-preamble cleanup;
- generated full-text governed-document search;
- preview-safe SEO/static generation, noindex protections and locale-truth guardrails;
- audited current Persian learning-path guide replacement plus stable direct/SPA continuation routing;
- Bahar/economy explanatory guide and member story;
- audited `/status/`, `/map/`, `/glossary/` reference pages;
- dedicated role-based guidance routes;
- strict Preview auto-deploy, rollback artifact, recovered validator and live source-SHA/runtime smoke infrastructure;
- repository evidence for the 31 English product/API source guides;
- main EarthCoop canonical docs-link tests/configuration already present in the application repository.

No future task should reopen these merely because an older audit or implementation plan still contains unchecked historical boxes.

## 5. Active editorial/runtime work — English product guides

The active content task is the 31 English product/API guides. The 2026-09-28 audit remains historical evidence, not a permanent currentness guarantee. Its application evidence baseline was `saeidshojae/EarthCoop@38ef89def3077f4280c7dd704f4c2b055ac95931`; current EarthCoop `main` must be rechecked before runtime publication.

The re-review must preserve the audit precedence already established: current runtime/UI/routes and merged code first; current tests/services second; approved implementation specifications/status third; normative documents fourth; existing guide copy last. A guide never proves its own claim.

After revalidation, the reviewed English set may be integrated into the recovered runtime with:

- explicit English product-guide routes and LTR rendering;
- navigation that makes clear these are English product guides, not English renditions of the foundational corpus;
- full-text search records tagged as English guides;
- Preview-safe SEO/static routes;
- locale metadata that exposes English guide availability without claiming unavailable English foundational translations;
- no Arabic availability or `hreflang` claim.

## 6. Current dependency order

**C1 — Operational docs sync:** **complete/current through 2026-10-02**; this matrix now reflects the landed Persian/reference work.  
**C2 — Live Preview UAT:** **still open as a final evidence gate**; do not confuse automated/implementation completion with visual live UAT.  
**C3 — Editorial truth cleanup:** **complete for Persian guides + `/status/` + `/map/` + `/glossary/`**, with economy and role guides also added.  
**C4 — English guide revalidation + runtime integration:** **active now**; re-review all 31 against current EarthCoop, then route + navigation + search + locale/SEO integration; no retranslation.  
**C5 — Cross-repo cutover gate:** pending after final Preview route model.  
**C6 — Production cutover:** pending separate reviewed plan and explicit approval.  
**C7 — Deferred work:** clause feedback/moderation, foundational English translation and genuine Arabic.

## 7. Preview indexing policy

Until explicit Production cutover approval, `docs-preview.earthcoop.ir` remains a UAT environment. Preview must remain non-indexable even while English routes, search, canonical/static/structured SEO output and locale metadata are tested. No English integration task may switch the Production domain, enable Preview indexing, or emit unsupported Arabic alternates.

## 8. Definition of Preview readiness for cutover planning

Preview is ready for Production-cutover planning only when:

1. all ten foundational documents visibly match official-v1 (`1.0 / effective`);
2. `ECON-REF-01` is visibly version `1.0`, discoverable as a reference and not represented as independently effective legislation;
3. search, TOC/anchors, copy/print/history/available-PDF controls, direct refresh, mobile navigation and 404 pass final live UAT;
4. Preview robots/noindex/canonical behavior is verified live;
5. Persian/English/Arabic availability claims match reality;
6. Persian guides/status/map/glossary remain current under their audited contracts;
7. the 31 English product/API guides are either successfully revalidated and runtime-mapped or explicitly excluded from the cutover scope without a false availability claim;
8. cross-repository link contracts remain compatible;
9. no Production-domain change has been made as part of Preview work;
10. Production cutover has its own reviewed plan and explicit approval;
11. no recovery/editorial task changes legal text, legal effect or registered release history implicitly.
