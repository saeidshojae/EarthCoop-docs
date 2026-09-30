# EarthCoop independent Docs Center — preview deployment runbook

## Scope

This runbook covers the automated **preview-only** deployment of the independent EarthCoop Docs Center to:

- Hostname: `docs-preview.earthcoop.ir`
- Confirmed cPanel document root: `/home3/btboeapy/docs-preview.earthcoop.ir`

Changing DNS, replacing the current runtime at `docs.earthcoop.ir`, or promoting preview to production is **out of scope**. Production cutover requires a separate reviewed plan and explicit approval after preview UAT.

## What the workflow deploys

`.github/workflows/deploy-docs-preview.yml` checks out the approved `main` commit, reruns repository tests and validators, materializes the hash-pinned EarthCoop Knowledge Center 0.8 runtime, regenerates governed document data/static document pages from the repository's current consolidated foundational sources, writes `deployment-manifest.json`, stores `dist/` as a rollback artifact, and uploads **only `dist/`** over strict FTPS.

The restored runtime baseline is `earthcoop-knowledge-center-0.8.0`. Its recovery archive is:

- filename: `earthcoop-knowledge-center-0.8.0-cpanel.tar.gz`
- SHA-256: `e1c5938f381db7b7f0efeef527dd828c96e13adc9de5a913de624796c6ae0704`

The build verifies this SHA before extraction. After verification it **preserves and republishes** the exact archive inside `dist/` under the same filename. Therefore a successful preview deployment keeps the immutable recovery source available for the next build instead of deleting its own recovery baseline. If an operator supplies another source through `DOCS_CENTER_08_ARCHIVE`, it is accepted only when its bytes match the same pinned SHA-256.

The repository itself, `.git`, source Markdown/MDX outside generated indexes, secrets, and local environment files are not deployment payloads.

## Required GitHub Actions secrets

Configure these repository Actions secrets exactly:

- `DOCS_FTP_SERVER`
- `DOCS_FTP_USERNAME`
- `DOCS_FTP_PASSWORD`
- `DOCS_FTP_SERVER_DIR`

`DOCS_FTP_PORT` is optional only if the hosting provider requires a non-default FTPS port. The current workflow intentionally does not pass a custom port; add it only after the host requirement is confirmed and the workflow contract is updated/tested.

Never put the secret values in repository files, issues, PR comments, screenshots, workflow logs, or support messages.

## Deriving `DOCS_FTP_SERVER_DIR`

The known cPanel filesystem document root is:

`/home3/btboeapy/docs-preview.earthcoop.ir`

Do **not** automatically copy that absolute path into `DOCS_FTP_SERVER_DIR`. The FTP Deploy Action expects `server-dir` **relative to the FTP account root** and requires a trailing `/`.

Determine the value after logging in with the dedicated FTP account:

1. Open the FTP account in cPanel and note its configured home/directory.
2. Connect using an FTPS-capable client with the exact account that GitHub Actions will use.
3. Locate the directory that maps to `/home3/btboeapy/docs-preview.earthcoop.ir`.
4. Record the path as seen **relative to the FTP account root**.
5. Ensure the value ends in `/`.
6. Confirm the account cannot write to `docs.earthcoop.ir` or unrelated application directories when a narrower preview-only FTP account can be used.

If the dedicated FTP account is rooted directly at the preview document root, `DOCS_FTP_SERVER_DIR` may be `/`; verify this rather than assuming it.

## FTPS requirements

The deployment workflow uses:

- protocol: `ftps`
- security: `strict`
- destructive clean-slate deletion: disabled
- local payload: `./dist/`

Do not downgrade to plain FTP merely to make the first deployment succeed. If the host has a certificate, TLS, passive-mode, hostname, or port problem, fix or document the host configuration instead.

## One-time first-deploy preparation

Before the first automated merge/deployment:

1. Confirm `docs-preview.earthcoop.ir` still resolves to the intended cPanel account.
2. Confirm the cPanel document root is exactly `/home3/btboeapy/docs-preview.earthcoop.ir`.
3. Make a **backup** of the current preview directory before automation takes ownership of it. Use cPanel File Manager “Compress” or another host-supported backup mechanism and store the archive outside the preview document root.
4. Confirm the recovery archive `earthcoop-knowledge-center-0.8.0-cpanel.tar.gz` is currently reachable and its SHA-256 is the pinned value above. Do not replace it with a differently generated archive under the same name.
5. Record the backup filename/date and the currently visible preview behavior.
6. Create or restrict a dedicated FTP account to the preview directory when possible.
7. Verify FTPS login manually without publishing or deleting files outside the preview scope.
8. Add the four required GitHub Actions secrets.
9. Do not merge the deployment PR until all branch CI is green and the preview-only path has been verified.

## First automated deployment

