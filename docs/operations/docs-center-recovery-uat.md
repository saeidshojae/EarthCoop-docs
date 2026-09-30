# EarthCoop Docs Center recovery — preview UAT checklist

**Scope:** `https://docs-preview.earthcoop.ir` only.  
**Production cutover:** out of scope until this checklist is completed and explicitly approved.

## 1. Baseline identity and deployment

- [ ] `deployment-manifest.json` is reachable from the preview host and returns JSON, not HTML/redirect content.
- [ ] `sourceSha` equals the deployed `main` commit.
- [ ] `runtimeBaseline` is `earthcoop-knowledge-center-0.8.0`.
- [ ] `runtimeArchiveSha256` matches the pinned 0.8 recovery archive.
- [ ] `canonicalOrigin` is exactly `https://docs-preview.earthcoop.ir`.
- [ ] `previewIndexing` is `disabled`.
- [ ] `displayLocales` is exactly `['fa']` at this checkpoint.

## 2. Recovered UI/UX baseline

- [ ] Home, navigation, sidebar, typography, theme control, responsive/mobile navigation and document-reader layout visibly match the recovered 0.8 baseline rather than the discarded replacement shell.
- [ ] `/guides/start/`, `/documents/`, `/map/`, `/glossary/`, and `/status/` load without a server error.
- [ ] Mobile navigation opens/closes correctly and does not obscure the reader.
- [ ] Missing routes render the recovered 404 experience.

## 3. Foundational documents

For `FC`, `CH`, `CO`, `EX`, `ECON`, `DG`, `JUD`, `LOC`, `ETH`, and `STD`:

- [ ] The EarthCoop application hash deep link `/#/documents/{lowercase-id}` resolves.
- [ ] The direct static page `/documents/{lowercase-id}/` resolves on refresh.
- [ ] Title, code, version, authority and legal/editorial status match governed repository metadata.
- [ ] Registered/non-effective status is not displayed as effective merely because the rendition is current.
- [ ] TOC anchors navigate to the correct provision.
- [ ] Copy-document-link, provision permalink/copy, print, available PDF download, and version-history controls behave correctly.

## 4. ECON-REF-01 reference document

- [ ] `/#/documents/econ-ref-01-fa-0-1` resolves from the same contract already used by the EarthCoop application.
- [ ] `/documents/econ-ref-01-fa-0-1/` resolves directly and survives refresh.
- [ ] It is discoverable in the documents/reference collection rather than hidden in generated data.
- [ ] Its status is shown as `official_draft`; the UI does not imply legal effectiveness.
- [ ] The breadcrumb says **اسناد مرجع**, not **اسناد بنیادین**.
- [ ] Its sections/anchors are navigable and searchable.

## 5. Language truth

- [ ] Persian content renders with `fa`/RTL semantics.
- [ ] The UI does not advertise legacy Mintlify `ar/` mirrors as Arabic.
- [ ] The UI does not claim reviewed English repository guides are already live in the recovered runtime.
- [ ] No unavailable translation silently masquerades as Persian/English/Arabic.
- [ ] `recovered-locales.json` reports the same live locale set as `deployment-manifest.json`.

## 6. Full-text search

- [ ] Search finds body text from at least one foundational article, not only a title/summary.
- [ ] Search finds a phrase from `ECON-REF-01` body content.
- [ ] A result opens the correct document and stable section anchor.
- [ ] Search results preserve document status/version context where the UI exposes it.
- [ ] No false Arabic result is generated from a legacy `ar/` Persian mirror.

## 7. Preview SEO safety and static SEO output

- [ ] `robots.txt` disallows crawling of the preview site.
- [ ] Response headers include unconditional `X-Robots-Tag: noindex, nofollow` for preview content.
- [ ] `sitemap.xml` and `recovered-seo-routes.json` contain preview-host URLs only; there is no canonical leak to `docs.earthcoop.ir`.
- [ ] Direct document HTML contains a preview-host canonical URL.
- [ ] Preview document pages are `noindex`.
- [ ] `ECON-REF-01` has a generated SEO/static route.
- [ ] No Arabic `hreflang` is emitted without a genuine approved Arabic rendition.

## 8. Editorial-truth boundaries

- [ ] Recovered Persian 0.8 guides are treated as a historical/under-audit snapshot, not silently relabeled current product truth.
- [ ] The 31 reviewed English product/API guides remain preserved in repository evidence and are not falsely advertised as runtime-mapped.
- [ ] `/status/`, `/map/`, and `/glossary/` are treated as `needs_review` until separately reconciled with current system truth/canonical terminology.
- [ ] The preview does not claim genuine Arabic documentation exists.

## 9. Cross-repository compatibility

- [ ] EarthCoop footer/welcome/authenticated navigation links to the center still resolve.
- [ ] All ten foundational routes expected by `DocsCenterLinkContractTest` resolve in the recovered runtime.
- [ ] The `ECON-REF-01` route expected by `DocsCenterLinkContractTest` resolves exactly as `/#/documents/econ-ref-01-fa-0-1`.
- [ ] No canonical navigation depends on legacy Mintlify paths such as `/fa/introduction`, `/fa/foundational`, `/00-overview`, `/fa/api/overview`, or `/governance/translation-policy`.

## 10. Exit criteria

Preview recovery UAT is complete only when:

1. all automated recovered build/validation gates are green for the exact deployed commit;
2. the checks above pass on the live cPanel preview;
3. any intentionally deferred editorial surfaces remain explicitly marked/audited rather than being silently treated as current;
4. no production-domain change has been made;
5. production cutover is handled by a separate reviewed plan and explicit approval.
