import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  LEARNING_PATH,
  applyRecoveredLearningPath,
  learningPathNeighbors,
  patchRecoveredLearningPathAppSource,
  patchRecoveredLearningPathHtml,
  renderLearningPathNavigation,
} from '../scripts/patch-recovered-learning-path.mjs';

const ROUTES = ['start', 'justice', 'property', 'digital-country', 'structure', 'groups', 'membership', 'elections'];
const RELATED = '<div class="section-title"><div><span class="eyebrow">ادامه مسیر</span><h2>مطالب مرتبط</h2></div></div><div class="related"><a href="/guides/structure/"><span>مطالعه بعدی</span><strong>از کوچه تا سیاره ←</strong></a></div>';
const APP_SOURCE = `function article(title, category, desc, state, body, related=[]) {
  return {title,desc,render:()=>\`<div class="article-body">\${body}<div class="section-title"><div><span class="eyebrow">ادامه مسیر</span><h2>مطالب مرتبط</h2></div></div><div class="related">\${related.map(([t,r])=>\`<a href="#/\${r}">\${t}</a>\`).join('')}</div></div>\`};
}`;

test('learning path has one canonical ordered route list', () => {
  assert.deepEqual(LEARNING_PATH.map((item) => item.route), ROUTES);
});

test('learning path neighbors are deterministic for first, middle and final pages', () => {
  assert.deepEqual(learningPathNeighbors('start'), {
    previous: null,
    current: LEARNING_PATH[0],
    next: LEARNING_PATH[1],
  });
  assert.equal(learningPathNeighbors('property').previous.route, 'justice');
  assert.equal(learningPathNeighbors('property').next.route, 'digital-country');
  assert.equal(learningPathNeighbors('elections').previous.route, 'membership');
  assert.equal(learningPathNeighbors('elections').next, null);
});

test('first page exposes a prominent clickable continuation to exactly the next route', () => {
  const html = renderLearningPathNavigation('start', { mode: 'static' });
  assert.match(html, /class="learning-path-next/);
  assert.match(html, /href="\/guides\/justice\/"/);
  assert.match(html, /ادامه مسیر/);
  assert.match(html, /عدالت و حق زمین/);
  assert.doesNotMatch(html, /learning-path-previous/);
});

test('middle page exposes previous and next controls without replacing related content', () => {
  const html = renderLearningPathNavigation('property', { mode: 'static' });
  assert.match(html, /class="learning-path-previous/);
  assert.match(html, /href="\/guides\/justice\/"/);
  assert.match(html, /href="\/guides\/digital-country\/"/);
  assert.match(html, /قبلی/);
  assert.match(html, /بعدی/);
  assert.match(html, /ادامه مسیر/);
});

test('final page exposes previous navigation and a path-complete state without inventing a next route', () => {
  const html = renderLearningPathNavigation('elections', { mode: 'static' });
  assert.match(html, /href="\/guides\/membership\/"/);
  assert.match(html, /پایان مسیر/);
  assert.doesNotMatch(html, /learning-path-next/);
});

test('static guide patch inserts path navigation before related content and preserves related cards verbatim', () => {
  const source = `<main><div class="article-body"><p>بدنه صفحه</p>${RELATED}</div></main>`;
  const patched = patchRecoveredLearningPathHtml(source, 'start');
  assert.match(patched, /learning-path-navigation/);
  assert.ok(patched.indexOf('learning-path-navigation') < patched.indexOf('مطالب مرتبط'));
  assert.match(patched, /href="\/guides\/justice\/"/);
  assert.ok(patched.includes(RELATED));
});

test('SPA patch keeps learning-path navigation on direct /guides/... URLs after client rerender', () => {
  const patched = patchRecoveredLearningPathAppSource(APP_SOURCE);
  assert.match(patched, /function resolveLearningPathRoute\(\)/);
  assert.match(patched, /location\.pathname\.match\(\/\\\/guides\\\/\(\[\^\\\/?#\]\+\)\\\/?\$\//);
  assert.match(patched, /location\.hash\.match/);
  assert.match(patched, /learningPathNavigation/);
  assert.match(patched, /مطالب مرتبط/);
  assert.match(patched, /related\.map/);
});

test('build integration patches all eight direct guide routes plus SPA and styles from one canonical path', async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-learning-path-'));
  for (const route of ROUTES) {
    const guideDir = path.join(outDir, 'guides', route);
    await mkdir(guideDir, { recursive: true });
    await writeFile(path.join(guideDir, 'index.html'), `<main><div class="article-body"><p>body-${route}</p>${RELATED}</div></main>`);
  }
  await writeFile(path.join(outDir, 'app.js'), APP_SOURCE);
  await writeFile(path.join(outDir, 'styles.css'), '.article-body{display:block}\n');

  await applyRecoveredLearningPath({ outDir });

  const start = await readFile(path.join(outDir, 'guides/start/index.html'), 'utf8');
  const justice = await readFile(path.join(outDir, 'guides/justice/index.html'), 'utf8');
  const elections = await readFile(path.join(outDir, 'guides/elections/index.html'), 'utf8');
  const app = await readFile(path.join(outDir, 'app.js'), 'utf8');
  const styles = await readFile(path.join(outDir, 'styles.css'), 'utf8');

  assert.match(start, /href="\/guides\/justice\/"/);
  assert.doesNotMatch(start, /learning-path-previous/);
  assert.match(justice, /href="\/guides\/start\/"/);
  assert.match(justice, /href="\/guides\/property\/"/);
  assert.match(elections, /href="\/guides\/membership\/"/);
  assert.match(elections, /پایان مسیر/);
  assert.match(app, /function resolveLearningPathRoute\(\)/);
  assert.match(app, /location\.pathname/);
  assert.match(app, /href="#\/\$\{next\.route\}"/);
  assert.match(styles, /Recovered learning path navigation/);
  for (const route of ROUTES) {
    const page = await readFile(path.join(outDir, 'guides', route, 'index.html'), 'utf8');
    assert.match(page, new RegExp(`data-learning-path-route="${route}"`));
    assert.ok(page.includes(RELATED), `related cards changed for ${route}`);
  }
});
