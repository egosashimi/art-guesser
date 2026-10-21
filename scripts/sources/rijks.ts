// Rijksmuseum (Amsterdam) Linked Art APIs — https://data.rijksmuseum.nl/
// No key, public-domain images (IIIF). Search returns object URIs (100/page); each object is
// one Linked Art JSON-LD document with production place, timespan, materials and image.
import { categorize } from '../categorize.ts';
import { formatRange } from './met.ts';
import { clean, getJson, pool, seededShuffle, type FetchOptions, type RawRecord } from './common.ts';

const SEARCH = 'https://data.rijksmuseum.nl/search/collection';
const ENGLISH = 'http://vocab.getty.edu/aat/300388277';

// Search filters on the Dutch object-type term. Weighted toward the Asian pavilion and
// non-European holdings; the Dutch Golden Age is well covered by the other sources.
const TYPES: [string, number][] = [
  ['schilderij', 0.14], // painting
  ['beeld', 0.1], // sculpture
  ['beeldje', 0.06], // figurine
  ['vaas', 0.08],
  ['kom', 0.06], // bowl
  ['schotel', 0.05], // dish
  ['kan', 0.04], // jug
  ['masker', 0.02],
  ['kris', 0.03],
  ['wajangpop', 0.02], // wayang puppet
  ['netsuke', 0.03],
  ['inro', 0.02],
  ['kamerscherm', 0.03], // folding screen
  ['hangrol', 0.04], // hanging scroll
  ['zwaard', 0.04], // sword
  ['helm', 0.02],
  ['textiel', 0.04],
  ['kimono', 0.02],
  ['tegel', 0.03], // tile
  ['doos', 0.04], // box
  ['sieraad', 0.03], // jewellery
  ['miniatuur', 0.04],
];

const notation = (n: any): string | undefined => {
  const arr = Array.isArray(n) ? n : n ? [n] : [];
  return (arr.find((x: any) => x['@language'] === 'en') ?? arr[0])?.['@value'];
};

export async function fetchRijks(opts: FetchOptions): Promise<RawRecord[]> {
  const seed = Number(new Date().toISOString().slice(0, 7).replace('-', ''));
  const chosen = new Set<string>();
  for (const [type, share] of TYPES) {
    const want = Math.round(opts.limit * share);
    let url: string | undefined = `${SEARCH}?imageAvailable=true&type=${encodeURIComponent(type)}`;
    const ids: string[] = [];
    let total = 0;
    // Walk a few pages (cursor-based), then sample from what we got.
    for (let page = 0; url && page < Math.ceil((want * 3) / 100); page++) {
      const r: any = await getJson(url, { delayMs: 250 });
      if (!r) break;
      total = r.partOf?.totalItems ?? total;
      ids.push(...(r.orderedItems ?? []).map((x: any) => x.id));
      url = r.next?.id;
    }
    let n = 0;
    for (const id of seededShuffle(ids, seed)) {
      if (n >= want) break;
      const short = id.split('/').pop()!;
      if (opts.skip?.has(short) || chosen.has(id)) continue;
      chosen.add(id);
      n++;
    }
    opts.log(`rijks: ${type}: ${total} candidates, taking ${n}`);
  }

  const ids = [...chosen];
  opts.log(`rijks: fetching ${ids.length} object records…`);
  let done = 0;
  const out = await pool(ids, 3, async (id) => {
    const o = await getJson<any>(id, { delayMs: 200 });
    if (++done % 250 === 0) opts.log(`rijks: ${done}/${ids.length}`);
    return o ? toRecord(o) : null;
  });
  return out.filter((r): r is RawRecord => r !== null);
}

function walkProductions(p: any): any[] {
  if (!p) return [];
  return [p, ...(p.part ?? []).flatMap(walkProductions)];
}

function year(iso: unknown): number | null {
  const m = typeof iso === 'string' ? iso.match(/^(-?\d{1,4})/) : null;
  return m ? Number(m[1]) : null;
}


function toRecord(o: any): RawRecord | null {
  const prods = walkProductions(o.produced_by);
  const ts = prods.map((p) => p.timespan).find((t) => t?.begin_of_the_begin);
  const y0 = year(ts?.begin_of_the_begin);
  const y1 = year(ts?.end_of_the_end);
  if (y0 === null || y1 === null) return null;

  // Public-domain IIIF image
  let img: string | undefined;
  for (const s of o.subject_of ?? []) {
    for (const d of s.digitally_carried_by ?? []) {
      const ap = (d.access_point ?? []).map((a: any) => a.id).find((u: string) => u?.includes('iiif.micr.io'));
      const licence = (d.referred_to_by ?? []).map((r: any) => r.content ?? '').join(' ');
      if (ap && /publicdomain|cc0/i.test(licence)) img = ap;
    }
  }
  if (!img) return null;
  const iiifBase = img.replace(/\/full\/.*$/, '');

  const page = (o.subject_of ?? [])
    .flatMap((s: any) => (s.digitally_carried_by ?? []).flatMap((d: any) => (d.access_point ?? []).map((a: any) => a.id)))
    .find((u: string) => u?.includes('rijksmuseum.nl/') && u.includes('collectie'));

  const names = (o.identified_by ?? []).filter((x: any) => x.type === 'Name');
  const title =
    names.find((x: any) => (x.language ?? []).some((l: any) => l.id === ENGLISH))?.content ?? names[0]?.content ?? 'Untitled';

  const places = prods.flatMap((p) => p.took_place_at ?? []).map((pl: any) => notation(pl.notation)).filter(Boolean) as string[];
  const makers = prods
    .flatMap((p) => p.carried_out_by ?? [])
    .map((a: any) => notation(a.notation))
    .filter((n: string | undefined) => n && !/anonym/i.test(n)) as string[];
  const kind = (o.classified_as ?? []).map((c: any) => notation(c.notation)).find(Boolean);
  const materials = (o.made_of ?? []).map((m: any) => notation(m.notation)).filter(Boolean).join(', ');
  const objNumber = (o.identified_by ?? []).find((x: any) => x.type === 'Identifier')?.content;

  return {
    src: 'rijks',
    srcId: String(o.id).split('/').pop()!,
    title: clean(title),
    artist: makers[0] ? clean(makers[0]) : undefined,
    culture: undefined,
    placeParts: [...new Set(places)].slice(0, 2),
    hints: places.map((p) => ({ text: p, kind: 'specific' as const })),
    date: formatRange(y0, y1),
    y0,
    y1,
    cat: categorize(kind, materials),
    medium: materials || undefined,
    kind: kind ? clean(kind) : undefined,
    img: `${iiifBase}/full/800,/0/default.jpg`,
    imgFull: `${iiifBase}/full/1600,/0/default.jpg`,
    url: page ?? (objNumber ? `https://www.rijksmuseum.nl/en/collection/${objNumber}` : String(o.id)),
    credit: 'Rijksmuseum, Amsterdam',
    hl: false,
  };
}
