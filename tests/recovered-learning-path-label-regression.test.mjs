import assert from 'node:assert/strict';
import test from 'node:test';

import { patchRecoveredLearningPathHtml, patchRecoveredLearningPathAppSource } from '../scripts/patch-recovered-learning-path.mjs';

const related = '<div class="section-title"><div><span class="eyebrow">ادامه مسیر</span><h2>مطالب مرتبط</h2></div></div><div class="related"><a href="/guides/elections/">انتخابات</a></div>';

test('static guide keeps only the functional continuation label and removes the duplicate related-section label', () => {
  const source = `<main><div class="article-body"><p>بدنه</p>${related}</div></main>`;
  const patched = patchRecoveredLearningPathHtml(source, 'membership');
  assert.equal((patched.match(/ادامه مسیر/g) ?? []).length, 1);
  assert.match(patched, /<h2>مطالب مرتبط<\/h2>/);
});

test('SPA article renderer removes the duplicate related-section continuation label', () => {
  const app = `function article(title, category, desc, state, body, related=[]) {\n  return {title,desc,render:()=>\`<div class="article-body">\${body}<div class="section-title"><div><span class="eyebrow">ادامه مسیر</span><h2>مطالب مرتبط</h2></div></div><div class="related">\${related.map(([t,r])=>\`<a href="#/\${r}">\${t}</a>\`).join('')}</div></div>\`};\n}`;
  const patched = patchRecoveredLearningPathAppSource(app);
  assert.doesNotMatch(patched, /<span class="eyebrow">ادامه مسیر<\/span><h2>مطالب مرتبط<\/h2>/);
  assert.match(patched, /<h2>مطالب مرتبط<\/h2>/);
});
