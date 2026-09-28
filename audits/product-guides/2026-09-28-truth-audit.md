# EarthCoop Product Documentation Truth Audit — 2026-09-28

## Purpose

This audit is the evidence bridge between the existing English product guides and the current EarthCoop product. It does not change legal effect, foundational-document status, or registered release history. Its only purpose is to prevent public product documentation from presenting legacy wording, incomplete implementation, or planned architecture as current product truth.

## Evidence precedence

Claims are reviewed in this order:

1. current production-facing UI/routes and current merged runtime code;
2. current automated tests and mature domain services;
3. approved/current implementation specifications and status documents;
4. foundational/reference documents for normative rules;
5. existing product guides.

An old guide is never evidence for its own claim. Where code proves only a domain capability but not a stable public/API contract, the guide is classified conservatively as `in_development` rather than promoted to `available` by inference.

## Executive findings

The current English guide set cannot be treated as one uniformly current product manual. The audit inventory contains 30 pages. Several describe real, mature product domains, but a substantial subset uses a starter-era information model or overstates the maturity of a transport/API/user workflow.

The largest truth gaps are:

- **Legacy product naming:** `index.mdx` still presents `NewEarthCoop` as the current product name. The canonical name is EarthCoop.
- **Over-broad availability:** `introduction.mdx` and `quickstart.mdx` describe the platform as fully available in English and Persian and collapse current, in-development, and planned capabilities into one status.
- **Groups:** old guide copy does not accurately center the automatic system-group model and its public/professional/specialty/age-gender dimensions. Generic “find/join/create a group” language is insufficient and sometimes misleading.
- **Governance and elections:** current runtime has canonical Location/Governance and systemic-election services. Higher-level participation, role eligibility, pending residence/location proposals, Temporary Active and support thresholds must be described from the current contract, not generic cooperative-group assumptions.
- **Projects/economy:** project and investment services are real, but older copy uses outdated Gol positioning and can imply fund movement/approval semantics that are not safe to infer. ECON 0.2 and ECON-REF-01 must supply the normative vocabulary while code determines what is actually available in the product.
- **Najm Bahar:** the transaction, fee and project/investment domains are real, but advanced claims such as scheduled transfers require specific evidence. A real transfer core does not prove every transfer mode shown in an old guide.
- **Najm Hoda:** a real chat/orchestration surface exists, but the subsystem is still evolving. Specialist-agent, autonomous action, fixed knowledge-search or legal/economic-authority claims must not be promoted to current member-facing capability without direct evidence.
- **API:** `/api/*` currently contains both real domain endpoints and legacy/closure-based routes. Presence under that prefix is not evidence of a stable versioned external/mobile API contract. API pages therefore need explicit current/in-development positioning.

## Location/Governance truth boundary

The canonical Location/Governance architecture is not a future concept. Current project status records the canonical residence/governance model, registration/profile/admin integration, pending proposal lifecycle, canonical group consumers, election consumers and project-scope integration as closed work.

Three structural cases — city without urban region, urban region without neighborhood, and village without neighborhood — are completed behavior, not future backlog.

Proposal support is also implemented. Distinct-user support may advance a proposal to review readiness, but **support is not approval**. Documentation must not say or imply that reaching the support threshold automatically validates a location, structural claim, project, or governance decision.

Remaining Location/Governance items such as support-progress UX, invitation CTA, and high-volume admin-queue polish are enhancements rather than evidence that the canonical model is absent.

## API truth boundary

Sanctum and multiple `/api/*` routes exist, including Najm Hoda and legacy geography. However, the current readiness record explicitly distinguishes this surface from the planned stable/versioned client contract. Accordingly:

- API documentation may explain verified current endpoints when they are evidenced precisely;
- it must not describe the entire current `routes/api.php` surface as a stable public/mobile API;
- closure-based legacy geography must not be presented as the canonical Location/Governance architecture;
- Projects, Notifications, Elections and Najm Bahar may be domain-capable while still lacking a final client-facing versioned contract.

## Groups, participation and elections

Current code proves automatically materialized governance-scoped/system groups and dedicated public/profession/specialty dimensions. Product guides must distinguish these from user-created groups.

