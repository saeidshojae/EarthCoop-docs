import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function workflow(name) {
  return readFile(path.join(process.cwd(), '.github/workflows', name), 'utf8');
}

test('production deploy is manual-only, confirmed, validated, separately credentialed and live-SHA verified', async () => {
  const source = await workflow('deploy-docs-production.yml');
  assert.match(source, /workflow_dispatch:/);
  assert.doesNotMatch(source, /\bpush:/);
  assert.doesNotMatch(source, /\bpull_request:/);
  assert.match(source, /confirmation:/);
  assert.match(source, /DEPLOY DOCS PRODUCTION/);
  assert.match(source, /source_ref:/);
  assert.match(source, /--target production/);
  assert.match(source, /--canonical-origin https:\/\/docs\.earthcoop\.ir/);
  assert.match(source, /validate-recovered-production-artifact\.mjs/);
  assert.match(source, /DOCS_PROD_FTP_SERVER/);
  assert.match(source, /DOCS_PROD_FTP_USERNAME/);
  assert.match(source, /DOCS_PROD_FTP_PASSWORD/);
  assert.match(source, /DOCS_PROD_FTP_SERVER_DIR/);
  assert.doesNotMatch(source, /secrets\.DOCS_FTP_/);
  assert.match(source, /protocol:\s*ftps/);
  assert.match(source, /security:\s*strict/);
  assert.match(source, /dangerous-clean-slate:\s*false/);
  assert.match(source, /docs-production-\$\{\{ env\.SOURCE_SHA \}\}/);
  assert.match(source, /include-hidden-files:\s*true/);
  assert.match(source, /https:\/\/docs\.earthcoop\.ir\/deployment-manifest\.json/);
  assert.match(source, /manifest\.sourceSha !== expectedSha/);
  assert.match(source, /manifest\.deploymentTarget !== 'production'/);
  assert.match(source, /manifest\.indexing !== 'enabled'/);
  assert.doesNotMatch(source, /cloudflare|route53|dns/i);
});

test('production rollback is manual-only and restores a retained artifact with exact SHA verification', async () => {
  const source = await workflow('rollback-docs-production.yml');
  assert.match(source, /workflow_dispatch:/);
  assert.doesNotMatch(source, /\bpush:/);
  assert.match(source, /ROLLBACK DOCS PRODUCTION/);
  assert.match(source, /artifact_id:/);
  assert.match(source, /expected_source_sha:/);
  assert.match(source, /actions\/artifacts\/\$\{\{ inputs\.artifact_id \}\}\/zip/);
  assert.match(source, /validate-recovered-production-artifact\.mjs/);
  assert.match(source, /DOCS_PROD_FTP_SERVER/);
  assert.match(source, /https:\/\/docs\.earthcoop\.ir\/deployment-manifest\.json/);
  assert.match(source, /manifest\.sourceSha !== expectedSha/);
  assert.doesNotMatch(source, /cloudflare|route53|dns/i);
});

test('production cutover runbook keeps deployment gated by owner approval and documents rollback and SEO follow-up', async () => {
  const source = await readFile(path.join(process.cwd(), 'docs/operations/docs-production-cutover-runbook.md'), 'utf8');
  assert.match(source, /تأیید صریح|explicit owner approval/i);
  assert.match(source, /Go\/No-Go|go\/no-go/i);
  assert.match(source, /rollback|بازگشت/i);
  assert.match(source, /Search Console/i);
  assert.match(source, /deployment-manifest\.json/);
  assert.match(source, /docs\.earthcoop\.ir/);
  assert.match(source, /هیچ.*DNS|no DNS/i);
});
