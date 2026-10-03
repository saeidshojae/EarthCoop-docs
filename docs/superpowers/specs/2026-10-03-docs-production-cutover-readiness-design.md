# EarthCoop Docs Production Cutover Readiness Design

## Purpose
Prepare the current recovered EarthCoop Knowledge Center for a safe future cutover from `docs-preview.earthcoop.ir` to `docs.earthcoop.ir` without changing Production or DNS during readiness work.

## Current baselines
- EarthCoop-docs: `main@317005aa62b237cd2ad49579293dc1ec9b70c39c`.
- EarthCoop application: `main@c5a934ab50f6ca6ead2490f6d6a0a4fc40a70475`.
- Preview deployment is healthy and verified by deployment manifest SHA.
- Current recovered build is intentionally Preview-only: Preview canonical origin, noindex headers/meta, non-indexable static routes, and Preview SEO mode.
- The main EarthCoop application still emits legacy `/#/documents/{id}` links and uses the retired `econ-ref-01-fa-0-1` reference id.

## Goal
Produce a reviewed, testable release path where the same governed content can generate either:
1. a Preview artifact that remains strictly non-indexable on `https://docs-preview.earthcoop.ir`, or
2. a Production artifact that is canonical/indexable only on `https://docs.earthcoop.ir`.

The future Production deployment must be manual, separately credentialed, SHA-verifiable, and reversible. No Production deployment, DNS update, or Search Console submission is part of readiness implementation without explicit owner approval.

## Deployment profiles
### Preview
- Origin: `https://docs-preview.earthcoop.ir`
- Indexing: disabled
- `robots`: noindex/no-follow behavior remains enforced both in HTML and HTTP headers
- SEO route generation runs in Preview mode
- Deployment may continue automatically from `main` as today

### Production
- Origin: `https://docs.earthcoop.ir`
- Indexing: enabled for routes already classified indexable by the governed route policy
- No Preview hostname may remain in canonical, OG, JSON-LD, sitemap, robots, site config, or deployment manifest
- Production `.htaccess` must not emit the Preview-wide `X-Robots-Tag: noindex, nofollow`
- Site remains HTTPS-only with the same security headers

## Cross-repository link contract
EarthCoop application links must use current stable paths:
- Center: `https://docs.earthcoop.ir/`
- Foundational index: `https://docs.earthcoop.ir/documents/`
- Publication policy: `https://docs.earthcoop.ir/documents/publication-policy/`
- Foundational documents: `https://docs.earthcoop.ir/documents/{stable-slug}/`
- ECON-REF-01: stable route id `econ-ref-01`, not `econ-ref-01-fa-0-1`

Legacy hash-route compatibility may remain in the recovered client router for old external bookmarks, but new links emitted by EarthCoop must not use hash routes.

## Production workflow safety
A Production workflow must:
- be `workflow_dispatch` only;
- require an explicit confirmation input matching a fixed phrase;
- build from a named SHA/ref and verify that SHA in the generated manifest;
- run the full repository tests and Production artifact validator before upload;
- use separate Production FTPS secrets/server directory from Preview;
- upload the exact candidate artifact to GitHub Actions for audit/rollback purposes;
- verify the live Production manifest after upload;
- never alter DNS.

A separate rollback action must be possible using a previously retained Production artifact; rollback must also verify the resulting live manifest/source SHA.

## Production artifact validation
The validator must fail when any of the following is true:
- Preview hostname appears in generated public metadata/config;
- global noindex remains enabled;
- canonical origin is not exactly `https://docs.earthcoop.ir`;
- sitemap/robots disagree with Production mode;
- deployment manifest does not declare Production target and indexing policy;
- current governed document routes, English guide routes, Search, Theme, language switching, PDF/download contracts, or role-guide runtime integrity regress.

## Cutover gate
Readiness is complete only when:
1. Preview profile regression suite is green.
2. Production artifact builds and validates without deployment.
3. Cross-repository EarthCoop link contract is updated and tested on a separate EarthCoop branch/PR.
4. Manual Production deploy + rollback workflows exist and are validation-green without executing a Production upload.
5. A runbook documents preflight, cutover, live smoke tests, rollback trigger, and post-cutover SEO/Search Console steps.

Only then may the owner explicitly authorize the first Production deployment.