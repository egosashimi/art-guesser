// Art Institute of Chicago API — https://api.artic.edu/docs/
// Public, no key; asks for ≤60 requests/minute for anonymous use. Search returns full records,
// so this needs only a few dozen requests.
import { categorize } from '../categorize.ts';
import { formatRange } from './met.ts';
import { clean, getJson, type FetchOptions, type RawRecord } from './common.ts';

const API = 'https://api.artic.edu/api/v1/artworks/search';
const FIELDS = [
  'id', 'title', 'artist_display', 'artist_title', 'date_display', 'date_start', 'date_end', 'place_of_origin',
  'medium_display', 'artwork_type_title', 'classification_title', 'department_title', 'image_id',
  'is_public_domain', 'credit_line', 'is_boosted',
].join(',');

const DEPARTMENTS: [string, number][] = [
  ['Arts of Africa', 0.14],
  ['Arts of the Americas', 0.18],
  ['Arts of Asia', 0.22],
  ['Arts of Greece, Rome, and Byzantium', 0.08],
  ['Painting and Sculpture of Europe', 0.18],
  ['Applied Arts of Europe', 0.08],
  ['Textiles', 0.08],
  ['Prints and Drawings', 0.04],
];

async function search(filters: object[], page: number, limit = 100) {
  const params = {
    query: {
      bool: {
        filter: [{ term: { is_public_domain: true } }, { exists: { field: 'image_id' } }, ...filters],
      },
    },
  };
  const url = `${API}?params=${encodeURIComponent(JSON.stringify(params))}&fields=${FIELDS}&limit=${limit}&page=${page}`;
  // ~1 request/second keeps us inside the anonymous rate limit.
  return getJson<{ pagination: { total: number; total_pages: number }; data: any[] }>(url, { delayMs: 1100 });
}

export async function fetchAic(opts: FetchOptions): Promise<RawRecord[]> {
  const out = new Map<string, RawRecord>();
  const add = (rows: any[] | undefined) => {
    for (const a of rows ?? []) {
      const r = toRecord(a);
      if (r) out.set(r.srcId, r);
    }
  };

  // Boosted = the museum's own list of notable works.
  const boostedPages = Math.ceil((opts.limit * 0.35) / 100);
  for (let p = 1; p <= boostedPages; p++) {
    const res = await search([{ term: { is_boosted: true } }], p);
    if (!res?.data?.length) break;
    add(res.data);
    if (p >= res.pagination.total_pages) break;
  }
  opts.log(`aic: ${out.size} boosted works`);

  for (const [dept, share] of DEPARTMENTS) {
    const want = Math.round(opts.limit * 0.65 * share);
    const filter = [{ match: { department_title: dept } }];
    const first = await search(filter, 1);
    if (!first) continue;
    const totalPages = Math.min(first.pagination.total_pages, 99);
    add(first.data);
    // Spread requests across the result list rather than taking only the first pages.
    const pages = Math.ceil(want / 100);
    for (let k = 1; k < pages; k++) {
      const p = 1 + Math.floor((k * totalPages) / pages);
      const res = await search(filter, p);
      add(res?.data);
    }
    opts.log(`aic: ${dept}: ${first.pagination.total} candidates`);
  }
  return [...out.values()];
}

function toRecord(a: any): RawRecord | null {
  if (!a.is_public_domain || !a.image_id) return null;
  const y0 = Number(a.date_start);
  const y1 = Number(a.date_end);
  if (!Number.isFinite(y0) || !Number.isFinite(y1)) return null;
  // artist_display is e.g. "Moche\nNorth coast, Peru" or "Claude Monet\nFrench, 1840-1926"
  const lines = clean(String(a.artist_display ?? '').replace(/\n/g, ' | ')).split(' | ').map((s) => s.trim());
  const nationality = lines[1]?.split(',')[0];
  const isNamedArtist = !!a.artist_title && !/unknown|anonymous/i.test(a.artist_title);
  return {
    src: 'aic',
    srcId: String(a.id),
    title: clean(a.title) || 'Untitled',
    artist: isNamedArtist ? clean(a.artist_title) : undefined,
    culture: isNamedArtist ? undefined : lines[0] || undefined,
    placeParts: [clean(a.place_of_origin)].filter(Boolean),
    hints: [
      { text: a.place_of_origin, kind: 'specific' },
      { text: isNamedArtist ? undefined : lines[1], kind: 'specific' },
      { text: isNamedArtist ? undefined : lines[0], kind: 'culture' },
      { text: nationality, kind: 'fallback' },
    ],
    date: clean(a.date_display) || formatRange(y0, y1),
    y0,
    y1,
    cat: categorize(a.artwork_type_title, a.classification_title, a.medium_display),
    medium: clean(a.medium_display) || undefined,
    kind: clean(a.artwork_type_title) || undefined,
    img: `https://www.artic.edu/iiif/2/${a.image_id}/full/843,/0/default.jpg`,
    imgFull: `https://www.artic.edu/iiif/2/${a.image_id}/full/1686,/0/default.jpg`,
    url: `https://www.artic.edu/artworks/${a.id}`,
    credit: clean(a.credit_line) || undefined,
    hl: !!a.is_boosted,
  };
}
