// World geometry built from Natural Earth (via the world-atlas package).
// Used by the browser (rendering + click lookup) and by the data build (assigning countries to objects).
import { geoArea, geoBounds, geoCentroid, geoContains, geoDistance } from 'd3-geo';
import { feature, merge } from 'topojson-client';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { GeometryObject, Topology } from 'topojson-specification';
import { CONTINENTS, IGNORED_COUNTRIES, REGIONS, regionFor, type ContinentId } from './regions.ts';

export interface CountryShape {
  name: string;
  feature: Feature<Polygon | MultiPolygon>;
  bounds: [[number, number], [number, number]];
  /** Centroid of the largest polygon (avoids e.g. France's centroid landing in the Atlantic). */
  center: [number, number];
  /** Rough "size" radius of the country in km, used as location uncertainty for country-level records. */
  radiusKm: number;
}

export interface UnitShape {
  id: string;
  name: string;
  feature: Feature<Polygon | MultiPolygon>;
  center: [number, number];
}

export interface World {
  countries: CountryShape[];
  countryByName: Map<string, CountryShape>;
  regions: UnitShape[];
  continents: UnitShape[];
  /** Name of the country containing the point, or the nearest country within `maxKm`. */
  countryAt(lon: number, lat: number, maxKm?: number): string | null;
}

const EARTH_KM = 6371;

export function buildWorld(topology: Topology): World {
  const obj = topology.objects.countries as GeometryObject & { geometries: any[] };
  const countries: CountryShape[] = [];
  // Per-part geometries so overseas pieces of a country can belong to another region.
  const partsByRegion = new Map<string, any[]>();
  const partsByContinent = new Map<ContinentId, any[]>();

  for (const g of obj.geometries) {
    const name: string = g.properties?.name;
    if (!name || IGNORED_COUNTRIES.has(name) || !g.type) continue;
    const f = feature(topology, g) as unknown as Feature<Polygon | MultiPolygon>;
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    let largest = polys[0];
    let largestArea = -1;
    let totalArea = 0;
    for (const p of polys) {
      const a = geoArea({ type: 'Polygon', coordinates: p });
      totalArea += a;
      if (a > largestArea) {
        largestArea = a;
        largest = p;
      }
    }
    const center = geoCentroid({ type: 'Polygon', coordinates: largest } as Polygon) as [number, number];
    const areaKm2 = totalArea * EARTH_KM * EARTH_KM;
    const radiusKm = Math.max(15, Math.min(900, Math.sqrt(areaKm2 / Math.PI) * 0.6));
    countries.push({ name, feature: f, bounds: geoBounds(f) as any, center, radiusKm });

    const arcParts: any[] = g.type === 'Polygon' ? [g.arcs] : g.arcs;
    arcParts.forEach((arcs, i) => {
      const part = { type: 'Polygon', arcs };
      const pc = geoCentroid({ type: 'Polygon', coordinates: polys[i] } as Polygon);
      const region = regionFor(pc[0], pc[1], name);
      if (!region) return;
      push(partsByRegion, region.id, part);
      push(partsByContinent, region.continent, part);
    });
  }

  const regions: UnitShape[] = REGIONS.map((r) => ({
    id: r.id,
    name: r.name,
    feature: { type: 'Feature', properties: {}, geometry: merge(topology, partsByRegion.get(r.id) ?? []) } as Feature<MultiPolygon>,
    center: r.center,
  }));
  const continents: UnitShape[] = CONTINENTS.map((c) => {
    const f = { type: 'Feature', properties: {}, geometry: merge(topology, partsByContinent.get(c.id) ?? []) } as Feature<MultiPolygon>;
    return { id: c.id, name: c.name, feature: f, center: CONTINENT_CENTERS[c.id] };
  });

  const countryByName = new Map(countries.map((c) => [c.name, c]));

  function countryAt(lon: number, lat: number, maxKm = 400): string | null {
    for (const c of countries) {
      if (!inBounds(c.bounds, lon, lat)) continue;
      if (geoContains(c.feature, [lon, lat])) return c.name;
    }
    // Not on land (small island, coast, or click in the sea): nearest country by boundary vertex.
    let best: string | null = null;
    let bestKm = maxKm;
    for (const c of countries) {
      const km = nearestVertexKm(c.feature, lon, lat, bestKm);
      if (km < bestKm) {
        bestKm = km;
        best = c.name;
      }
    }
    return best;
  }

  return { countries, countryByName, regions, continents, countryAt };
}

const CONTINENT_CENTERS: Record<ContinentId, [number, number]> = {
  africa: [20, 5],
  europe: [15, 50],
  asia: [90, 35],
  oceania: [150, -15],
  'north-america': [-100, 40],
  'south-america': [-60, -15],
};

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const arr = m.get(k);
  if (arr) arr.push(v);
  else m.set(k, [v]);
}

function inBounds(b: [[number, number], [number, number]], lon: number, lat: number): boolean {
  const [[x0, y0], [x1, y1]] = b;
  if (lat < y0 - 0.01 || lat > y1 + 0.01) return false;
  // Bounds may cross the antimeridian (x0 > x1)
  if (x0 <= x1) return lon >= x0 - 0.01 && lon <= x1 + 0.01;
  return lon >= x0 - 0.01 || lon <= x1 + 0.01;
}

function nearestVertexKm(f: Feature<Polygon | MultiPolygon>, lon: number, lat: number, cutoffKm: number): number {
  // Quick reject using bounds padded by the cutoff
  const b = geoBounds(f);
  const padDeg = cutoffKm / 111 + 1;
  if (lat < b[0][1] - padDeg || lat > b[1][1] + padDeg) return Infinity;
  let best = Infinity;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys)
    for (const ring of p)
      for (const pt of ring) {
        const km = geoDistance(pt as [number, number], [lon, lat]) * EARTH_KM;
        if (km < best) best = km;
      }
  return best;
}
