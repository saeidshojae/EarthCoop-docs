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
  const html = patchRecoveredBilingualLanguageHtml('<html><head></head><body></body></html>');
  const source = html.match(/<script id="ec-language-navigation">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, 'language navigation must be initialized');
  vm.runInNewContext(source,{document,window:{location:new URL(url)},URL,URLSearchParams});
  return {options,switcher,handlers,links};
}

function bilingualShell(url, locale) {
  const current = { textContent:'FA' };
  const nav = { innerHTML:'FA NAV', setAttribute(){} };
  const menu = { querySelector(){return null;} };
  const document = {
    documentElement:{lang:locale,dir:'rtl'},
    querySelector(selector){
      if(selector === '.language-menu') return menu;
      if(selector === '.language-current') return current;
      if(selector === '#mainNav') return nav;
      return null;
    },
  };
  const html = patchRecoveredBilingualLanguageHtml('<html lang="fa" dir="rtl"><head></head><body></body></html>');
  const source = html.match(/<script id="ec-bilingual-language-switcher">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, 'bilingual shell script must be initialized');
  vm.runInNewContext(source,{document,window:{location:new URL(url)}});
  return {current,nav,document,html};
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

test('Persian routes ignore a browser-translated html lang when wiring the language menu',()=>{
  const state = navigation('https://docs-preview.earthcoop.ir/documents/','en');
  const enUrl = new URL(state.options.en.href,'https://docs-preview.earthcoop.ir');
  assert.equal(enUrl.pathname,'/en/');
  assert.equal(enUrl.searchParams.get('returnTo'),'/documents/');
  assert.match(state.options.en.innerHTML,/راهنماهای انگلیسی/);
});

test('Persian shell ignores translated html lang and keeps Persian chrome',()=>{
  const state = bilingualShell('https://docs-preview.earthcoop.ir/documents/fc/','en');
  assert.equal(state.current.textContent,'FA');
  assert.equal(state.nav.innerHTML,'FA NAV');
  assert.equal(state.document.documentElement.dir,'rtl');
});

test('bilingual static pages opt out of automatic browser translation',()=>{
  const html = patchRecoveredBilingualLanguageHtml('<html lang="fa"><head></head><body></body></html>');
  assert.match(html,/<meta\s+name="google"\s+content="notranslate"\s*\/?>/i);
  assert.match(html,/<html[^>]*\btranslate="no"/i);
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
  vm.runInNewContext(await readFile(path.join(outDir,'app.js'),'utf8'),{window,document:{documentElement:{lang:'fa'}}});
  assert.equal(window.rendered,undefined,'Persian router must not overwrite the static English article even if a translator changes html lang');
});

test('Persian runtime still renders when a browser translator changes html lang to English', async()=>{
  const rootDir=await mkdtemp(path.join(os.tmpdir(),'ec-language-source-'));
  const outDir=await mkdtemp(path.join(os.tmpdir(),'ec-language-out-'));
  await writeFile(path.join(rootDir,'index.mdx'),'---\ntitle: "English content"\n---\nReal English body.');
  await mkdir(path.join(outDir,'guides/start'),{recursive:true});
  await writeFile(path.join(outDir,'guides/start/index.html'),'<html lang="fa"><head></head><body><main id="app">فارسی</main></body></html>');
  await writeFile(path.join(outDir,'app.js'),`function render(){window.rendered=(window.rendered||0)+1;} render();`);
  await applyRecoveredEnglishProductGuides({rootDir,outDir,sourcePaths:['index.mdx']});
  const window={location:{pathname:'/documents/',hash:'',replace(){}},addEventListener(){}};
  vm.runInNewContext(await readFile(path.join(outDir,'app.js'),'utf8'),{window,document:{documentElement:{lang:'en'}}});
  assert.equal(window.rendered,1,'Persian route must keep the shared runtime active so search, theme and navigation can initialize');
});
