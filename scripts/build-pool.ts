// Builds public/data/pool.json from museum open-access APIs.
//
//   node scripts/build-pool.ts                 # fetch all sources, geocode, write pool + raw cache
//   node scripts/build-pool.ts --from-cache    # re-geocode data/raw/*.json.gz without network
//   node scripts/build-pool.ts --sources met,aic --limit 3000
//
// The raw cache is committed so the gazetteer / filters can be tuned offline and so a failed
// source doesn't wipe out the pool (its previous cache is reused).
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createRequire } from 'node:module';
import { buildWorld } from '../src/geo/world.ts';
import { regionFor, BALANCE_GROUP_NAMES, type BalanceGroup } from '../src/geo/regions.ts';
import type { ArtObject, Pool, SourceId } from '../src/data/types.ts';
import { makeGeocoder } from './geocode.ts';
import { normalize } from './gazetteer.ts';
import type { RawRecord } from './sources/common.ts';
import { fetchMet } from './sources/met.ts';
import { fetchAic } from './sources/aic.ts';
import { fetchCma } from './sources/cma.ts';

const require = createRequire(import.meta.url);
const ROOT = new URL('..', import.meta.url).pathname;
const RAW_DIR = `${ROOT}data/raw`;
const OUT = `${ROOT}public/data/pool.json`;
const REPORT = `${ROOT}data/report.md`;

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string, dflt: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};

const FETCHERS: Record<SourceId, (o: { limit: number; log: (m: string) => void }) => Promise<RawRecord[]>> = {
  met: fetchMet,
  aic: fetchAic,
  cma: fetchCma,
};
const LIMITS: Record<SourceId, number> = { met: 4500, aic: 2500, cma: 3000 };

// ── Filters ──────────────────────────────────────────────────────────────────
const MIN_YEAR = -4000;
const MAX_YEAR = 1950;
const MAX_RADIUS_KM = 1300;
const MAX_PER_BUCKET = 80;
const EXCLUDE_KIND = /\b(photograph|negative|coin|token|weight|sherds?|shards?|ostracon|bead|beads|seal impression|sample|specimen|mount|frame|button|nail|tack|rivet|stopper|lid|cover fragment)\b/i;
const EXCLUDE_TITLE = /\b(fragment of a|sherd|shard)\b/i;

function maxSpan(y0: number, y1: number): number {
  const age = 2025 - (y0 + y1) / 2;
  return Math.max(150, age * 0.4);
}

async function main() {
  mkdirSync(RAW_DIR, { recursive: true });
  const sources = opt('sources', 'met,aic,cma').split(',') as SourceId[];
  const scale = Number(opt('scale', '1'));
  const fromCache = flag('from-cache');

  const raw: RawRecord[] = [];
  for (const src of sources) {
    const cacheFile = `${RAW_DIR}/${src}.json.gz`;
    let recs: RawRecord[] | null = null;
    if (!fromCache) {
      console.log(`\n▶ fetching ${src}`);
      try {
        recs = await FETCHERS[src]({ limit: Math.round(LIMITS[src] * scale), log: (m) => console.log('  ' + m) });
      } catch (e) {
        console.warn(`  ${src} failed: ${(e as Error).message}`);
      }
      if (recs && recs.length > 50) writeFileSync(cacheFile, gzipSync(JSON.stringify(recs)));
      else {
        console.warn(`  ${src}: only ${recs?.length ?? 0} records; falling back to cache`);
        recs = null;
      }
    }
    if (!recs && existsSync(cacheFile)) recs = JSON.parse(gunzipSync(readFileSync(cacheFile)).toString());
    console.log(`  ${src}: ${recs?.length ?? 0} raw records`);
    if (recs) raw.push(...recs);
  }

  const world = buildWorld(require('world-atlas/countries-50m.json'));
  const { geocode, lookup } = makeGeocoder(world);

  const rejected: Record<string, number> = {};
  const reject = (why: string) => (rejected[why] = (rejected[why] ?? 0) + 1);
  const unmatched = new Map<string, number>();

  const objects: ArtObject[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const id = `${r.src}:${r.srcId}`;
    if (seen.has(id)) continue;
    seen.add(id);
    if (r.y0 > r.y1) [r.y0, r.y1] = [r.y1, r.y0];
    if (r.y0 < MIN_YEAR || r.y1 > MAX_YEAR) { reject('date out of range'); continue; }
    if (r.y1 - r.y0 > maxSpan(r.y0, r.y1)) { reject('date too vague'); continue; }
    if (EXCLUDE_KIND.test(r.kind ?? '') || EXCLUDE_TITLE.test(r.title)) { reject('excluded object type'); continue; }
    if (/photograph/i.test(r.medium ?? '') && r.cat === 'paper') { reject('photograph'); continue; }

    const g = geocode(r.hints);
    if (!g) {
      reject('could not geocode');
      for (const h of r.hints) if (h.text && h.kind !== 'fallback') {
        const k = normalize(h.text);
        if (!lookup(h.text).length) unmatched.set(k, (unmatched.get(k) ?? 0) + 1);
      }
      continue;
    }
    if (g.r > MAX_RADIUS_KM) { reject('location too vague'); continue; }

    const placeParts = r.placeParts.length ? r.placeParts : [];
    const place = [...placeParts];
    if (!place.some((p) => normalize(p) === normalize(g.country))) place.push(g.country);
    objects.push({
      id,
      src: r.src,
      title: r.title,
      artist: r.artist,
      culture: r.culture,
      place: dedupeJoin(place),
      date: r.date,
      y0: r.y0,
      y1: r.y1,
      lat: round(g.lat, 3),
      lon: round(g.lon, 3),
      r: Math.round(g.r),
      country: g.country,
      cat: r.cat,
      medium: trim(r.medium, 160),
      kind: r.kind,
      img: r.img,
      imgFull: r.imgFull,
      url: r.url,
      credit: trim(r.credit, 160),
      ...(r.hl ? { hl: 1 as const } : {}),
      bucket: normalize(r.culture || g.matched).replace(/\([^)]*\)/g, '').trim(),
    });
  }

  // Cap over-represented buckets (keeps highlights first) and near-duplicate titles.
  const byBucket = new Map<string, ArtObject[]>();
  for (const o of objects) {
    const arr = byBucket.get(o.bucket) ?? [];
    arr.push(o);
    byBucket.set(o.bucket, arr);
  }
  const final: ArtObject[] = [];
  for (const arr of byBucket.values()) {
    arr.sort((a, b) => (b.hl ?? 0) - (a.hl ?? 0));
    const titles = new Map<string, number>();
    let kept = 0;
    for (const o of arr) {
      const t = normalize(o.title);
      const n = titles.get(t) ?? 0;
      if (n >= 2) { reject('duplicate title in bucket'); continue; }
      if (kept >= MAX_PER_BUCKET) { reject('bucket cap'); continue; }
      titles.set(t, n + 1);
      kept++;
      final.push(o);
    }
  }
  final.sort((a, b) => a.id.localeCompare(b.id));

  const pool: Pool = { version: 1, built: new Date().toISOString(), objects: final };
  mkdirSync(`${ROOT}public/data`, { recursive: true });
  writeFileSync(OUT, JSON.stringify(pool));
  writeFileSync(REPORT, report(final, rejected, unmatched, world));
  console.log(`\n✔ wrote ${final.length} objects to public/data/pool.json`);
  console.log(`  rejected: ${JSON.stringify(rejected)}`);
}

