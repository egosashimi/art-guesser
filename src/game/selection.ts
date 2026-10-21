// Choosing which objects to show.
//
// Goal: long-run balance between Europe and the rest of the world, *without* the per-game
// predictability of fixed slots ("there's always exactly one African piece"). We do that with
// weighted random draws instead of quotas:
//
//   1. Group weights start from GROUP_TARGETS (the long-run share we aim for).
//   2. Each game multiplies them by log-normal noise, so some games lean Asian, some American.
//   3. Within a game, every pick from a group makes that group less likely next time (soft
//      diminishing returns, plus a hard cap), so 6 objects from one place is impossible but
//      0, 1, 2 or 3 from any group are all normal.
//   4. Across games (endless mode, saved history), groups that have been under-served get a
//      boost and over-served ones a penalty, so the long-run mix converges on the targets.
//   5. Groups with very few objects (e.g. Oceanic paintings) are scaled down so their few
//      objects don't repeat every week.
//   6. Occasionally a Daily is a "spotlight" day that leans hard into one group.
//
// Inside a group we then pick region → culture bucket → object, each step spreading picks out,
// so a game rarely shows two objects from the same culture, era or medium.
import type { BalanceGroup } from '../geo/regions.ts';
import { gaussian, pickWeighted, type Rng } from './rng.ts';
import type { GameObject } from './types.ts';

export const GROUP_TARGETS: Record<BalanceGroup, number> = {
  europe: 0.24,
  africa: 0.13,
  'west-asia': 0.1,
  'south-central-asia': 0.11,
  'east-asia': 0.12,
  'southeast-asia': 0.06,
  oceania: 0.07,
  'north-america': 0.07,
  'latin-america': 0.1,
};

const HARD_CAP = 4;
const JITTER_SIGMA = 0.5;
/**
 * A group with few objects gets its weight scaled down so that, at ~1 game a day, its objects
 * don't come round again sooner than this (otherwise 8 African paintings would repeat weekly).
 */
const MIN_REPEAT_DAYS = 60;

export interface SelectionOptions {
  rng: Rng;
  balanced: boolean;
  /** Groups of recently served objects (across games), oldest first. */
  recentGroups?: BalanceGroup[];
  /** Object ids not to serve (already seen in endless mode). */
  exclude?: Set<string>;
  /** Single-category collections don't need medium spreading. */
  spreadCategories?: boolean;
  /** Daily only: chance that the game spotlights one group. */
  spotlightChance?: number;
}

export function eraBucket(o: Pick<GameObject, 'y0' | 'y1'>): number {
  const m = (o.y0 + o.y1) / 2;
  return m < -1000 ? 0 : m < 0 ? 1 : m < 600 ? 2 : m < 1200 ? 3 : m < 1600 ? 4 : m < 1800 ? 5 : 6;
}

type Index = Map<BalanceGroup, Map<string, Map<string, GameObject[]>>>;

function buildIndex(objects: GameObject[]): Index {
  const idx: Index = new Map();
  for (const o of objects) {
    let regions = idx.get(o.group);
    if (!regions) idx.set(o.group, (regions = new Map()));
    let buckets = regions.get(o.region);
    if (!buckets) regions.set(o.region, (buckets = new Map()));
    let arr = buckets.get(o.bucket);
    if (!arr) buckets.set(o.bucket, (arr = []));
    arr.push(o);
  }
  return idx;
}

export class Picker {
  private idx: Index;
  private jitter = new Map<BalanceGroup, number>();
  private groupCount = new Map<BalanceGroup, number>();
  private regionCount = new Map<string, number>();
  private usedBuckets = new Set<string>();
  private eraCount = new Map<number, number>();
  private catCount = new Map<string, number>();
  private used = new Set<string>();
  readonly spotlight: BalanceGroup | null = null;
  private opts: SelectionOptions;
  private poolCount = new Map<BalanceGroup, number>();

  constructor(objects: GameObject[], opts: SelectionOptions) {
    this.opts = opts;
    for (const o of objects) this.poolCount.set(o.group, (this.poolCount.get(o.group) ?? 0) + 1);
    const pool = opts.exclude?.size ? objects.filter((o) => !opts.exclude!.has(o.id)) : objects;
    // If the player has seen (almost) everything, start over rather than run dry.
    this.idx = buildIndex(pool.length >= 20 ? pool : objects);
    for (const g of this.idx.keys()) this.jitter.set(g, Math.exp(gaussian(opts.rng) * JITTER_SIGMA));
    if (opts.spotlightChance && opts.rng() < opts.spotlightChance) {
      const groups = [...this.idx.keys()].filter((g) => g !== 'europe' && this.countIn(g) >= 30);
      const g = groups[Math.floor(opts.rng() * groups.length)];
      if (g) {
        this.spotlight = g;
        this.jitter.set(g, 12);
      }
    }
  }

