import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowPath = path.join(root, '.github/workflows/deploy-docs-preview.yml');
const validationWorkflowPath = path.join(root, '.github/workflows/validate-knowledge-content.yml');

async function workflow() { return readFile(workflowPath, 'utf8'); }
async function validationWorkflow() { return readFile(validationWorkflowPath, 'utf8'); }

test('deploy workflow triggers only from main push or controlled manual dispatch', async () => {
  const text = await workflow();
  assert.match(text, /push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(text, /workflow_dispatch:/);
  assert.doesNotMatch(text, /pull_request:/);
  assert.match(text, /github\.ref == 'refs\/heads\/main'/);
});

test('workflow uses minimal permissions and serialized non-cancelling preview concurrency', async () => {
  const text = await workflow();
  assert.match(text, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(text, /group:\s*docs-preview/);
  assert.match(text, /cancel-in-progress:\s*false/);
});

test('deploy workflow builds and validates recovered 0.8 runtime before artifact/deployment', async () => {
  const text = await workflow();
  const checkout = text.indexOf('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1');
  const tests = text.indexOf('node --test');
  const build = text.indexOf('node scripts/build-recovered-docs-center.mjs --out dist');
  const validate = text.indexOf('node scripts/validate-recovered-docs-center.mjs --out dist');
  const upload = text.indexOf('actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a');
  const deploy = text.indexOf('SamKirkland/FTP-Deploy-Action@110f9186c050f71550953127052e77650219c287');
  assert.ok(checkout >= 0 && checkout < tests && tests < build && build < validate && validate < upload && upload < deploy);
  assert.doesNotMatch(text, /node scripts\/build-docs-center\.mjs --out dist(?:\s|$)/);
  assert.doesNotMatch(text, /Validate recovered build identity[\s\S]*node - <<'NODE'/);
  assert.doesNotMatch(text, /download-artifact/i);
});

test('pull-request validation builds and validates the recovered candidate with the same validator', async () => {
  const text = await validationWorkflow();
  const build = text.indexOf('node scripts/build-recovered-docs-center.mjs --out dist-recovered');
  const validate = text.indexOf('node scripts/validate-recovered-docs-center.mjs --out dist-recovered');
  assert.ok(build >= 0 && validate > build);
});

test('recovered validator itself pins preview origin, Persian-only display and official 0.8 archive by default', async () => {
  const validator = await readFile(path.join(root, 'scripts/validate-recovered-docs-center.mjs'), 'utf8');
  assert.match(validator, /https:\/\/docs-preview\.earthcoop\.ir/);
  assert.match(validator, /JSON\.stringify\(manifest\.displayLocales\) !== JSON\.stringify\(\['fa'\]\)/);
  assert.match(validator, /expectedRuntimeArchiveSha = RECOVERED_08_ARCHIVE_SHA256/);
  assert.doesNotMatch(validator, /EXPECTED_ORIGIN\s*=\s*['"]https:\/\/docs\.earthcoop\.ir/);
});

test('artifact and deploy third-party actions are pinned to immutable full SHAs', async () => {
  const text = await workflow();
  assert.match(text, /actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/);
  assert.match(text, /SamKirkland\/FTP-Deploy-Action@110f9186c050f71550953127052e77650219c287/);
  for (const match of text.matchAll(/uses:\s*([^\s@]+)@([^\s#]+)/g)) {
    if (match[1].startsWith('./')) continue;
    assert.match(match[2], /^[0-9a-f]{40}$/i, `${match[1]} must be SHA pinned`);
  }
});

test('workflow preflights exact secret namespace and deploys recovered dist only over strict FTPS', async () => {
  const text = await workflow();
  for (const name of ['DOCS_FTP_SERVER', 'DOCS_FTP_USERNAME', 'DOCS_FTP_PASSWORD', 'DOCS_FTP_SERVER_DIR']) {
    assert.match(text, new RegExp(`secrets\\.${name}`));
  }
  assert.match(text, /protocol:\s*ftps/);
  assert.match(text, /security:\s*strict/);
  assert.match(text, /local-dir:\s*\.\/dist\//);
  assert.match(text, /server-dir:\s*\$\{\{\s*secrets\.DOCS_FTP_SERVER_DIR\s*\}\}/);
  assert.match(text, /dangerous-clean-slate:\s*false/);
  assert.doesNotMatch(text, /docs\.earthcoop\.ir/);
});

test('workflow uploads complete rollback artifact including hidden htaccess before deploy', async () => {
  const text = await workflow();
  const upload = text.indexOf('actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a');
  const deploy = text.indexOf('SamKirkland/FTP-Deploy-Action@110f9186c050f71550953127052e77650219c287');
  assert.ok(upload >= 0 && upload < deploy);
  assert.match(text, /path:\s*dist\//);
  assert.match(text, /include-hidden-files:\s*true/);
});

test('post-deploy smoke checks recovered baseline and exact live SHA on preview only', async () => {
  const text = await workflow();
  assert.match(text, /https:\/\/docs-preview\.earthcoop\.ir\/deployment-manifest\.json/);
  assert.match(text, /sourceSha/);
  assert.match(text, /runtimeBaseline/);
  assert.match(text, /earthcoop-knowledge-center-0\.8\.0/);
  assert.match(text, /GITHUB_SHA/);
  assert.match(text, /for attempt in \{1\.\.12\}/);
  assert.match(text, /Live preview verification failed/);
  assert.doesNotMatch(text, /https:\/\/docs\.earthcoop\.ir/);
});

test('operator runbook records recovered validation, exact preview root, recovery archive, secrets, backup and rollback', async () => {
  const runbook = await readFile(path.join(root, 'docs/operations/docs-preview-deployment.md'), 'utf8');
  assert.match(runbook, /docs-preview\.earthcoop\.ir/);
  assert.match(runbook, /\/home3\/btboeapy\/docs-preview\.earthcoop\.ir/);
  assert.match(runbook, /validate-recovered-docs-center\.mjs/);
  assert.match(runbook, /earthcoop-knowledge-center-0\.8\.0-cpanel\.tar\.gz/);
  assert.match(runbook, /e1c5938f381db7b7f0efeef527dd828c96e13adc9de5a913de624796c6ae0704/);
  assert.match(runbook, /preserv|republish/i);
  for (const name of ['DOCS_FTP_SERVER', 'DOCS_FTP_USERNAME', 'DOCS_FTP_PASSWORD', 'DOCS_FTP_SERVER_DIR']) {
    assert.match(runbook, new RegExp(name));
  }
  assert.match(runbook, /relative to the FTP account root/i);
  assert.match(runbook, /FTPS/i);
  assert.match(runbook, /backup/i);
  assert.match(runbook, /deployment-manifest\.json/);
  assert.match(runbook, /sourceSha/);
  assert.match(runbook, /runtimeBaseline/);
  assert.match(runbook, /rollback/i);
  assert.match(runbook, /revert/i);
  assert.match(runbook, /docs\.earthcoop\.ir/);
  assert.match(runbook, /out of scope/i);
});
