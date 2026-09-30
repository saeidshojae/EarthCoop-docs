# Recovered Docs Center editorial truth audit — 2026-09-30

## Scope

This audit separates the recovered Knowledge Center 0.8 presentation layer from repository content that has been reviewed after that snapshot. It does not change legal text, publication status, or legal effect.

## Classifications

| Surface | Classification | Publication rule |
|---|---|---|
| Recovered Persian 0.8 guides | `historical_snapshot` | Preserve for continuity, but do not present as current product truth until individually reviewed against the current EarthCoop implementation. |
| Reviewed English product-guide inventory (`audits/product-guides/2026-09-28-inventory.json`) | `verified_current` | Evidence-backed source material exists in the repository, but it is not yet mapped into the recovered 0.8 runtime. |
| Recovered `/status/` | `needs_review` | Regenerate from current evidence before treating its capability claims as current. |
| Recovered `/map/` | `needs_review` | Preserve route/UX, but review claims and links against the current system before production cutover. |
| Recovered `/glossary/` | `needs_review` | Reconcile with the canonical multilingual terminology source before production cutover. |
| Genuine Arabic documentation | `unavailable` | No genuine Arabic rendition is currently approved for this runtime. Legacy Mintlify `ar/` paths are Persian RTL compatibility mirrors and must never be advertised as Arabic. |

## Evidence boundary

The 2026-09-28 product-guide inventory contains 31 reviewed English product pages with scanner-known legacy/sensitive claims cleared by the repository's regression tests. This is evidence for the reviewed English source material, not evidence that those pages are already available in the recovered runtime.

The recovered 0.8 Persian guide pages predate the latest product-guide truth audit. Their visual continuity is valuable, but their claims require review before production publication as current guidance.

## Runtime consequence

The preview may continue to expose the recovered 0.8 guide/status/map/glossary surfaces for UAT, but generated deployment metadata must keep their audit state explicit. Production cutover must not silently relabel historical or needs-review content as current.