  private countIn(g: BalanceGroup): number {
    let n = 0;
    for (const b of this.idx.get(g)?.values() ?? []) for (const arr of b.values()) n += arr.length;
    return n;
  }

  private groupWeight(g: BalanceGroup): number {
    const n = this.groupCount.get(g) ?? 0;
    const cap = g === this.spotlight ? 7 : HARD_CAP;
    if (n >= cap) return 0;
    if (!this.opts.balanced) return Math.sqrt(this.countIn(g));
    const target = GROUP_TARGETS[g] ?? 0.05;
    const scarcity = Math.min(1, (this.poolCount.get(g) ?? 0) / (target * 10 * MIN_REPEAT_DAYS));
    let w = target * scarcity * (this.jitter.get(g) ?? 1);
    // Soft diminishing returns within a game; Europe's larger target decays slower.
    const decay = g === this.spotlight ? 0.9 : Math.min(0.85, 0.35 + target * 2);
    w *= decay ** n;
    // Long-run correction from history.
    const recent = this.opts.recentGroups;
    if (recent && recent.length >= 10) {
      const share = recent.filter((x) => x === g).length / recent.length;
      const ratio = (share + 0.02) / (target + 0.02);
      w *= Math.max(0.4, Math.min(2.5, 1 / ratio));
    }
    return w;
  }

  next(): GameObject | null {
    const { rng } = this.opts;
    const groups = [...this.idx.keys()].filter((g) => this.available(g));
    const group = pickWeighted(groups, (g) => this.groupWeight(g), rng);
    if (!group) return null;

    const regions = [...this.idx.get(group)!.entries()].filter(([, b]) => [...b.values()].some((arr) => arr.some((o) => !this.used.has(o.id))));
    const regionEntry = pickWeighted(regions, ([id, b]) => {
      let n = 0;
      for (const arr of b.values()) n += arr.length;
      return Math.sqrt(n) * 0.4 ** (this.regionCount.get(id) ?? 0);
    }, rng);
    if (!regionEntry) return null;
    const [regionId, buckets] = regionEntry;

    const bucketEntries = [...buckets.entries()].filter(([, arr]) => arr.some((o) => !this.used.has(o.id)));
    const bucketEntry = pickWeighted(bucketEntries, ([key, arr]) => arr.length ** 0.35 * (this.usedBuckets.has(key) ? 0.15 : 1), rng);
    if (!bucketEntry) return null;
    const [bucketKey, candidates] = bucketEntry;

    const spreadCats = this.opts.spreadCategories ?? true;
    const obj = pickWeighted(
      candidates.filter((o) => !this.used.has(o.id)),
      (o) => {
        let w = o.hl ? 2.5 : 1;
        if ((this.eraCount.get(eraBucket(o)) ?? 0) >= 2) w *= 0.35;
        if (spreadCats && (this.catCount.get(o.cat) ?? 0) >= 3) w *= 0.4;
        return w;
      },
      rng,
    );
    if (!obj) return null;

    this.used.add(obj.id);
    this.groupCount.set(group, (this.groupCount.get(group) ?? 0) + 1);
    this.regionCount.set(regionId, (this.regionCount.get(regionId) ?? 0) + 1);
    this.usedBuckets.add(bucketKey);
    this.eraCount.set(eraBucket(obj), (this.eraCount.get(eraBucket(obj)) ?? 0) + 1);
    this.catCount.set(obj.cat, (this.catCount.get(obj.cat) ?? 0) + 1);
    return obj;
  }

  private available(g: BalanceGroup): boolean {
    for (const b of this.idx.get(g)?.values() ?? []) for (const arr of b.values()) if (arr.some((o) => !this.used.has(o.id))) return true;
    return false;
  }

  /** Forget per-game counters (endless mode: each block of 10 behaves like a fresh game). */
  resetGame(): void {
    this.groupCount.clear();
    this.regionCount.clear();
    this.usedBuckets.clear();
    this.eraCount.clear();
    this.catCount.clear();
    for (const g of this.idx.keys()) this.jitter.set(g, Math.exp(gaussian(this.opts.rng) * JITTER_SIGMA));
  }
}

export function pickGame(objects: GameObject[], n: number, opts: SelectionOptions): { objects: GameObject[]; spotlight: BalanceGroup | null } {
  const p = new Picker(objects, opts);
  const out: GameObject[] = [];
  for (let i = 0; i < n; i++) {
    const o = p.next();
    if (!o) break;
    out.push(o);
  }
  return { objects: out, spotlight: p.spotlight };
}