Role semantics must also be explicit. Observer and Temporary Active states do not gain systemic-election voting rights merely from membership; Temporary Active exists for limited participation and is not equivalent to Active for election eligibility. Elected managers and inspectors remain active members for personal voting eligibility under the current election contract.

Generic claims such as “every group has elections” or “join any cooperative group” require replacement by the actual system-group/user-created-group distinction and election eligibility rules.

## Projects and Najm Bahar

Current ProjectService, project controllers, investment controllers and Najm Bahar transaction services prove a real implemented domain. They do not justify retaining older economic terminology.

Public/user guides must observe these boundaries:

- **Bahar** is the primary monetary unit; **Gol** is its subunit, not a separate currency.
- Creation and Activation are distinct events.
- project support/review/approval must not be collapsed into one step;
- an approval or investment intent must not be described as an automatic direct transfer to a project owner unless the exact current flow proves it;
- normative economic architecture may be cited from ECON 0.2 / ECON-REF-01, while product status must still reflect current implementation;
- VPU, Marketplace or other architecture must be labelled according to evidence rather than assumed current from the law/reference model.

## Najm Hoda

Najm Hoda currently has a real controller/orchestration/chat surface and integration work across EarthCoop domains. That supports describing a current assistant interaction surface. It does not support portraying all envisioned specialist agents, autonomous legal/economic action, or every knowledge-base workflow as current.

Documentation must preserve a strict distinction between:

- current conversational/orchestration capabilities;
- in-development integrations and specialist behavior;
- planned future advisory/agentic architecture.

Najm Hoda must never be documented as an independent legislator, unappealable adjudicator, or autonomous owner/controller of member assets.

## Six mandatory rewrites

### `introduction.mdx` — Rewrite

Reason: over-broad product positioning; currently implies a uniform level of availability across group governance, projects, finance, AI and multilingual support. The new introduction must describe EarthCoop by stable current foundations and visibly label in-development/planned capabilities.

### `quickstart.mdx` — Rewrite

Reason: onboarding language does not accurately reflect current multi-step registration and automatic system-group membership. It must not instruct the user as though manually creating/joining a first group were the central system-group onboarding flow.

### `groups/overview.mdx` — Rewrite

Reason: needs the canonical automatic system-group model, public/professional-specialty/age-gender families, geographic hierarchy and role/participation distinction.

### `projects/overview.mdx` — Rewrite

Reason: real project services exist, but old economic terminology and Gol positioning are stale. The page must separate current project functionality from the normative ECON workflow and from capabilities not yet verified as current.

### `najm-bahar/overview.mdx` — Rewrite

Reason: Najm Bahar is real, but the old overview treats a broad financial architecture as a uniformly current product surface. It must distinguish current implemented account/transaction/fee/project domains from in-development/planned architecture and use ECON terminology.

### `najm-hoda/overview.mdx` — Rewrite

Reason: current chat/orchestration is real while wider specialist/autonomy architecture is evolving. The overview needs a current/in-development/planned boundary and must avoid unsupported authority or fixed-knowledge-process claims.

## Page-family decisions

The evidence JSON is the machine-readable source for per-page decisions. At this checkpoint:

- current account notification settings and support-ticket surfaces can largely be retained, subject to copy/link review;
- profile/account setup require rewriting around the canonical registration/location model;
- all API pages require cautious rewriting before they can be presented as a stable API reference;
- all group pages require semantic alignment with automatic system groups and current governance/election rules;
- all project/Najm Bahar pages require economic terminology and availability review;
- all Najm Hoda pages require current-versus-future review;
- Arabic product renditions must wait until their English sources are reviewed and current.

## Non-goals

This audit does not:

- amend ECON or any foundational document;
- make ECON-REF-01 effective;
- modify immutable release snapshots;
- declare an API stable solely because a route exists;
- infer a feature from an old guide;
- fill evidence gaps with model knowledge;
- publish Arabic translations before the English source is reviewed.

## Next execution order

1. correct public top-level English positioning and legacy naming;
2. rewrite Groups / Location-Governance / Elections guides;
3. rewrite Projects / Najm Bahar against product evidence + ECON terminology;
4. rewrite Najm Hoda and support-related guidance;
5. review links/navigation and only then create reviewed Arabic renditions.
