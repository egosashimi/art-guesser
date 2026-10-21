import type { Category, SourceId } from '../../src/data/types.ts';
import type { Hint } from '../geocode.ts';

/** A source record before geocoding. */
export interface RawRecord {
  src: SourceId;
  srcId: string;
  title: string;
  artist?: string;
  culture?: string;
  /** Display place fields as recorded, most specific first. */
  placeParts: string[];
  hints: Hint[];
  date: string;
  y0: number;
  y1: number;
  cat: Category;
  medium?: string;
  kind?: string;
  img: string;
  imgFull?: string;
  url: string;
  credit?: string;
  hl?: boolean;
}

export interface FetchOptions {
  /** Rough cap on records requested from this source. */
  limit: number;
  log: (msg: string) => void;
  /** Source ids already cached; sources that pay per object (the Met) skip these. */
  skip?: Set<string>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch() + JSON with retries and a polite delay. Returns null on persistent failure. */
export async function getJson<T = any>(url: string, opts: { retries?: number; delayMs?: number; status?: { last: number } } = {}): Promise<T | null> {
  const retries = opts.retries ?? 3;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'art-guesser-pool-builder (+https://github.com/egosashimi/art-guesser)', Accept: 'application/json' },
      });
      if (opts.status) opts.status.last = res.status;
      if (res.status === 404) return null;
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) {
        if (!opts.status) console.warn(`  ${url} → HTTP ${res.status}`);
        return null;
      }
      const json = (await res.json()) as T;
      if (opts.delayMs) await sleep(opts.delayMs);
      return json;
    } catch (e) {
      if (attempt === retries) {
        console.warn(`  ${url} failed: ${(e as Error).message}`);
        return null;
      }
      await sleep(1000 * 2 ** attempt);
    }
  }
  return null;
}

/** Run async tasks with bounded concurrency. */
export async function pool<T, R>(items: T[], concurrency: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return out;
}

/** Deterministic shuffle so rebuilding the pool on the same day picks the same sample. */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function clean(s: unknown): string {
  return typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '';
}

/**
 * Parses free-text dates as museums write them into [earliest, latest]:
 * "1850", "c. 1850", "1850s", "1850-1870", "1850–70", "19th century", "late 19th century",
 * "early 1900s", "before 1900", "500 BC", "200 BCE - 100 CE". Returns null if unsure.
 */
export function parseDateText(raw: string | null | undefined): [number, number] | null {
  if (!raw) return null;
  let s = raw.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const bc = /\b(b\.?c\.?e?\.?|bce)\b/.test(s) && !/\b(a\.?d\.?|c\.?e\.?)\b/.test(s.replace(/\bbce\b/g, ''));
  const circa = /\b(circa|ca\.?|c\.|about|approx\.?)\s*\d/.test(s);
  s = s.replace(/\b(circa|ca\.?|c\.|about|approx\.?|probably|possibly)\s*/g, '').trim();
  const sign = (n: number, isBc = bc) => (isBc ? -n : n);
  let m: RegExpMatchArray | null;

  // "200 BCE - 100 CE": explicit era on each side
  if ((m = s.match(/^(\d{1,4})\s*(bce|b\.?c\.?)\s*-\s*(\d{1,4})\s*(ce|a\.?d\.?)$/))) return [-m[1], +m[3]];
  s = s.replace(/\s*\b(b\.?c\.?e?\.?|bce|a\.?d\.?|c\.?e\.?)(?=\s|$|-)/g, '').trim();

  // "before 1900" / "by 1900" / "pre-1900"
  if ((m = s.match(/^(?:before|by|pre-?)\s*(\d{3,4})$/))) return [sign(+m[1]) - 50, sign(+m[1])];

  // "early|mid|late 19th century"
  if ((m = s.match(/^(early|mid|middle|late)?[ -]?(\d{1,2})(?:st|nd|rd|th) century(?: [a-z.]+)?$/))) {
    const c = +m[2];
    let a = (c - 1) * 100;
    let b = c * 100 - 1;
    if (m[1] === 'early') b = a + 40;
    else if (m[1] === 'mid' || m[1] === 'middle') [a, b] = [a + 30, a + 70];
    else if (m[1] === 'late') a = a + 60;
    return bc ? [-(c * 100), -((c - 1) * 100 + 1)] : [a, b];
  }
  // "1800s" / "early 1900s": a round hundred + s means the century
  if ((m = s.match(/^(early|mid|late)?\s*(\d{2})00s$/))) {
    const a = +m[2] * 100;
    return m[1] === 'early' ? [a, a + 35] : m[1] === 'mid' ? [a + 30, a + 70] : m[1] === 'late' ? [a + 65, a + 99] : [a, a + 99];
  }
  // "1850s" / "late 1850s"
  if ((m = s.match(/^(early|mid|late)?\s*(\d{3})0s$/))) {
    const a = +m[2] * 10;
    return m[1] === 'early' ? [a, a + 3] : m[1] === 'late' ? [a + 6, a + 9] : [a, a + 9];
  }
  // "1850-1870", "1850-70", "300-200 BC"
  if ((m = s.match(/^(\d{1,4})\s*-\s*(\d{1,4})$/))) {
    let bStr = m[2];
    if (!bc && bStr.length < m[1].length) bStr = m[1].slice(0, m[1].length - bStr.length) + bStr;
    let a = sign(+m[1]);
    let b = sign(+bStr);
    if (a > b) [a, b] = [b, a];
    return [a, b];
  }
  // plain year; "circa" widens it
  if ((m = s.match(/^(\d{1,4})$/))) {
    const y = sign(+m[1]);
    const w = circa ? (Math.abs(y) < 1000 || bc ? 50 : 10) : 0;
    return [y - w, y + w];
  }
  return null;
}
