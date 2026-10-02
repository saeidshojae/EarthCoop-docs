import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROUTE = 'economy-cycle';
const ROUTE_PATH = '/guides/economy-cycle/';

export function patchRecoveredEconomyPageRecords(source) {
  const input = String(source);
  if (input.includes("inventoryId:'page.economy-cycle'")) return input;
  const needle = "  { inventoryId:'page.elections', route:'elections'";
  if (!input.includes(needle)) throw new Error('Recovered economy page-record insertion point changed');
  const record = `  { inventoryId:'page.economy-cycle', route:'economy-cycle', title:"اقتصاد EarthCoop و چرخه بهار", description:"بهار و گل، اعتبار اولیه و چرخه اقتصادی EarthCoop از عضویت تا پروژه، کار و بازار.", contentClass:'guide', status:'unofficial_explanation', source:"قانون اقتصاد EarthCoop و قواعد جاری زیست‌بوم", sourceType:'editorial', authority:'تحریریه مرکز دانش بر پایه اسناد رسمی', version:'1.0.0', reviewedAt:'2026-10-02' },\n`;
  return input.replace(needle, `${record}${needle}`);
}

function patchRouteMap(source, label) {
  const input = String(source);
  if (input.includes(`'${ROUTE}':'${ROUTE_PATH}'`)) return input;
  const needle = "    membership:'/guides/membership/', elections:'/guides/elections/'";
  if (!input.includes(needle)) throw new Error(`Recovered economy ${label} insertion point changed`);
  return input.replace(
    needle,
    `    membership:'/guides/membership/', '${ROUTE}':'${ROUTE_PATH}', elections:'/guides/elections/'`,
  );
}

export function patchRecoveredEconomySeoRoutesSource(source) {
  return patchRouteMap(source, 'SEO route');
}

export function patchRecoveredEconomyStaticPageSource(source) {
  return patchRouteMap(source, 'static-page route');
}

export async function applyRecoveredEconomyRouteRegistration({ outDir }) {
  const pageRecordsPath = path.join(outDir, 'src/content/pages.fa.js');
  const seoRoutesPath = path.join(outDir, 'src/content/seo-routes.js');
  const staticPagePath = path.join(outDir, 'src/render/static-page.js');

  await writeFile(pageRecordsPath, patchRecoveredEconomyPageRecords(await readFile(pageRecordsPath, 'utf8')));
  await writeFile(seoRoutesPath, patchRecoveredEconomySeoRoutesSource(await readFile(seoRoutesPath, 'utf8')));
  await writeFile(staticPagePath, patchRecoveredEconomyStaticPageSource(await readFile(staticPagePath, 'utf8')));
}
