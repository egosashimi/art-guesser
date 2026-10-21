// Simulates many Daily games against the real pool and prints how often each part of the
// world appears per game, i.e. whether the mix is balanced but unpredictable.
//   node scripts/pool-report.ts [collection] [days]
import { readFileSync } from 'node:fs';
import { regionFor, BALANCE_GROUP_NAMES, type BalanceGroup } from '../src/geo/regions.ts';
import { COLLECTION_BY_ID } from '../src/game/modes.ts';
import { pickGame, GROUP_TARGETS } from '../src/game/selection.ts';
import { rngFrom } from '../src/game/rng.ts';
import type { GameObject, CollectionId } from '../src/game/types.ts';
import type { Pool } from '../src/data/types.ts';

const collection = (process.argv[2] ?? 'everything') as CollectionId;
const days = Number(process.argv[3] ?? 2000);
const pool = JSON.parse(readFileSync(new URL('../public/data/pool.json', import.meta.url), 'utf8')) as Pool;
const objects: GameObject[] = pool.objects.map((o) => {
  const r = regionFor(o.lon, o.lat, o.country)!;
  return { ...o, region: r.id, continent: r.continent, group: r.group };
});
const def = COLLECTION_BY_ID.get(collection)!;
const filtered = objects.filter(def.filter);

const groups = Object.keys(BALANCE_GROUP_NAMES) as BalanceGroup[];
const hist: Record<string, number[]> = Object.fromEntries(groups.map((g) => [g, [0, 0, 0, 0]]));
const totals: Record<string, number> = {};
let spot = 0;
let n = 0;
for (let d = 0; d < days; d++) {
  const { objects: picked, spotlight } = pickGame(filtered, 10, { rng: rngFrom(`sim-${d}|${collection}`), balanced: def.balanced, spotlightChance: 0.12 });
  if (spotlight) spot++;
  const c: Record<string, number> = {};
  for (const o of picked) c[o.group] = (c[o.group] ?? 0) + 1;
  for (const g of groups) {
    hist[g][Math.min(3, c[g] ?? 0)]++;
    totals[g] = (totals[g] ?? 0) + (c[g] ?? 0);
  }
  n += picked.length;
}
const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(5);
console.log(`Collection "${collection}": ${filtered.length} objects, ${days} simulated dailies, ${spot} spotlight days\n`);
console.log('group'.padEnd(34), 'pool', 'target', 'served', '  P(0)', ' P(1)', ' P(2)', 'P(3+)');
for (const g of groups) {
  const inPool = filtered.filter((o) => o.group === g).length / filtered.length;
  console.log(
    BALANCE_GROUP_NAMES[g].padEnd(34), pct(inPool), pct(GROUP_TARGETS[g]).padStart(6), pct(totals[g] / n).padStart(6),
    ...hist[g].map((h) => pct(h / days)),
  );
}
