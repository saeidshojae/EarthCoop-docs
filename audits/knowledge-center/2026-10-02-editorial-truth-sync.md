# Recovered Docs Center editorial truth sync — 2026-10-02

## Purpose

This operational sync records changes that landed after the 2026-09-30 recovered-editorial-truth audit. It does not rewrite that historical audit. It identifies which previously open editorial surfaces are now current and which work remains open before Production cutover.

**Docs repository baseline:** `saeidshojae/EarthCoop-docs@f54119e4d362dd93c1cfee1c242bf87fa7a2e59f`  
**EarthCoop application baseline for the new English re-review:** `saeidshojae/EarthCoop@f88c28a518749fb81133c3affa5e5fbf353f844a`

## Current classifications

| Surface | 2026-10-02 classification | Evidence / consequence |
| --- | --- | --- |
| Recovered Persian learning-path guides | `audited_current` | The recovered shell now receives audited current Persian guide content; direct and SPA learning-path behavior is regression-covered. |
| Bahar/economy guide | `audited_current` | Dedicated current explanatory guide/member story is integrated with stable recovered routing. |
| Role-based guides | `audited_current` | Dedicated role guidance is integrated for current user-facing role paths. |
| `/status/` | `audited_current` | Reconciled against current EarthCoop repository evidence and official-v1 boundaries. |
| `/map/` | `audited_current` | Reconciled against the current ecosystem/platform architecture. |
| `/glossary/` | `audited_current` | Reconciled against canonical terminology, official-v1, and audited current guidance. |
| 31 English product/API source guides | `revalidation_active` | The 2026-09-28 audit remains evidence, but its EarthCoop baseline is stale relative to current `main`; every page must be rechecked before runtime mapping. |
| English foundational translations | `unavailable` | Product guides must not imply that FC/CH/CO/etc. have English renditions. |
| Genuine Arabic documentation | `unavailable` | Legacy `ar/` compatibility material remains Persian RTL content and is not an Arabic rendition. |

## English revalidation trigger

The previous English truth audit used `saeidshojae/EarthCoop@38ef89def3077f4280c7dd704f4c2b055ac95931`. Current EarthCoop `main` is `f88c28a518749fb81133c3affa5e5fbf353f844a`, 95 commits ahead of that baseline at the start of this revalidation.

The intervening work materially affects several guide families, especially:

- Google authentication/registration;
- API v1 / native-delivery foundations, notifications, device push and media;
- profile/canonical-profile flows;
- communication preferences and the Communication Center;
- support ticket/email-threading behavior;
- SEO/client compatibility infrastructure.

Therefore `verified_current` from the 2026-09-28 English audit is not carried forward blindly. Pages in affected domains require fresh evidence, and unchanged-domain pages still require an explicit revalidation decision.

## Current publication boundary

Until the revalidation and runtime-mapping work is complete:

- Persian remains the live display locale of the recovered Preview runtime;
- the English source guides remain repository evidence, not a claim of live English runtime availability;
- Preview remains non-indexable;
- Production remains out of scope;
- no locale metadata may imply English foundational translations or genuine Arabic content.

## Next gate

The next accepted state is a new dated English inventory/evidence audit tied to current EarthCoop `main`, followed by runtime integration of exactly the revalidated English guide set into routes, navigation, search, static Preview SEO, and truthful locale metadata.
