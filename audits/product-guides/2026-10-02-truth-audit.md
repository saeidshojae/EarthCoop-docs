# EarthCoop English product-guide truth audit — 2026-10-02

## Scope and evidence baseline

This audit rechecks all 31 English product/API guide sources that were previously reviewed on 2026-09-28. The older audit remains historical evidence; it is not treated as a permanent currentness guarantee.

- **Docs source baseline:** `saeidshojae/EarthCoop-docs@f54119e4d362dd93c1cfee1c242bf87fa7a2e59f`
- **Previous application evidence baseline:** `saeidshojae/EarthCoop@38ef89def3077f4280c7dd704f4c2b055ac95931`
- **Current application evidence baseline:** `saeidshojae/EarthCoop@f88c28a518749fb81133c3affa5e5fbf353f844a`
- **Baseline delta at review start:** 95 commits ahead

Evidence precedence remains unchanged:

1. current runtime/UI/routes/merged application code;
2. current tests and domain services;
3. approved implementation specifications/status evidence;
4. governed foundational/reference documents;
5. existing guide copy.

An existing guide never proves its own claim.

## Material changes since the previous audit

The application delta materially changes documentation truth in several areas:

- Google OAuth registration/authentication is now implemented and regression-tested;
- a real versioned `/api/v1` first-party/native-client contract exists;
- `/api/v1/auth/login` issues bearer tokens and logout revokes the current token;
- `/api/v1` includes bootstrap, current-user, notifications, push-device, geography, Najm Hoda and media endpoints;
- communication preferences / Communication Center work has landed while the existing notification-settings surface also remains real;
- support ticket UI truth is `/tickets`; closed tickets cannot receive new user comments through the current controller;
- profile/canonical-profile and mobile/API delivery infrastructure have advanced.

The existence of `/api/v1` does **not** mean every legacy `/api` route is now a stable public third-party API. In particular, ticket endpoints are not part of the current `/api/v1` route contract. The updated guides distinguish the versioned first-party/native contract from legacy/internal or not-yet-versioned domains.

## 31-guide review result

