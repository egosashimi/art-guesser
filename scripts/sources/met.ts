// The Metropolitan Museum of Art Collection API — https://metmuseum.github.io/
// No key needed; documented limit is 80 requests/second, we stay far below it.
import { categorize } from '../categorize.ts';
import { clean, getJson, pool, seededShuffle, type FetchOptions, type RawRecord } from './common.ts';

const API = 'https://collectionapi.metmuseum.org/public/collection/v1';

// departmentId → share of the Met budget. Weighted toward the departments that hold the
// non-European and pre-modern material the game is built around.
const DEPARTMENTS: [number, string, number][] = [
  [5, 'Arts of Africa, Oceania, and the Americas', 0.2],
  [6, 'Asian Art', 0.15],
  [14, 'Islamic Art', 0.08],
  [3, 'Ancient Near Eastern Art', 0.05],
  [10, 'Egyptian Art', 0.06],
  [13, 'Greek and Roman Art', 0.06],
  [11, 'European Paintings', 0.08],
  [12, 'European Sculpture and Decorative Arts', 0.06],
  [19, 'Medieval Art', 0.04],
  [7, 'The Cloisters', 0.03],
  [1, 'The American Wing', 0.05],
  [4, 'Arms and Armor', 0.03],
  [17, 'Musical Instruments', 0.03],
  [15, 'The Robert Lehman Collection', 0.02],
  [9, 'Drawings and Prints', 0.02],
  [8, 'The Costume Institute', 0.04],
];

async function searchIds(params: string): Promise<number[]> {
  for (const q of ['*', '']) {
    const r = await getJson<{ total: number; objectIDs: number[] | null }>(`${API}/search?${params}&q=${encodeURIComponent(q)}`);
    if (r?.objectIDs?.length) return r.objectIDs;
  }
  return [];
}

export async function fetchMet(opts: FetchOptions): Promise<RawRecord[]> {
  const seed = Number(new Date().toISOString().slice(0, 7).replace('-', ''));
  const chosen = new Set<number>();

  const highlights = await searchIds('isHighlight=true&hasImages=true');
  opts.log(`met: ${highlights.length} highlights`);
  for (const id of seededShuffle(highlights, seed).slice(0, Math.round(opts.limit * 0.3))) chosen.add(id);

  for (const [dept, name, share] of DEPARTMENTS) {
    const budget = Math.round(opts.limit * 0.7 * share);
    let ids = await searchIds(`departmentId=${dept}&hasImages=true&isOnView=true`);
    if (ids.length < budget) ids = ids.concat(await searchIds(`departmentId=${dept}&hasImages=true`));
    opts.log(`met: ${name}: ${ids.length} candidates, taking ${budget}`);
    // Over-sample: many records turn out not to be public domain or can't be geocoded.
    for (const id of seededShuffle([...new Set(ids)], seed + dept).slice(0, Math.round(budget * 1.6))) chosen.add(id);
  }

  const ids = [...chosen];
  opts.log(`met: fetching ${ids.length} object records…`);
  let done = 0;
  const records = await pool(ids, 6, async (id) => {
    const o = await getJson<any>(`${API}/objects/${id}`, { delayMs: 60 });
    if (++done % 250 === 0) opts.log(`met: ${done}/${ids.length}`);
    return o ? toRecord(o) : null;
  });
  return records.filter((r): r is RawRecord => r !== null);
}

function toRecord(o: any): RawRecord | null {
  if (!o.isPublicDomain || !o.primaryImageSmall) return null;
  const y0 = Number(o.objectBeginDate);
  const y1 = Number(o.objectEndDate);
  if (!Number.isFinite(y0) || !Number.isFinite(y1)) return null;

  const bio = clean(o.artistDisplayBio);
  const bioPlaces = parseBioPlaces(bio);
  const placeParts = [o.city, o.subregion, o.region, o.state, o.country].map(clean).filter(Boolean);

  return {
    src: 'met',
    srcId: String(o.objectID),
    title: clean(o.title) || clean(o.objectName) || 'Untitled',
    artist: clean(o.artistDisplayName) || undefined,
    culture: clean(o.culture) || undefined,
    placeParts,
    hints: [
      { text: o.city, kind: 'specific' },
      { text: o.locale, kind: 'specific' },
      { text: o.subregion, kind: 'specific' },
      { text: o.region, kind: 'specific' },
      { text: o.state, kind: 'specific' },
      { text: o.county, kind: 'specific' },
      { text: o.country, kind: 'country' },
      { text: o.culture, kind: 'culture' },
      ...bioPlaces.map((p) => ({ text: p, kind: 'specific' as const })),
      { text: o.artistNationality, kind: 'fallback' },
      { text: DEPT_FALLBACK[o.department], kind: 'fallback' },
    ],
    date: clean(o.objectDate) || formatRange(y0, y1),
    y0,
    y1,
    cat: categorize(o.classification, o.objectName, o.medium),
    medium: clean(o.medium) || undefined,
    kind: clean(o.objectName) || clean(o.classification) || undefined,
    img: o.primaryImageSmall,
    imgFull: o.primaryImage || undefined,
    url: o.objectURL || `https://www.metmuseum.org/art/collection/search/${o.objectID}`,
    credit: clean(o.creditLine) || undefined,
    hl: !!o.isHighlight,
  };
}

const DEPT_FALLBACK: Record<string, string> = {
  'Egyptian Art': 'Egypt',
};

/** "Dutch, Leiden 1606–1669 Amsterdam" → ["Amsterdam", "Leiden"] (death place first: closer to where mature work was made). */
export function parseBioPlaces(bio: string): string[] {
  if (!bio) return [];
  const afterComma = bio.includes(',') ? bio.slice(bio.indexOf(',') + 1) : bio;
  const m = afterComma.match(/^\s*([^\d(]*?)\s*(?:ca\.\s*)?\d.*?\d\s*([^\d)]*)$/);
  if (!m) return [];
  return [m[2], m[1]].map((s) => s.trim()).filter((s) => s && s.length > 2);
}

export function formatRange(y0: number, y1: number): string {
  const f = (y: number) => (y < 0 ? `${-y} BCE` : `${y} CE`);
  return y0 === y1 ? f(y0) : `${f(y0)}–${f(y1)}`;
}
