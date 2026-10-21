// One-off: Te Papa date fields + end-to-end smoke test of the V&A and Rijksmuseum fetchers.
import { createRequire } from 'node:module';
import { fetchVam } from './sources/vam.ts';
import { fetchRijks } from './sources/rijks.ts';
import { buildWorld } from '../src/geo/world.ts';
import { makeGeocoder } from './geocode.ts';
const require = createRequire(import.meta.url);
const show = (label: string, v: unknown, n = 3000) => console.log(`\n=== ${label}\n${String(JSON.stringify(v) ?? 'undefined').slice(0, n)}`);

const { geocode } = makeGeocoder(buildWorld(require('world-atlas/countries-50m.json')));
for (const [name, f] of [['vam', fetchVam], ['rijks', fetchRijks]] as const) {
  const recs = await f({ limit: 60, log: (m) => console.log('  ' + m) });
  console.log(`\n### ${name}: ${recs.length} records`);
  for (const r of recs.slice(0, 12)) {
    const g = geocode(r.hints);
    console.log(`- ${r.title} | ${r.kind} | ${r.cat} | ${r.date} [${r.y0},${r.y1}] | ${r.placeParts.join('; ')} -> ${g ? `${g.country} r${g.r}` : 'NO GEO'} | ${r.img}`);
  }
}

const t = await (await fetch('https://data.tepapa.govt.nz/collection/search?q=x')).json();
const h = { Authorization: `Bearer ${t.guestToken}`, 'x-api-key': t.guestToken, 'Content-Type': 'application/json', Accept: 'application/json' };
const body = { query: 'siapo OR tiputa OR tanoa OR club OR adze', from: 0, size: 20, filters: [{ field: 'type', keyword: 'Object' }, { field: 'collection', keyword: 'PacificCultures' }, { field: 'hasRepresentation.rights.allowsDownload', keyword: 'true' }] };
const r = await (await fetch('https://data.tepapa.govt.nz/collection/search', { method: 'POST', headers: h, body: JSON.stringify(body) })).json();
show('tepapa total', r._metadata, 500);
for (const o of r.results ?? []) {
  console.log(JSON.stringify({ id: o.id, title: o.title, objectType: o.objectType, type: o.type, production: (o.production ?? []).map((p: any) => ({ ...p, spatial: p.spatial?.title, nation: p.spatial?.nation, contributor: p.contributor?.title })), rights: o.hasRepresentation?.[0]?.rights?.title, preview: o.hasRepresentation?.[0]?.previewUrl, keys: Object.keys(o) }).slice(0, 900));
}
