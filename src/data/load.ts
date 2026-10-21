import type { Topology } from 'topojson-specification';
import worldUrl from 'world-atlas/countries-50m.json?url';
import { buildWorld, type World } from '../geo/world.ts';
import { regionFor } from '../geo/regions.ts';
import type { GameObject } from '../game/types.ts';
import type { Pool } from './types.ts';

export interface GameData {
  world: World;
  objects: GameObject[];
  byId: Map<string, GameObject>;
  built: string;
}

export async function loadGameData(): Promise<GameData> {
  const [poolRes, worldRes] = await Promise.all([fetch('./data/pool.json'), fetch(worldUrl)]);
  if (!poolRes.ok) throw new Error(`Could not load the object pool (HTTP ${poolRes.status}).`);
  if (!worldRes.ok) throw new Error(`Could not load the world map (HTTP ${worldRes.status}).`);
  const pool = (await poolRes.json()) as Pool;
  const world = buildWorld((await worldRes.json()) as Topology);
  const objects: GameObject[] = [];
  for (const o of pool.objects) {
    const region = regionFor(o.lon, o.lat, o.country);
    if (!region) continue;
    objects.push({ ...o, region: region.id, continent: region.continent, group: region.group });
  }
  return { world, objects, byId: new Map(objects.map((o) => [o.id, o])), built: pool.built };
}
