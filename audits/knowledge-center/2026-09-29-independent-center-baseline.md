# Independent EarthCoop Docs Center baseline audit

**Audit date:** 2026-09-29  
**Target repository:** `saeidshojae/EarthCoop-docs`  
**Implementation branch:** `agent/independent-docs-center-20260929`  
**Preview hostname:** `docs-preview.earthcoop.ir`  
**cPanel preview document root:** `/home3/btboeapy/docs-preview.earthcoop.ir`

## Purpose

This audit records the recoverable evidence for the pre-repository independent EarthCoop Docs Center before its runtime is reconstructed under `site/`. It intentionally separates facts that are present in repository/project evidence from behavior that was previously reported but whose original deployable bytes are not currently recoverable. Nothing in this audit changes document status, legal effect, public baseline, or foundational text.

## Historical package lineage

| Version | Evidence status | Recoverable facts |
|---|---|---|
| `earthcoop-knowledge-center-0.6.0-cpanel.zip` | historically reported; original package bytes not recovered in the current repository/project file search | Separate static cPanel Docs Center package, manually uploaded/extracted under the docs preview site. |
| `0.6.1` | historically reported; original package bytes not recovered | UI cleanup including removal of the title focus box and normalized identity blocks for all ten foundational documents; prior test report: 79 passing tests. |
| `earthcoop-knowledge-center-0.7.0-cpanel.tar.gz` | historically reported with commit evidence reference; archive bytes not recovered | Package associated with commit `2822e9f`; included ten versioned Persian PDFs, official PNG logo copied from `public/images/logo.png`, and PDF download/print/copy controls. Document status presentation was limited to governed statuses such as `registered_not_effective` and `under_audit`. |
| `earthcoop-knowledge-center-0.7.1` | latest known good runtime baseline; source/archive bytes not recovered | Corrective iteration restoring removed base CSS and replacing the PNG with the official `public/icons/icon.svg`; prior test report: 100 passing tests. The final ZIP/upload step was reported blocked by quota at that point, so this audit does **not** claim possession of an original 0.7.1 deploy archive. |

## Current repository evidence

The current `EarthCoop-docs` repository is the governed documentation source, but it does not contain the historical independent runtime as a reproducible build. In particular, no recoverable historical `site-config.js` was found in the current repository, and the approved design records the absence of the old deployable `index.html`, `app.js`, `styles.css`, `site-config.js`, and `deployment-manifest.json` source set from `main`.

The repository does contain the authoritative source-of-truth layers that the reconstructed runtime must consume:

- `document-registry.json` for public baseline and translation/editorial state;
- `docs-manifest.json` for knowledge-center ingestion/review identities and renditions;
- `releases/foundational/<date>/` for immutable registered release evidence;
- `published/foundational/` for generated/review material where applicable;
- `REGISTRY_MODEL.md` for the rule that `registered`, `current`, `final`, `published`, and `effective` are not interchangeable.

## Baseline runtime behavior to preserve

The reconstruction baseline is the latest known 0.7.x behavior, constrained by what is actually evidenced:

### Recovered or strongly evidenced

- Static SPA deployment on ordinary cPanel hosting.
- Hash-based document routes in the `/#/documents/{id}` family.
- Ten foundational documents FC through STD in the center.
- Document status/version presentation that does not synthesize legal effect.
- Persian as the authoritative/source language for foundational documents.
- Search was part of the independent center baseline; the new implementation must correct the known limitation by indexing document body text, not only titles/abstracts.
- Table of contents/document navigation was part of the approved independent-center baseline carried into the design.
- Copy and print controls were part of the baseline; `0.7.0` also provides specific evidence for PDF download.
- Official EarthCoop visual identity/logo was used; `0.7.1` specifically reported `public/icons/icon.svg` as the corrected logo source.
- Responsive static UI suitable for preview deployment on `docs-preview.earthcoop.ir`.

### Required by the approved reconstruction design, not claimed as recovered original bytes

- Real application locales: `fa` RTL, `en` LTR, `ar` RTL.
- Explicit unavailable-translation/fallback labeling; Persian content must never masquerade as English or Arabic.
- Full-text search with document ID, locale, headings/anchors, body text, status/version, and canonical route.
- Locale-correct copy/print/download behavior.
- Deterministic `dist/` generation and `deployment-manifest.json`.
- Post-deploy live SHA verification.

## Original-byte recovery status

**Original 0.7.x runtime source/archive bytes were not recovered from the current `EarthCoop-docs` repository, current Project/Library search, or branch evidence available to this implementation session.** Historical package names and behavior are therefore provenance evidence, not byte-for-byte source material.

This means later tasks must reconstruct the runtime from governed repository sources while preserving only the evidenced compatibility contract. They must not invent hidden 0.7.x implementation details, CSS values, or file hashes and present them as recovered originals.

## Deployment path decision

There is no unresolved target-path ambiguity for this phase:

- Preview hostname: `docs-preview.earthcoop.ir`
- cPanel document root: `/home3/btboeapy/docs-preview.earthcoop.ir`
- Production hostname `docs.earthcoop.ir`: **out of scope and must remain unchanged until a separate post-UAT cutover approval**.

The FTPS `server-dir` used later must still be derived from the FTP account root instead of assuming that the absolute cPanel filesystem path above is directly valid as an FTP-relative path.

## Reconstruction rules for later tasks

1. Treat `earthcoop-knowledge-center-0.7.1` as the latest known compatibility baseline, not as a recovered source tree.
2. Use the current repository registries/manifests as authoritative content/status inputs.
3. Preserve hash deep links `/#/documents/{id}`.
4. Preserve copy/print/download, TOC, navigation, responsive layout, and official branding where evidence exists.
5. Do not recreate Mintlify-specific locale hacks; use real `fa/en/ar` runtime locales.
6. Do not infer legal effectiveness from build inclusion or metadata freshness.
7. Any visual detail not supported by recovered evidence is a reconstruction decision and must be labeled/treated as such rather than historical fact.

## Audit conclusion

The latest known package line is `earthcoop-knowledge-center-0.7.1`, but its original deployable bytes are not available in the current evidence set. The implementation can proceed safely by reconstructing the independent static runtime from governed repository content, using the compatibility behaviors above as the baseline and deploying only to `docs-preview.earthcoop.ir` at `/home3/btboeapy/docs-preview.earthcoop.ir` during this phase.
