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
