# EarthCoop Docs Center recovery — preview UAT checklist

**Scope:** `https://docs-preview.earthcoop.ir` only.  
**Operational baseline:** official-v1 release registered on 2026-10-01; editorial/runtime sync current through 2026-10-02.  
**Production cutover:** out of scope until this checklist is completed and explicitly approved.

This checklist records **live evidence still required**. A capability marked complete in implementation/audit documents is not automatically a live visual PASS.

## 1. Baseline identity and deployment

- [ ] `deployment-manifest.json` is reachable from the preview host and returns JSON, not HTML/redirect content.
- [ ] `sourceSha` equals the deployed `main` commit.
- [ ] `runtimeBaseline` is `earthcoop-knowledge-center-0.8.0`.
- [ ] `runtimeArchiveSha256` matches the pinned 0.8 recovery archive.
- [ ] `canonicalOrigin` is exactly `https://docs-preview.earthcoop.ir`.
- [ ] `previewIndexing` is `disabled`.
- [ ] After English-guide integration, `displayLocales` is exactly `['fa','en']`, `documentLocales` remains `['fa']`, and `guideLocales` is `['en']`.

## 2. Recovered UI/UX baseline

- [ ] Home, navigation, sidebar, typography, theme control, responsive/mobile navigation and document-reader layout visibly match the recovered 0.8 baseline rather than the discarded replacement shell.
- [ ] `/guides/start/`, `/documents/`, `/map/`, `/glossary/`, and `/status/` load without a server error.
- [ ] Mobile navigation opens/closes correctly and does not obscure the reader.
- [ ] Missing routes render the recovered 404 experience.

## 3. Foundational documents — official-v1

For `FC`, `CH`, `CO`, `EX`, `ECON`, `DG`, `JUD`, `LOC`, `ETH`, and `STD`:

- [ ] The EarthCoop application hash deep link `/#/documents/{lowercase-id}` resolves.
- [ ] The direct static page `/documents/{lowercase-id}/` resolves on refresh.
- [ ] Title and code match the governed repository metadata.
- [ ] Version is exactly `1.0`.
- [ ] Legal status is exactly `effective` and is not shown as draft, merely registered, or non-effective.
- [ ] The release is identified consistently with the `official-v1` epoch where that context is exposed.
- [ ] Authority/status shown by the reader is consistent with the 2026-10-01 registered release evidence.
- [ ] TOC anchors navigate to the correct provision.
- [ ] Copy-document-link, provision permalink/copy, print, available PDF download, and version-history controls behave correctly.

Repository source of truth for this checkpoint is `releases/foundational/2026-10-01/document-registry.registered.json`; display metadata must not regress to pre-v1 versions or pre-registration status.

## 4. ECON-REF-01 reference document — official-v1

- [ ] The current reference route resolves from the runtime document contract and does not depend on the obsolete `econ-ref-01-fa-0-1` identifier.
- [ ] Its direct static document page resolves and survives refresh.
- [ ] It is discoverable in the documents/reference collection rather than hidden in generated data.
- [ ] Its displayed version is exactly `1.0`.
- [ ] The UI identifies it as a reference document and does not imply independent legislative/legal effect.
- [ ] Repository semantics remain consistent: registered reference evidence is authoritative for registration, while `docs-manifest.json` publication metadata may still label the knowledge-center rendition `official_draft`; neither may be collapsed into `effective` law.
- [ ] The breadcrumb says **اسناد مرجع**, not **اسناد بنیادین**.
- [ ] Its sections/anchors are navigable and searchable.

Repository source of truth for registration is `releases/foundational/2026-10-01/reference-registry.registered.json`; the current ingestion entry is `documentId: ECON-REF-01`, version `1.0`, slug `reference/economy/econ-ref-01`.

## 5. Language truth

- [ ] Persian foundational/reference and Persian guide content renders with `fa`/RTL semantics.
- [ ] The 31 audited English **product/API guides** render with `en`/LTR semantics under the explicit `/en/` namespace after their integration PR is deployed.
- [ ] English product-guide availability is not presented as an English translation of the foundational legal corpus.
- [ ] The UI does not advertise legacy Mintlify `ar/` mirrors as Arabic.
- [ ] The UI does not claim genuine Arabic documentation exists.
- [ ] No unavailable translation silently masquerades as Persian/English/Arabic.
- [ ] `recovered-locales.json` and `deployment-manifest.json` agree on site display locales while keeping document locales distinct from guide locales.

## 6. Full-text search

