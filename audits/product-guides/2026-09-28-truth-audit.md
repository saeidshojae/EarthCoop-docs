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

The English product-guide inventory contains **31 pages** at this checkpoint. The original set could not be treated as one uniformly current product manual: several described real mature domains while others used a starter-era information model or overstated the maturity of a transport/API/user workflow.

The largest truth gaps identified were:

- **Legacy product naming:** `index.mdx` presented `NewEarthCoop` as the current product name. The canonical name is EarthCoop.
- **Over-broad availability:** `introduction.mdx` and `quickstart.mdx` collapsed current, in-development, and planned capabilities into one status.
- **Groups:** old guide copy did not accurately center the automatic system-group model and its public/professional/specialty/age-gender dimensions.
- **Governance and elections:** higher-level participation, role eligibility, pending residence/location proposals, Temporary Active and support thresholds required the current canonical contract rather than generic cooperative-group assumptions.
- **Projects/economy:** older copy used outdated Gol positioning and unsafe approval/fund-movement semantics. ECON 0.2 / ECON-REF-01 supply normative vocabulary while code determines current availability.
- **Najm Bahar:** a real transaction/fee/project core existed, but advanced claims such as scheduled transfers lacked sufficient evidence.
- **Najm Hoda:** a real chat/orchestration surface existed, while specialist/autonomous/action and fixed-knowledge claims were overstated.
- **API:** `/api/*` contained real domain endpoints mixed with legacy/closure-based routes; presence under that prefix was not evidence of a stable versioned external/mobile API contract.

## Location/Governance truth boundary

The canonical Location/Governance architecture is current product architecture, not a future concept. Current project evidence records the residence/governance model, registration/profile/admin integration, pending proposal lifecycle, canonical group consumers, election consumers and project-scope integration.

Three structural cases — city without urban region, urban region without neighborhood, and village without neighborhood — are treated as topology cases rather than as reasons to invent missing administrative levels.

Proposal support is distinct from approval. Distinct-user support may advance a proposal to review readiness, but **support is not approval**. Documentation must not say or imply that reaching the support threshold automatically validates a location, structural claim, project, or governance decision.

Optional local address levels such as Street, Alley, Complex, Block, and Building are also distinct from the official base-governance requirement. Community membership at those micro-levels must not be silently promoted into systemic election eligibility.

## API truth boundary

Sanctum and multiple `/api/*` routes exist, including Najm Hoda and legacy geography. However, the current readiness record distinguishes this surface from the planned stable/versioned client contract. Accordingly:

- API documentation may explain verified current implementation behavior;
- it must not describe the entire current `routes/api.php` surface as a stable public/mobile API;
- closure-based legacy geography must not be presented as the canonical Location/Governance architecture;
- Projects, Notifications, Tickets and Najm Hoda may be domain-capable while still lacking a final client-facing versioned contract;
- authentication middleware does not prove a public token-issuance workflow.

## Groups, participation and elections

Current code proves automatically materialized governance-scoped/system groups and dedicated public/profession/specialty dimensions. Product guides must distinguish these from user-created groups.

Role semantics are explicit. Observer and Temporary Active states do not gain systemic-election voting rights merely from membership; Temporary Active is not equivalent to Active for election eligibility. Elected managers and inspectors retain their personal systemic voting/selectability rights under the current election contract.

The System Election guide must preserve the candidate-free lifecycle, eligibility snapshot, deterministic tally/ranking, responsibility offer, acceptance/decline/expiry, replacement, appointment, and audit boundaries rather than returning to a generic candidate-election model.

## Projects and Najm Bahar

Current ProjectService, project controllers, investment controllers and Najm Bahar transaction services prove a real implemented domain. They do not justify retaining older economic terminology.

Public/user guides now observe these boundaries:

- **Bahar** is the primary monetary unit; **Gol** is its subunit, not a separate currency.
- Creation and Activation are distinct events.
- the canonical monetary-event model separates Creation, Activation, Transfer, Commitment, Taxation, Cancellation, and Retirement;
- project support/review/approval are distinct events;
- approval is not Transfer;
- investment intent/record is not proof of executed Transfer;
- public-project reference architecture separates Liability Snapshot, Commitment, Committed Dim, Activation, Transfer, Active Project Fund and execution payments;
- normative economic architecture may be cited from ECON 0.2 / ECON-REF-01 while product status still reflects current implementation.

## Najm Hoda

Najm Hoda currently has a real controller/orchestration/chat surface and integration work across EarthCoop domains. That supports describing a current assistant interaction surface. It does not support portraying all envisioned specialist agents, autonomous legal/economic action, or every knowledge-base workflow as current.

Documentation preserves a strict distinction between:

- current conversational/orchestration capabilities;
- in-development integrations and specialist behavior;
- planned future advisory/agentic architecture.

Client/browser context is informational and cannot grant execution authority. Mutating actions require trusted server authorization plus the applicable domain checks. Najm Hoda is not documented as an independent legislator, unappealable adjudicator, or autonomous owner/controller of member assets.

## Original mandatory rewrites — closure state

All six originally highlighted mandatory rewrites have been completed on the working branch:

- `introduction.mdx` — rewritten around evidence-backed availability boundaries;
- `quickstart.mdx` — rewritten around current multi-step onboarding and automatic system-group membership;
- `groups/overview.mdx` — rewritten around automatic system groups and current participation semantics;
- `projects/overview.mdx` — rewritten around current project behavior plus explicit ECON reference boundaries;
- `najm-bahar/overview.mdx` — rewritten around Bahar/Dim/Active and canonical monetary events;
- `najm-hoda/overview.mdx` — rewritten around current chat/orchestration, evolving capability, and server authorization.

## Page-family closure

The machine-readable evidence JSON remains the record of the initial per-page review decision. The implementation pass then closed the identified rewrite work as follows:

- public top-level positioning and account setup were rewritten;
- `account/profile.mdx` was rewritten around Primary Residence, canonical Governance Area, topology-aware base governance, pending proposals, and optional micro-location/community membership;
- account notification settings, support tickets, and translation policy remained in the `keep_correct` class subject to repository-wide validation;
- all API pages were rewritten to distinguish current implementation from a future stable/versioned public/mobile contract;
- all group/location/election pages were aligned with automatic system groups and current governance/election semantics;
- all project/Najm Bahar pages were aligned with current implementation and ECON terminology;
- all Najm Hoda pages were aligned with current-versus-evolving behavior and authority boundaries.

## Verification controls added

The branch now contains automated documentation contracts that guard the highest-risk regressions, including:

- deterministic product-guide inventory vs committed artifact;
- legacy product naming and over-broad availability claims;
- group/location/governance/election semantics;
- Bahar/Gol and canonical monetary-event distinctions;
- support ≠ approval and approval ≠ Transfer;
- Najm Hoda server-authorization and knowledge-freshness boundaries;
- API stability/authentication boundaries;
- Primary Residence / topology / optional micro-location profile semantics.

The committed inventory is designed to fail when guide source changes make the audit artifact stale, forcing the reviewer to refresh the evidence surface rather than silently drifting documentation.

## Non-goals

This audit and closure do not:

- amend ECON or any foundational document;
- make ECON-REF-01 effective;
- modify immutable release snapshots;
- declare an API stable solely because a route exists;
- infer a feature from an old guide;
- fill evidence gaps with model knowledge;
- publish Arabic translations before their reviewed source and translation workflow are ready;
- merge this working branch into `main`.

## Final pre-merge state

The truth-alignment implementation is complete on the working branch when all repository validation contracts pass on the final candidate. Merge remains a separate governed action and is intentionally deferred until explicit approval.
