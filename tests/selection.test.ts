import { describe, expect, it } from 'vitest';
import { GROUP_TARGETS, pickGame, Picker } from '../src/game/selection.ts';
import { mulberry32, rngFrom } from '../src/game/rng.ts';
import type { GameObject } from '../src/game/types.ts';
import type { BalanceGroup } from '../src/geo/regions.ts';

// Synthetic pool shaped like a real museum pool: heavily European, thin in Oceania.
const SIZES: Record<BalanceGroup, number> = {
  europe: 1500, africa: 400, 'west-asia': 200, 'south-central-asia': 300, 'east-asia': 500,
  'southeast-asia': 100, oceania: 60, 'north-america': 300, 'latin-america': 300,
};
const pool: GameObject[] = [];
for (const [g, n] of Object.entries(SIZES)) {
  for (let i = 0; i < n; i++) {
    pool.push({
      id: `${g}:${i}`, group: g, region: `${g}-r${i % 3}`, bucket: `${g}-b${i % 12}`, cat: (['painting', 'sculpture', 'textile', 'ceramic'] as const)[i % 4],
      y0: -2000 + ((i * 97) % 3900), y1: -2000 + ((i * 97) % 3900) + 20, hl: i % 10 === 0 ? 1 : undefined,
    } as unknown as GameObject);
  }
}

function simulate(days: number) {
  const perGame: Record<string, number[]> = {};
  const total: Record<string, number> = {};
  let n = 0;
  for (let d = 0; d < days; d++) {
    const { objects } = pickGame(pool, 10, { rng: rngFrom(`day-${d}`), balanced: true });
    const counts: Record<string, number> = {};
    for (const o of objects) counts[o.group] = (counts[o.group] ?? 0) + 1;
    for (const g of Object.keys(SIZES)) {
      (perGame[g] ??= []).push(counts[g] ?? 0);
      total[g] = (total[g] ?? 0) + (counts[g] ?? 0);
    }
    n += objects.length;
  }
  return { perGame, share: Object.fromEntries(Object.entries(total).map(([g, c]) => [g, c / n])) };
}

describe('balanced selection', () => {
  const { perGame, share } = simulate(1500);

  it('converges on the long-run targets despite a Europe-heavy pool', () => {
    for (const [g, t] of Object.entries(GROUP_TARGETS)) expect(Math.abs(share[g] - t)).toBeLessThan(0.05);
  });

  it('is not slot-based: every non-European group is sometimes absent and sometimes doubled', () => {
    for (const g of Object.keys(SIZES)) {
      if (g === 'europe') continue;
      const c = perGame[g];
      expect(c.filter((x) => x === 0).length / c.length).toBeGreaterThan(0.15);
      expect(c.filter((x) => x >= 2).length / c.length).toBeGreaterThan(0.03);
    }
  });

  it('never lets one group dominate a game', () => {
    for (const g of Object.keys(SIZES)) expect(Math.max(...perGame[g])).toBeLessThanOrEqual(7);
  });

  it('daily picks are deterministic for a seed', () => {
    const a = pickGame(pool, 10, { rng: rngFrom('2026-10-21|x'), balanced: true }).objects.map((o) => o.id);
    const b = pickGame(pool, 10, { rng: rngFrom('2026-10-21|x'), balanced: true }).objects.map((o) => o.id);
    expect(a).toEqual(b);
  });

  it('does not repeat an object within a game', () => {
    const p = new Picker(pool, { rng: mulberry32(1), balanced: true });
    const ids = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const o = p.next()!;
      expect(ids.has(o.id)).toBe(false);
      ids.add(o.id);
      if (i % 10 === 9) p.resetGame();
    }
  });

  it('history correction pushes under-served groups up', () => {
    const recentGroups = Array(40).fill('europe') as BalanceGroup[];
    let eu = 0;
    for (let d = 0; d < 300; d++) {
      const { objects } = pickGame(pool, 10, { rng: rngFrom(`h-${d}`), balanced: true, recentGroups });
      eu += objects.filter((o) => o.group === 'europe').length;
    }
    expect(eu / 3000).toBeLessThan(GROUP_TARGETS.europe);
  });
});
