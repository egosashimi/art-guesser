// Cleveland Museum of Art Open Access API — https://openaccess-api.clevelandart.org/
// CC0 data and images, no key.
import { categorize } from '../categorize.ts';
import { formatRange } from './met.ts';
import { clean, getJson, type FetchOptions, type RawRecord } from './common.ts';

const API = 'https://openaccess-api.clevelandart.org/api/artworks/';

const DEPARTMENTS: [string, number][] = [
  ['African Art', 0.1],
  ['Art of the Americas', 0.1],
  ['Oceania', 0.05],
  ['Chinese Art', 0.08],
  ['Japanese Art', 0.07],
  ['Korean Art', 0.03],
  ['Indian and Southeast Asian Art', 0.09],
  ['Islamic Art', 0.06],
  ['Egyptian and Ancient Near Eastern Art', 0.06],
  ['Greek and Roman Art', 0.05],
  ['Medieval Art', 0.05],
  ['European Painting and Sculpture', 0.1],
  ['American Painting and Sculpture', 0.04],
  ['Decorative Art and Design', 0.05],
  ['Textiles', 0.07],
];

export async function fetchCma(opts: FetchOptions): Promise<RawRecord[]> {
  const out = new Map<string, RawRecord>();
  const add = (rows: any[] | undefined) => {
    for (const a of rows ?? []) {
      const r = toRecord(a);
      if (r) out.set(r.srcId, r);
    }
  };

  const hl = await getJson<any>(`${API}?cc0=1&has_image=1&highlight=1&limit=${Math.round(opts.limit * 0.3)}`);
  add(hl?.data);
  opts.log(`cma: ${out.size} highlights`);

  for (const [dept, share] of DEPARTMENTS) {
    const want = Math.round(opts.limit * 0.7 * share);
    const base = `${API}?cc0=1&has_image=1&department=${encodeURIComponent(dept)}`;
    const head = await getJson<any>(`${base}&limit=1`);
    const total: number = head?.info?.total ?? 0;
    if (!total) {
      opts.log(`cma: ${dept}: no results`);
      continue;
    }
    // Two slices from different offsets for some variety without fetching everything.
    const chunk = Math.ceil(want / 2);
    for (const frac of [0.1, 0.6]) {
      const skip = Math.max(0, Math.min(total - chunk, Math.floor(total * frac)));
      const res = await getJson<any>(`${base}&limit=${chunk}&skip=${skip}`, { delayMs: 300 });
      add(res?.data);
    }
    opts.log(`cma: ${dept}: ${total} candidates`);
  }
  return [...out.values()];
}

function toRecord(a: any): RawRecord | null {
  const img = a.images?.web?.url;
  if (!img || a.share_license_status !== 'CC0') return null;
  const y0 = Number(a.creation_date_earliest);
  const y1 = Number(a.creation_date_latest);
  if (!Number.isFinite(y0) || !Number.isFinite(y1)) return null;
  const cultures: string[] = Array.isArray(a.culture) ? a.culture.map(clean).filter(Boolean) : [];
  const creator = clean(a.creators?.[0]?.description);
  // "Claude Monet (French, 1840–1926)" → "French"
  const nationality = creator.match(/\(([A-Za-z ,'-]+?),/)?.[1];
  const artistName = creator.replace(/\s*\(.*$/, '');
  const isNamedArtist = !!artistName && !/unknown|anonymous/i.test(artistName);
  return {
    src: 'cma',
    srcId: String(a.id),
    title: clean(a.title) || 'Untitled',
    artist: isNamedArtist ? artistName : undefined,
    culture: cultures[0] || undefined,
    placeParts: [clean(a.find_spot)].filter(Boolean),
    hints: [
      { text: a.find_spot, kind: 'specific' },
      ...cultures.map((c) => ({ text: c, kind: 'culture' as const })),
      { text: nationality, kind: 'fallback' },
    ],
    date: clean(a.creation_date) || formatRange(y0, y1),
    y0,
    y1,
    cat: categorize(a.type, a.technique, a.department),
    medium: clean(a.technique) || undefined,
    kind: clean(a.type) || undefined,
    img,
    imgFull: a.images?.print?.url || undefined,
    url: a.url || `https://www.clevelandart.org/art/${a.accession_number}`,
    credit: clean(a.creditline) || undefined,
    hl: !!a.highlight,
  };
}
