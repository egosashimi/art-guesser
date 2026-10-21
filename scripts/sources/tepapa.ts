// Museum of New Zealand Te Papa Tongarewa — https://data.tepapa.govt.nz/docs/
// Used for its Pacific Cultures collection, the biggest gap in the other sources.
// Only objects whose image Te Papa marks as downloadable (CC BY-NC-ND or no known copyright
// restrictions) are used. Set TEPAPA_API_KEY (free registration) for production builds;
// without it we fall back to Te Papa's anonymous guest token.
import { categorize } from '../categorize.ts';
import { formatRange } from './met.ts';
import { clean, getJson, parseDateText, seededShuffle, type FetchOptions, type RawRecord } from './common.ts';

const API = 'https://data.tepapa.govt.nz/collection';

async function token(): Promise<Record<string, string>> {
  const key = process.env.TEPAPA_API_KEY;
  if (key) return { 'x-api-key': key };
  const res = await fetch(`${API}/search?q=x`, { headers: { Accept: 'application/json' } });
  const guest = ((await res.json()) as any).guestToken;
  return guest ? { Authorization: `Bearer ${guest}`, 'x-api-key': guest } : {};
}

export async function fetchTepapa(opts: FetchOptions): Promise<RawRecord[]> {
  const auth = await token();
  const seed = Number(new Date().toISOString().slice(0, 7).replace('-', ''));
  const search = async (from: number) => {
    const res = await fetch(`${API}/search`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'art-guesser-pool-builder' },
      body: JSON.stringify({
        query: '*',
        from,
        size: 100,
        filters: [
          { field: 'type', keyword: 'Object' },
          { field: 'collection', keyword: 'PacificCultures' },
          { field: 'hasRepresentation.rights.allowsDownload', keyword: 'true' },
        ],
      }),
    });
    await new Promise((r) => setTimeout(r, 400));
    return res.ok ? ((await res.json()) as any) : null;
  };

  const first = await search(0);
  const total: number = Math.min(first?._metadata?.resultset?.count ?? 0, 10000);
  opts.log(`tepapa: ${total} downloadable Pacific objects`);
  const out = new Map<string, RawRecord>();
  const add = (rows: any[] | undefined) => {
    for (const o of rows ?? []) {
      if (opts.skip?.has(String(o.id))) continue;
      const r = toRecord(o);
      if (r) out.set(r.srcId, r);
    }
  };
  add(first?.results);
  const offsets = seededShuffle(Array.from({ length: Math.floor(total / 100) }, (_, i) => (i + 1) * 100), seed);
  // Many records lack a date or place, so read ~4× the target.
  for (const from of offsets.slice(0, Math.ceil((opts.limit * 4) / 100))) {
    add((await search(from))?.results);
    if (out.size >= opts.limit) break;
  }
  return [...out.values()];
}

function toRecord(o: any): RawRecord | null {
  const rep = (o.hasRepresentation ?? []).find((r: any) => r.rights?.allowsDownload && r.previewUrl);
  if (!rep) return null;
  const prod = (o.production ?? []).find((p: any) => p.createdDate || p.facetCreatedDate) ?? o.production?.[0];
  if (!prod) return null;
  // facetCreatedDate.verbatim is the cleanest: "1800 / 1899", "01 Jan 1896 / 1907", "1875".
  const years = String(prod.facetCreatedDate?.verbatim ?? '').match(/-?\d{4}/g)?.map(Number);
  let range: [number, number] | null = years?.length ? [years[0], years[years.length - 1]] : null;
  range ??= parseDateText(prod.verbatimCreatedDate);
  if (!range) return null;
  const [y0, y1] = range;
  const place = typeof prod.spatial === 'string' ? prod.spatial : prod.spatial?.title;
  if (!place) return null;
  const nation = (prod.nation ?? prod.spatial?.nation ?? [])[0];
  const kind = (o.isTypeOf ?? []).map((t: any) => t.title).find(Boolean);
  const materials = (o.isMadeOf ?? []).map((m: any) => m.title).filter(Boolean).join(', ');
  const maker = typeof prod.contributor === 'string' ? prod.contributor : prod.contributor?.title;
  return {
    src: 'tepapa',
    srcId: String(o.id),
    title: clean(o.title) || 'Untitled',
    artist: maker && !/unknown/i.test(maker) ? clean(maker) : undefined,
    culture: undefined,
    placeParts: [clean(place).replace(/\s*\(.*\)$/, ''), clean(nation)].filter(Boolean),
    hints: [{ text: place, kind: 'specific' }, { text: nation, kind: 'country' }],
    date: clean(prod.verbatimCreatedDate) || formatRange(y0, y1),
    y0,
    y1,
    cat: categorize(kind, o.title, materials),
    medium: materials || undefined,
    kind: kind ? clean(kind) : undefined,
    img: rep.previewUrl,
    imgFull: rep.contentUrl,
    url: `https://collections.tepapa.govt.nz/object/${o.id}`,
    credit: [clean(o.creditLine), `Te Papa (${rep.rights?.title ?? 'licence varies'})`].filter(Boolean).join(' · '),
    hl: false,
  };
}
