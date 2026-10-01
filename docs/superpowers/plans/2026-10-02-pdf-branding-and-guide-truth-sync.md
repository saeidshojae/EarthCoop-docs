# PDF Branding and Guide Truth Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix official-v1 PDF identity/version presentation and replace the eight recovered Persian learning-path guides with user-facing, evidence-backed current content while preserving the approved learning order and recovered 0.8 UI.

**Architecture:** Keep the recovered 0.8 runtime as the visual shell. Add small fail-closed build patches that (1) normalize displayed document identity to the registered official-v1 metadata and add a print-only EarthCoop brand header using the runtime's existing `/assets/brand/earthcoop-logo.png`, and (2) maintain one governed Persian guide-content source that patches both direct static guide pages and SPA guide definitions. Production remains untouched; only Preview is eligible for deployment after validation.

**Tech Stack:** Node.js ES modules, node:test, recovered static HTML/JS/CSS build pipeline, headless Chromium PDF generation.

**Spec:** User-approved requirements in the 2026-10-02 guide/PDF audit conversation; official v1 registry at `releases/foundational/2026-10-01/document-registry.registered.json` and current EarthCoop product evidence.

## Global Constraints

- Keep learning order: `start → justice → property → digital-country → structure → groups → membership → elections`.
- Use `حکمرانی شراکتی`, not `جمهوری تعاونی`.
- User-facing group families: `عمومی`; `تخصصی` containing `علمی` and `صنفی`; `اختصاصی` containing `سنی` and `جنسیتی`.
- Present `کشور دیجیتال` / `شهروندی دیجیتال` as an educational metaphor and future vision, never as a claim of current sovereign/legal statehood.
- Explain Najm Hoda as `نرم‌افزار جامع مدیریت هوشمند دنیای ارثکوپ` and Najm Bahar as `نرم‌افزار جامع مدیریت بانکی هوشمند ارثکوپ`; introduce Najm as a family of comprehensive management systems that can grow over time.
- User guides must describe current user behavior, not internal migration history (`قبلاً...`, `legacy...`, obsolete reward history) unless strictly necessary to explain a current compatibility behavior.
- Invitation copy states only the current rule: successful invitation yields participation points under current configurable rules; no historical cash-reward narrative.
- Registration/location text must stop mandatory registration at the valid base-governance level; Street/Alley/Complex/Building remain optional local-address detail after registration.
- PDF logo must reuse the existing recovered runtime asset `/assets/brand/earthcoop-logo.png`; do not add or invent a second logo.
- PDF/site addresses must come from governed site configuration/canonical URLs, not scattered ad-hoc constants.
- Do not change official legal substance. Correct presentation metadata only where the registered official-v1 registry conflicts with embedded pre-v1 display metadata.
- No direct changes to `main`; branch + PR only. Production `docs.earthcoop.ir` is out of scope.

## Review Focus

- Direct `/guides/<route>/` and SPA/hash navigation must render the same audited guide content.
- Guide patch must fail closed if recovered app/static markers change.
- PDF print output must show the existing EarthCoop logo and official site address without leaking navigation chrome.
- Official-v1 documents must display `1.0` as the current registered version even when preserved source text contains `preV1SourceVersion` values such as `1.2/1.1/0.3`.
- Content claims about registration, groups, elections, Najm Hoda/Bahar and invitation rules must stay within evidenced current behavior or be explicitly labeled vision/rule rather than silently upgraded to implemented fact.

---

### Task 1: Lock RED contracts for PDF identity and branding

**Files:**
- Modify: `tests/recovered-foundational-downloads.test.mjs`
- Modify/Create: focused document-render test if needed.

**Interfaces:**
- Consumes: current registered package metadata (`record.currentVersion.version`, `record.code`) and recovered brand asset path.
- Produces: tested helper contract for print branding/official identity used by static document rendering/PDF generation.

- [ ] Add failing tests proving the printable document HTML contains `/assets/brand/earthcoop-logo.png`, the governed EarthCoop/docs address, and official `1.0` identity while not surfacing pre-v1 display values as current version.
- [ ] Run focused node tests and confirm failure is due to missing branding/normalization.
- [ ] Implement the smallest build-time helper and CSS/HTML patch necessary.
- [ ] Re-run focused tests to green.

### Task 2: Lock RED contracts for all eight audited Persian guides

**Files:**
- Create: `scripts/recovered-guide-content.fa.mjs`
- Create: `scripts/patch-recovered-guide-content.mjs`
- Create: `tests/recovered-guide-content.test.mjs`
- Modify: `scripts/render-recovered-static-documents.mjs`
- Modify: `scripts/build-recovered-docs-center.mjs` if build ordering requires it.

**Interfaces:**
- Consumes: recovered `app.js`, `src/content/pages.fa.js`, eight direct static guide HTML files, existing learning-path patch.
- Produces: one frozen route-keyed audited Persian guide content map and fail-closed patch functions for SPA + direct routes.

- [ ] Add failing tests for exact eight-route coverage, approved learning order, terminology, absence of `جمهوری تعاونی`, absence of invitation-development-history copy, country/citizenship metaphor caveat, Najm Hoda/Bahar expansions, base-governance location language, three user-facing group families, and current elections distinctions.
- [ ] Add integration fixture proving direct static and SPA output receive the same guide revision and preserve related cards + learning-path controls.
- [ ] Run focused node tests and confirm RED.
- [ ] Implement one central content source and fail-closed patcher; apply it before UI/learning-path polish.
- [ ] Re-run focused tests to green.

### Task 3: Repository-level verification and Preview-only delivery

**Files:**
- Modify tests only if verification exposes an obsolete contract that contradicts the approved requirements.

**Interfaces:**
- Consumes: Tasks 1-2 outputs.
- Produces: one PR candidate with no Production deployment changes.

- [ ] Run all repository `node --test` checks plus manifest/terminology/freshness/build/validate gates used by current CI.
- [ ] Inspect final built direct guide pages and at least FC/CH/CO printable document HTML for branding/version correctness.
- [ ] Build PDFs in CI and verify valid PDF generation; where artifact access permits, render sample PDFs and inspect logo/address/version visually.
- [ ] Open PR, review diff for scope creep, let full validation pass, then merge only after green evidence.
- [ ] Deploy Preview only and verify exact source SHA; Production remains untouched.