| # | Guide | Result | 2026-10-02 action |
| ---: | --- | --- | --- |
| 1 | `account-setup.mdx` | **Needs correction** | Add evidenced Google registration/auth path without replacing the current email/password path. |
| 2 | `account/notifications.mdx` | **Revalidated current** | Existing settings/categories/threshold wording remains compatible with current notification-settings controller; do not conflate it with Communication Center. |
| 3 | `account/profile.mdx` | **Revalidated current** | Canonical profile/residence wording remains compatible with current profile/location architecture. |
| 4 | `account/support-tickets.mdx` | **Needs correction** | Replace stale `/support/tickets` route with `/tickets`; remove false closed-ticket auto-reopen claim; separate member UI from non-versioned API notes. |
| 5 | `api/authentication.mdx` | **Needs correction** | Document current `/api/v1/auth/login` bearer-token contract and logout while keeping third-party/public-API caveat. |
| 6 | `api/geographic.mdx` | **Needs correction** | Document current `/api/v1/geography/*` endpoints as the versioned native/client contract; keep richer canonical-topology caveat. |
| 7 | `api/najm-hoda.mdx` | **Needs correction** | Document `/api/v1/najm-hoda/message` as current versioned native/client endpoint; preserve server-authority boundaries. |
| 8 | `api/notifications.mdx` | **Needs correction** | Document current v1 list/unread/read endpoints and push-device subscription contract; distinguish domain truth from notification truth. |
| 9 | `api/overview.mdx` | **Needs correction** | Replace false “no versioned contract” language with the current `/api/v1` native/client contract and explicit scope boundary. |
| 10 | `api/tickets.mdx` | **Needs correction** | State that ticket routes remain outside current `/api/v1`; avoid implying the v1 bearer contract automatically versions the legacy ticket API. |
| 11 | `governance/location-and-governance.mdx` | **Revalidated current** | Topology-aware base-governance and optional micro-address truth remains current. |
| 12 | `governance/translation-policy.mdx` | **Revalidated current** | Locale/legal-effect/sourceVersion distinctions remain current; legacy `ar/` remains non-Arabic compatibility material. |
| 13 | `groups/chat-and-messaging.mdx` | **Revalidated current** | Conservative role/session/event wording remains current. |
| 14 | `groups/creating-a-group.mdx` | **Revalidated current** | Current separation between system groups and user-created groups remains valid. |
| 15 | `groups/joining-a-group.mdx` | **Revalidated current** | Automatic system membership and topology-aware residence model remain valid. |
| 16 | `groups/overview.mdx` | **Revalidated current** | Current public/professional-specialty/age-gender framing remains valid. |
| 17 | `groups/polls-and-elections.mdx` | **Revalidated current** | Candidate-free System Election, eligibility and responsibility-offer distinctions remain aligned with current contract. |
| 18 | `index.mdx` | **Revalidated current** | Correctly distinguishes English product guides from English foundational translations. |
| 19 | `introduction.mdx` | **Needs correction** | Replace “versioned API/mobile boundary still being separated” with current versioned native-delivery contract while retaining broader in-development scope. |
| 20 | `najm-bahar/membership-fees.mdx` | **Revalidated current** | Current policy/fee and monetary-event distinctions remain valid. |
| 21 | `najm-bahar/overview.mdx` | **Revalidated current** | Current product vs normative ECON architecture boundary remains valid. |
| 22 | `najm-bahar/sub-accounts.mdx` | **Revalidated current** | Ownership/money-state invariants remain valid. |
| 23 | `najm-bahar/transfers.mdx` | **Revalidated current** | Canonical transfer and Dim/Active rules remain valid. |
| 24 | `najm-hoda/chatting-with-najm-hoda.mdx` | **Needs correction** | Update API-boundary paragraph to acknowledge current `/api/v1/najm-hoda/message` without turning it into a general public integration promise. |
| 25 | `najm-hoda/knowledge-base.mdx` | **Revalidated current** | Source-authority/freshness language remains conservative and current. |
| 26 | `najm-hoda/overview.mdx` | **Revalidated current** | Current chat/orchestration/authority boundary remains valid; the API-specific v1 change is handled in the API and chatting guides. |
| 27 | `projects/investing.mdx` | **Revalidated current** | Investment-record vs executed-transfer distinction remains valid. |
| 28 | `projects/overview.mdx` | **Revalidated current** | Review lifecycle and ECON separation remain valid. |
| 29 | `projects/submitting-a-project.mdx` | **Revalidated current** | Broad governance-scope stopping behavior and review states remain valid. |
| 30 | `projects/tracking-status.mdx` | **Revalidated current** | Status/history/ledger distinctions remain valid. |
| 31 | `quickstart.mdx` | **Needs correction** | Mention the current Google path while preserving the complete member-profile/base-governance steps required after account authentication. |

The machine-readable inventory must continue to assert exactly these 31 unique paths; no extra root/legacy page is promoted into the audited set.

## Correction policy

Corrections made from this audit must be narrow:

- describe `/api/v1` as a **current versioned first-party/native-client contract**, not as a promise that every domain is a stable third-party public API;
- do not move non-v1 ticket routes into the v1 contract;
- do not advertise English foundational translations simply because English product guides become live;
- do not advertise Arabic;
- preserve current Persian/official-v1 legal authority semantics;
- keep internal/legacy `/api` routes clearly distinct from the versioned native/client contract;
- keep direct product claims evidence-based and avoid speculative UI details.

## Runtime publication gate

The 31-source set may be mapped into the recovered Preview runtime only after:

1. all files marked **Needs correction** above are corrected;
2. an updated machine-readable evidence file records this audit baseline and per-guide result;
3. runtime tests prove exactly the audited 31 sources are exposed as English guides;
4. direct/static and SPA routes agree;
5. English guide search and Preview-safe SEO are generated;
6. locale metadata exposes English guide availability without asserting English foundational translations;
7. Arabic remains unavailable;
8. Preview remains `noindex` and Production remains untouched.