The normal trigger is a push/merge to `main`. `workflow_dispatch` is also present for a controlled redeploy, but the job is guarded so it runs only when the selected ref is `main`.

The workflow order is intentionally fail-closed:

1. checkout approved source;
2. `node --test`;
3. existing manifest/terminology/translation validators;
4. download/read the approved 0.8 recovery archive and verify its pinned SHA-256;
5. build recovered `dist/`, including current governed foundational content and regenerated static document pages;
6. require `deployment-manifest.json` to report the exact workflow `sourceSha` and `runtimeBaseline = earthcoop-knowledge-center-0.8.0`;
7. preserve the verified 0.8 recovery archive inside `dist/` so the deployment republishes it;
8. upload the exact `dist/` as a GitHub Actions rollback artifact;
9. preflight required FTPS secrets without printing their values;
10. deploy `dist/` over strict FTPS;
11. fetch the live preview `deployment-manifest.json` with bounded retries;
12. require both its `sourceSha` to equal the workflow `GITHUB_SHA` and its `runtimeBaseline` to equal `earthcoop-knowledge-center-0.8.0`.

A workflow is not considered successfully deployed merely because the FTPS upload step finished. The live SHA + runtime-baseline check is the final deployment gate.

## Live verification after a green deploy

Open the preview and verify at minimum:

- `https://docs-preview.earthcoop.ir/`
- a direct document route such as `/documents/fc/` and the application's document navigation;
- Persian RTL rendering;
- no legacy Mintlify `ar/` content is presented as a real Arabic translation;
- English is shown only where a genuine registered English rendition is actually available;
- full-text search finds current document body text, not only titles;
- table of contents and document navigation;
- visible version/status values match governed repository metadata;
- copy, print, and download controls;
- mobile layout;
- missing route/not-found behavior;
- refresh/direct load of generated static document pages.

Then fetch:

`https://docs-preview.earthcoop.ir/deployment-manifest.json`

and verify:

- `sourceSha` equals the deployed `main` commit SHA;
- `runtimeBaseline` equals `earthcoop-knowledge-center-0.8.0`;
- `runtimeArchiveSha256` equals `e1c5938f381db7b7f0efeef527dd828c96e13adc9de5a913de624796c6ae0704`.

The workflow performs the first two checks automatically; the manual check is useful during first-deploy UAT.

## Rollback

### Preferred rollback: governed revert

If a deployed `main` commit is defective but Git history is healthy:

1. identify the last known good commit and the bad change;
2. prepare a normal Git **revert** (preferably through a reviewed PR) instead of rewriting/resetting shared history;
3. merge the revert to `main`;
4. allow the preview deployment workflow to rebuild from the reverted governed source;
5. verify the live `deployment-manifest.json` `sourceSha` equals the new revert commit SHA and the `runtimeBaseline` is still `earthcoop-knowledge-center-0.8.0`;
6. repeat preview UAT.

This keeps repository history auditable and makes the deployed artifact reproducible from `main` plus the pinned recovery baseline.

### Emergency restore from retained artifact/backup

Every successful build reaches the artifact-upload step before FTPS deploy and is stored as `docs-preview-<commit-sha>` for the configured retention period. The pre-automation cPanel backup is an additional first-deploy safety net. The deployed `earthcoop-knowledge-center-0.8.0-cpanel.tar.gz` is also a hash-pinned runtime recovery source; it is not a replacement for a full rollback artifact containing the governed generated content for a particular commit.

If the live preview is unusable and a normal revert cannot restore service quickly enough, an authorized operator may restore the last known good retained `dist/` artifact or the pre-automation backup **to the preview document root only**. After emergency recovery, follow with a governed Git revert/fix so the repository and preview return to a reproducible state.

Never use rollback as a reason to rewrite registered document history or alter `releases/foundational/**` snapshots.

## Failure triage

- **Recovery archive download/hash failure:** no generated deployment is valid. Restore/provide the exact approved archive bytes and verify the pinned SHA; never silently accept a new archive under the old version name.
- **Validation/build failure:** no upload should occur. Fix on a branch with a regression test.
- **Missing secret:** preflight fails before FTPS. Configure the missing Actions secret; do not hardcode it.
- **FTPS authentication/TLS failure:** verify host, account scope, TLS support, certificate and provider requirements. Do not switch to plaintext FTP.
- **Wrong server directory:** stop and correct `DOCS_FTP_SERVER_DIR`; never experiment against production paths.
- **FTPS succeeds but live SHA/baseline is old or wrong:** treat deployment as failed. Check cache/CDN behavior, server directory mapping and whether the uploaded `deployment-manifest.json` is the file served by the preview hostname.
- **Unexpected production impact:** stop preview deployment work. `docs.earthcoop.ir` is out of scope and must not be changed under this plan.
