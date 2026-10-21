// Victoria and Albert Museum (London) API v2 — https://developers.vam.ac.uk/
// No key. Data is clean (structured earliest/latest dates, place of origin). Images are
// "© Victoria and Albert Museum, London", free for non-commercial use (not CC0).
import { categorize } from '../categorize.ts';
import { formatRange } from './met.ts';
import { clean, getJson, pool, seededShuffle, type FetchOptions, type RawRecord } from './common.ts';

const API = 'https://api.vam.ac.uk/v2';

// The V&A is strongest on Asia, the Islamic world and European decorative arts. Searching by
// place of origin lets us lean on its non-European holdings instead of English teaspoons.
const PLACES: [string, number][] = [
  ['China', 0.08], ['Japan', 0.08], ['Korea', 0.03], ['India', 0.1], ['Pakistan', 0.02], ['Sri Lanka', 0.015],
  ['Nepal', 0.015], ['Tibet', 0.02], ['Burma', 0.015], ['Thailand', 0.015], ['Indonesia', 0.02], ['Iran', 0.06],
  ['Turkey', 0.04], ['Syria', 0.02], ['Egypt', 0.04], ['Morocco', 0.015], ['Uzbekistan', 0.015], ['Afghanistan', 0.01],
  ['Iraq', 0.01], ['Nigeria', 0.01], ['Ghana', 0.01], ['Ethiopia', 0.01], ['Mexico', 0.015], ['Peru', 0.015],
  ['Guatemala', 0.01], ['Italy', 0.07], ['France', 0.06], ['Spain', 0.04], ['Germany', 0.04], ['Netherlands', 0.03],
  ['England', 0.05], ['Russia', 0.015], ['Greece', 0.015], ['Byzantium', 0.01],
];

interface Hit {
  systemNumber: string;
  _primaryPlace?: string;
  _images?: { _iiif_image_base_url?: string };
}

async function search(params: string, page: number) {
  return getJson<{ info: { record_count: number; pages: number }; records: Hit[] }>(
    `${API}/objects/search?${params}&images_exist=1&year_made_to=1950&page_size=100&page=${page}`,
    { delayMs: 300 },
  );
}

export async function fetchVam(opts: FetchOptions): Promise<RawRecord[]> {
  const seed = Number(new Date().toISOString().slice(0, 7).replace('-', ''));
  const chosen = new Map<string, Hit>();

  for (const [place, share] of PLACES) {
    const want = Math.round(opts.limit * share);
    // q_place_name filters on place of origin; fall back to full-text if the filter is ignored.
    let params = `q_place_name=${encodeURIComponent(place)}`;
    let first = await search(params, 1);
    if (!first?.records?.length) {
      params = `q=${encodeURIComponent(place)}`;
      first = await search(params, 1);
    }
    if (!first?.records?.length) continue;
    const pages = Math.min(first.info.pages, 10);
    const hits = [...first.records];
    for (const p of seededShuffle(Array.from({ length: pages - 1 }, (_, i) => i + 2), seed).slice(0, Math.ceil((want * 2) / 100))) {
      hits.push(...((await search(params, p))?.records ?? []));
    }
    let n = 0;
    for (const h of seededShuffle(hits, seed)) {
      if (n >= want * 2) break;
      if (opts.skip?.has(h.systemNumber) || chosen.has(h.systemNumber)) continue;
      chosen.set(h.systemNumber, h);
      n++;
    }
    opts.log(`vam: ${place}: ${first.info.record_count} candidates, taking ${n}`);
  }

  const ids = [...chosen.keys()];
  opts.log(`vam: fetching ${ids.length} object records…`);
  let done = 0;
  const out = await pool(ids, 3, async (id) => {
    const r = await getJson<any>(`${API}/object/${id}`, { delayMs: 200 });
    if (++done % 250 === 0) opts.log(`vam: ${done}/${ids.length}`);
    return r ? toRecord(r, chosen.get(id)!) : null;
  });
  return out.filter((r): r is RawRecord => r !== null);
}

function year(iso: unknown): number | null {
  const m = typeof iso === 'string' ? iso.match(/^(-?\d{1,4})/) : null;
  return m ? Number(m[1]) : null;
}

function toRecord(json: any, hit: Hit): RawRecord | null {
  const r = json.record;
  if (!r) return null;
  const pd = (r.productionDates ?? [])[0]?.date;
  const y0 = year(pd?.earliest);
  const y1 = year(pd?.latest);
  if (y0 === null || y1 === null) return null;
  const imageId = r.images?.[0];
  const base = json.meta?.images?._iiif_image ?? hit._images?._iiif_image_base_url ?? (imageId ? `https://framemark.vam.ac.uk/collections/${imageId}/` : null);
  if (!base) return null;
  if (json.meta?.images?._images_meta?.some((m: any) => m.sensitiveImage)) return null;
  if (/photograph|negative|lantern slide/i.test(r.objectType ?? '')) return null;
  const places: string[] = (r.placesOfOrigin ?? []).map((p: any) => clean(p.place?.text)).filter(Boolean);
  const maker = (r.artistMakerPerson ?? [])[0]?.name?.text;
  const title = clean(r.titles?.[0]?.title) || clean(r.objectType) || 'Untitled';
  return {
    src: 'vam',
    srcId: String(r.systemNumber),
    title,
    artist: maker && !/unknown/i.test(maker) ? clean(maker) : undefined,
    culture: undefined,
    placeParts: places.slice(0, 2),
    hints: [
      ...places.map((p) => ({ text: p, kind: 'specific' as const })),
      { text: hit._primaryPlace, kind: 'country' as const },
    ],
    date: clean(pd?.text) || formatRange(y0, y1),
    y0,
    y1,
    cat: categorize(r.objectType, (r.categories ?? []).map((c: any) => c.text).join(' '), r.materialsAndTechniques),
    medium: clean(r.materialsAndTechniques) || undefined,
    kind: clean(r.objectType) || undefined,
    img: `${base.replace(/\/$/, '')}/full/!800,800/0/default.jpg`,
    imgFull: `${base.replace(/\/$/, '')}/full/!1600,1600/0/default.jpg`,
    url: `https://collections.vam.ac.uk/item/${r.systemNumber}/`,
    credit: clean(r.creditLine) ? `${clean(r.creditLine)} · © Victoria and Albert Museum, London` : '© Victoria and Albert Museum, London',
    hl: false,
  };
}
