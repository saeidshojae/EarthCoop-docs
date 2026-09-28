import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function text(file) { return readFile(path.join(root, file), 'utf8'); }

test('static shell is independent of Mintlify and exposes docs controls', async () => {
  const html = await text('site/index.html');
  assert.doesNotMatch(html, /mintlify|mint\.json|docs\.json/i);
  assert.match(html, /id="copy-document"/);
  assert.match(html, /id="print-document"/);
  assert.match(html, /id="download-document"/);
  assert.match(html, /id="table-of-contents"/);
  assert.match(html, /id="locale-switcher"/);
});

test('runtime router recognizes canonical hash document routes', async () => {
  const app = await import(pathToFileURL(path.join(root, 'site/app.js')));
  assert.deepEqual(app.parseRoute('#/documents/FC'), { name: 'document', id: 'FC' });
  assert.deepEqual(app.parseRoute('#/documents/ECON-REF-01'), { name: 'document', id: 'ECON-REF-01' });
  assert.deepEqual(app.parseRoute('#/unknown'), { name: 'not-found' });
});

test('locale setter applies real language and direction metadata', async () => {
  const app = await import(pathToFileURL(path.join(root, 'site/app.js')));
  const attrs = {};
  const fakeRoot = { setAttribute(name, value) { attrs[name] = value; } };
  app.applyLocale(fakeRoot, 'fa');
  assert.deepEqual(attrs, { lang: 'fa', dir: 'rtl' });
  app.applyLocale(fakeRoot, 'en');
  assert.deepEqual(attrs, { lang: 'en', dir: 'ltr' });
  app.applyLocale(fakeRoot, 'ar');
  assert.deepEqual(attrs, { lang: 'ar', dir: 'rtl' });
});

test('unavailable rendition is rendered explicitly instead of masquerading', async () => {
  const app = await import(pathToFileURL(path.join(root, 'site/app.js')));
  assert.equal(app.renditionMessage({ available: false, locale: 'en' }), 'ترجمه English برای این سند هنوز در دسترس نیست.');
});

test('search filters by active locale and body text', async () => {
  const search = await import(pathToFileURL(path.join(root, 'site/search.js')));
  const index = [
    { id: 'FC', locale: 'fa', title: 'سند مادر', body: 'عدالت و زمین' },
    { id: 'FC', locale: 'en', title: 'Foundational Covenant', body: 'justice and earth' },
  ];
  assert.deepEqual(search.searchDocuments(index, 'عدالت', 'fa').map((x) => x.locale), ['fa']);
  assert.deepEqual(search.searchDocuments(index, 'justice', 'en').map((x) => x.locale), ['en']);
  assert.equal(search.searchDocuments(index, 'justice', 'fa').length, 0);
});

test('download payload uses the currently displayed rendition', async () => {
  const app = await import(pathToFileURL(path.join(root, 'site/app.js')));
  const payload = app.makeDownloadPayload({ id: 'FC', title: 'سند مادر' }, 'fa', { source: 'published/foundational/FC-1.1.fa.md', text: 'متن فارسی' });
  assert.equal(payload.filename, 'FC-fa.md');
  assert.equal(payload.text, 'متن فارسی');
  assert.equal(payload.source, 'published/foundational/FC-1.1.fa.md');
});

test('runtime source does not inject raw document text with innerHTML', async () => {
  const app = await text('site/app.js');
  assert.doesNotMatch(app, /innerHTML\s*=\s*[^;]*(document|rendition|source|text)/i);
});

test('document renderer creates real TOC anchor targets without innerHTML', async () => {
  const app = await import(pathToFileURL(path.join(root, 'site/app.js')));
  const appended = [];
  const fakeDocument = {
    createElement(tagName) {
      return {
        tagName: tagName.toUpperCase(),
        className: '',
        textContent: '',
        dataset: {},
      };
    },
  };
  const fakeParent = {
    appendChild(node) { appended.push(node); },
  };

  app.renderSourceBlocks(
    fakeParent,
    '# سند مادر\n\nمتن آغازین\n\n## عدالت\n\nمتن عدالت',
    [
      { depth: 1, text: 'سند مادر', anchor: 'سند-مادر' },
      { depth: 2, text: 'عدالت', anchor: 'عدالت' },
    ],
    fakeDocument,
  );

  const headings = appended.filter((node) => /^H[1-6]$/.test(node.tagName));
  assert.deepEqual(headings.map((node) => [node.tagName, node.textContent, node.dataset.anchor]), [
    ['H1', 'سند مادر', 'سند-مادر'],
    ['H2', 'عدالت', 'عدالت'],
  ]);
  assert.ok(appended.some((node) => node.textContent.includes('متن آغازین')));
});

test('document renderer hides frontmatter and MDX wrappers and removes common inline Markdown syntax', async () => {
  const app = await import(pathToFileURL(path.join(root, 'site/app.js')));
  const appended = [];
  const fakeDocument = {
    createElement(tagName) {
      return { tagName: tagName.toUpperCase(), className: '', textContent: '', dataset: {} };
    },
  };
  const fakeParent = { appendChild(node) { appended.push(node); } };

  app.renderSourceBlocks(
    fakeParent,
    '---\ntitle: "Internal title"\ndescription: "hidden"\n---\n\n# سند مادر\n\n**شناسه سند:** FC\n\n<Note>\nمتن راهنما با [پیوند](https://example.com) و `کد`.\n</Note>\n\n---',
    [{ depth: 1, text: 'سند مادر', anchor: 'سند-مادر' }],
    fakeDocument,
  );

  const visible = appended.map((node) => node.textContent).join('\n');
  assert.doesNotMatch(visible, /Internal title|description:|<\/?Note>|\*\*|`/);
  assert.match(visible, /شناسه سند:\s*FC/);
  assert.match(visible, /متن راهنما با پیوند و کد/);
  assert.ok(appended.some((node) => node.tagName === 'HR'));
});