function report(objs: ArtObject[], rejected: Record<string, number>, unmatched: Map<string, number>, world: ReturnType<typeof buildWorld>): string {
  const count = (f: (o: ArtObject) => string) => {
    const m = new Map<string, number>();
    for (const o of objs) m.set(f(o), (m.get(f(o)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const table = (title: string, rows: [string, number][]) =>
    `### ${title}\n\n| | count | share |\n|---|---:|---:|\n` +
    rows.map(([k, v]) => `| ${k} | ${v} | ${((100 * v) / objs.length).toFixed(1)}% |`).join('\n') + '\n';
  const era = (o: ArtObject) => {
    const m = (o.y0 + o.y1) / 2;
    if (m < -1000) return 'a. before 1000 BCE';
    if (m < 0) return 'b. 1000–1 BCE';
    if (m < 500) return 'c. 1–500 CE';
    if (m < 1000) return 'd. 500–1000';
    if (m < 1500) return 'e. 1000–1500';
    if (m < 1800) return 'f. 1500–1800';
    return 'g. 1800–1950';
  };
  const group = (o: ArtObject) => BALANCE_GROUP_NAMES[(regionFor(o.lon, o.lat, o.country)?.group ?? 'europe') as BalanceGroup];
  const region = (o: ArtObject) => regionFor(o.lon, o.lat, o.country)?.name ?? '?';
  void world;
  return [
    `# Pool report\n\nBuilt ${new Date().toISOString()} — **${objs.length} objects**\n`,
    table('By source', count((o) => o.src)),
    table('By balance group', count(group)),
    table('By region', count(region)),
    table('By category', count((o) => o.cat)),
    table('By era', count(era).sort()),
    table('Precision (radius km)', count((o) => (o.r <= 60 ? '≤60 (city/site)' : o.r <= 200 ? '≤200 (district/people)' : o.r <= 500 ? '≤500 (region/country)' : '>500 (large country/area)'))),
    table('Top buckets', count((o) => o.bucket).slice(0, 40)),
    `### Rejected\n\n` + Object.entries(rejected).map(([k, v]) => `- ${k}: ${v}`).join('\n') + '\n',
    `### Most common unmatched place/culture strings (add to scripts/gazetteer.ts)\n\n` +
      [...unmatched.entries()].sort((a, b) => b[1] - a[1]).slice(0, 150).map(([k, v]) => `- \`${k}\` × ${v}`).join('\n') + '\n',
  ].join('\n');
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;
const trim = (s: string | undefined, n: number) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s);
function dedupeJoin(parts: string[]): string {
  const out: string[] = [];
  for (const p of parts) if (!out.some((q) => normalize(q) === normalize(p))) out.push(p);
  return out.join(', ');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
