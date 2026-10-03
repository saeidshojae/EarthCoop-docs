import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { patchRecoveredBilingualLanguageHtml } from '../scripts/render-recovered-static-documents.mjs';
import { applyRecoveredEnglishProductGuides } from '../scripts/recovered-english-product-guides.mjs';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function navigation(url, locale) {
  const handlers = {};
  const options = Object.fromEntries(['fa','en'].map(lang => [lang, { href:'/', innerHTML:'', setAttribute(k,v){this[k]=v;} }]));
  const switcher = { open:true, contains(target){return target === options.en;}, querySelector(){return {focus(){}};} };
  const menu = { querySelector(selector){return options[selector.includes('"fa"')?'fa':'en'];} };
  const links = [{href:'/en/account/profile/',getAttribute(){return this.href;}}];
  const document = { documentElement:{lang:locale}, querySelectorAll(){return links;}, querySelector(selector){return selector === '.language-switcher' ? switcher : selector === '.language-menu' ? menu : null;}, addEventListener(type,fn){handlers[type]=fn;} };
  const html = patchRecoveredBilingualLanguageHtml('<html><body></body></html>');
  const source = html.match(/<script id="ec-language-navigation">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, 'language navigation must be initialized');
  vm.runInNewContext(source,{document,window:{location:new URL(url)},URL,URLSearchParams});
  return {options,switcher,handlers,links};
}

test('language roundtrip returns to the original Persian page and fragment',()=>{
  const fa = navigation('https://docs-preview.earthcoop.ir/guides/groups/#families','fa');
  const enUrl = new URL(fa.options.en.href,'https://docs-preview.earthcoop.ir');
  assert.equal(enUrl.pathname,'/en/groups/overview/');
  const en = navigation(enUrl.href,'en');
  assert.equal(en.options.fa.href,'/guides/groups/#families');
});

test('untranslated pages open the English collection with an explicit return destination',()=>{
  const fa = navigation('https://docs-preview.earthcoop.ir/documents/fc/#provision-1','fa');
  const url = new URL(fa.options.en.href,'https://docs-preview.earthcoop.ir');
  assert.equal(url.pathname,'/en/');
  assert.equal(navigation(url.href,'en').options.fa.href,'/documents/fc/#provision-1');
  assert.match(fa.options.en.innerHTML,/راهنماهای انگلیسی/);
});

test('outside pointer, click, focus and Escape dismiss the language menu',()=>{
  const state = navigation('https://docs-preview.earthcoop.ir/','fa');
  for(const type of ['pointerdown','click','focusin']) {
    state.switcher.open=true;
    state.handlers[type]({target:state.options.en});
    assert.equal(state.switcher.open,true);
    state.handlers[type]({target:{}});
    assert.equal(state.switcher.open,false);
  }
  state.switcher.open=true;
  state.handlers.keydown({key:'Escape'});
  assert.equal(state.switcher.open,false);
});

test('return destinations cannot change origin or point back into English',()=>{
  for(const target of ['https://evil.example/','//evil.example/','/en/','/missing/']) {
    const state = navigation('https://docs-preview.earthcoop.ir/en/groups/overview/?returnTo='+encodeURIComponent(target),'en');
    assert.equal(state.options.fa.href,'/guides/groups/');
  }
});

test('English navigation retains the Persian return page when browsing the collection',()=>{
  const state = navigation('https://docs-preview.earthcoop.ir/en/?returnTo='+encodeURIComponent('/documents/fc/#provision-1'),'en');
  const next = new URL(state.links[0].href,'https://docs-preview.earthcoop.ir');
  assert.equal(next.pathname,'/en/account/profile/');
  assert.equal(navigation(next.href,'en').options.fa.href,'/documents/fc/#provision-1');
});

test('English shell on a Persian-only route returns to that same route instead of the home page',()=>{
  const state = navigation('https://docs-preview.earthcoop.ir/documents/','en');
  assert.equal(state.options.fa.href,'/documents/');
});

test('English generated pages retain their English article when the shared router runs', async()=>{
  const rootDir=await mkdtemp(path.join(os.tmpdir(),'ec-language-source-'));
  const outDir=await mkdtemp(path.join(os.tmpdir(),'ec-language-out-'));
  await writeFile(path.join(rootDir,'index.mdx'),'---\ntitle: "English content"\n---\nReal English body.');
  await mkdir(path.join(outDir,'guides/start'),{recursive:true});
  await writeFile(path.join(outDir,'guides/start/index.html'),'<html lang="fa"><head></head><body><main id="app">فارسی</main></body></html>');
  await writeFile(path.join(outDir,'app.js'),`function render(){window.rendered='فارسی';} render();`);
  await applyRecoveredEnglishProductGuides({rootDir,outDir,sourcePaths:['index.mdx']});
  const html=await readFile(path.join(outDir,'en/index.html'),'utf8');
  assert.match(html,/Real English body/);
  const window={location:{pathname:'/en/',hash:'',replace(){}},addEventListener(){}};
  vm.runInNewContext(await readFile(path.join(outDir,'app.js'),'utf8'),{window,document:{documentElement:{lang:'en'}}});
  assert.equal(window.rendered,undefined,'Persian router must not overwrite the static English article');
});