- [ ] Search finds body text from at least one official-v1 foundational article, not only a title/summary.
- [ ] Search finds a phrase from the current `ECON-REF-01` 1.0 body content.
- [ ] Search finds body text from at least one audited English product guide and identifies/opens it as an English guide.
- [ ] A governed-document result opens the correct document and stable section anchor.
- [ ] An English-guide result opens the correct `/en/.../` route.
- [ ] Search results preserve document status/version context where the UI exposes it.
- [ ] No false Arabic result is generated from a legacy `ar/` Persian mirror.

## 7. Preview SEO safety and static SEO output

- [ ] `robots.txt` disallows crawling of the preview site.
- [ ] Response headers include unconditional `X-Robots-Tag: noindex, nofollow` for preview content.
- [ ] `sitemap.xml` and `recovered-seo-routes.json` contain preview-host URLs only; there is no canonical leak to `docs.earthcoop.ir`.
- [ ] Direct document HTML contains a preview-host canonical URL.
- [ ] Direct English-guide HTML contains a preview-host `/en/.../` canonical URL and remains non-indexable on Preview.
- [ ] Preview document pages are `noindex`.
- [ ] `ECON-REF-01` has a generated SEO/static route for its current 1.0 rendition.
- [ ] No Arabic `hreflang` is emitted without a genuine approved Arabic rendition.
- [ ] English product-guide SEO does not generate false English alternates for Persian-only foundational documents.

## 8. Editorial-truth boundaries

Implementation/editorial status is now:

- audited Persian learning-path guides: `audited_current`;
- Bahar/economy guide and role-based guides: current and runtime-integrated;
- `/status/`, `/map/`, `/glossary/`: `audited_current`;
- 31 English product/API guides: re-audited against `EarthCoop@f88c28a518749fb81133c3affa5e5fbf353f844a`, corrected where current product truth changed, and runtime-mapped under the explicit `/en/` namespace in the integration candidate;
- English foundational translations: unavailable;
- genuine Arabic: unavailable.

The English runtime integration is **implementation-complete in the candidate**, but it is not a live-UAT PASS until the exact merged commit is deployed to Preview and the checks below are verified there.

Live checks:

- [ ] Persian guide/status/map/glossary surfaces visibly match their audited-current state rather than older historical labels.
- [ ] Exactly the audited 31 English product/API source paths are exposed; no unrelated root/legacy file is promoted as English product guidance.
- [ ] Corrected English pages reflect current Google auth, `/api/v1`, notification/push, NajmHoda and ticket-route/versioning boundaries.
- [ ] No page implies that all legacy `/api` routes are a stable public third-party v1 API.
- [ ] The Preview does not claim English foundational translations or genuine Arabic documentation.

## 9. English product-guide runtime routes

- [ ] `/en/` resolves as the English product-guide entry page and survives direct refresh.
- [ ] Nested examples such as `/en/account/profile/`, `/en/api/overview/`, `/en/groups/overview/` and `/en/projects/overview/` resolve directly.
- [ ] Hash navigation `/#/en/...` resolves to the same audited static guide content rather than a blank/404 route.
- [ ] Internal links between audited English guides remain inside `/en/.../`.
- [ ] Links to Persian-only governed documents remain document links and are not rewritten into false `/en/documents/...` translations.
- [ ] English pages remain visually within the recovered 0.8 Docs Center shell while reading LTR.

## 10. Cross-repository compatibility

- [ ] EarthCoop footer/welcome/authenticated navigation links to the center still resolve.
- [ ] All ten official-v1 foundational routes expected by `DocsCenterLinkContractTest` resolve in the recovered runtime.
- [ ] The `ECON-REF-01` application link contract resolves to the current canonical document identity/alias and no longer requires the obsolete `econ-ref-01-fa-0-1` versioned identifier.
- [ ] No canonical navigation depends on legacy Mintlify paths such as `/fa/introduction`, `/fa/foundational`, `/00-overview`, `/fa/api/overview`, or `/governance/translation-policy`.

## 11. Exit criteria

Preview recovery UAT is complete only when:

1. all automated recovered build/validation gates are green for the exact deployed commit;
2. the checks above pass on the live cPanel Preview;
3. all ten foundational documents are visibly `1.0 / effective` and `ECON-REF-01` is visibly version `1.0` without being misrepresented as effective legislation;
4. the audited Persian surfaces remain current and the 31 audited English product/API guides, if included in cutover scope, are visibly mapped under the truthful English-guide boundary;
5. language metadata distinguishes site guide availability from unavailable foundational translations;
6. no production-domain change has been made;
7. Production cutover is handled by a separate reviewed plan and explicit approval.
