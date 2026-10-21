// Turns the free-text place/culture fields of a museum record into a point + uncertainty radius.
import type { World } from '../src/geo/world.ts';
import { haversineKm } from '../src/geo/regions.ts';
import { GAZETTEER, normalize, type GazetteerHit } from './gazetteer.ts';

export interface Hint {
  text: string | null | undefined;
  /** 'country' hints are used to sanity-check more specific matches (e.g. Georgia the US state). */
  kind?: 'specific' | 'country' | 'culture' | 'fallback';
}

export interface GeoResult {
  lat: number;
  lon: number;
  r: number;
  country: string;
  matched: string;
}

const NOISE = [
  /\([^)]*\)/g,
  /\?/g,
  /\b(probably|possibly|perhaps|likely|reportedly|said to be from|said to be|made in|found (at|in)|excavated (at|in)|present[- ]day|modern|ancient|historic(al)?|attributed to|or nearby|near|vicinity of|area|region|province|state|kingdom of|empire|peoples?|culture|style|school|workshop|type|group|tradition|territory|islands?|is\.)\b/g,
  /\b(northern|southern|eastern|western|central|north|south|east|west)(ern)?\b(?=.*\w)/g,
];

function clean(s: string): string {
  let t = s;
  for (const re of NOISE) t = t.replace(re, ' ');
  return t.replace(/^the\s+/, '').replace(/[^a-z0-9' -]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function makeGeocoder(world: World) {
  // Modern country names (Natural Earth spellings) as a low-priority layer under the gazetteer.
  const countryHits = new Map<string, GazetteerHit>();
  for (const c of world.countries) {
    countryHits.set(normalize(c.name), { lat: c.center[1], lon: c.center[0], r: c.radiusKm, key: c.name });
  }

  function exact(key: string): GazetteerHit | undefined {
    if (!key) return undefined;
    return GAZETTEER.get(key) ?? countryHits.get(key);
  }

  /** All gazetteer hits for a single free-text field. */
  function lookup(text: string): GazetteerHit[] {
    const n = normalize(text);
    const direct = exact(n) ?? exact(clean(n));
    if (direct) return [direct];
    const hits: GazetteerHit[] = [];
    const parts = n.split(/[,;/:]|\bor\b|\band\b|\bfrom\b|\(|\)/);
    for (const p of parts) {
      const t = p.trim();
      if (!t) continue;
      const h = exact(t) ?? exact(clean(t));
      if (h) hits.push(h);
      else {
        // Last resort: try each word (catches "Yoruba-speaking", "Asante kingdom" …)
        for (const w of clean(t).split(/[ -]/)) {
          if (w.length < 4) continue;
          const hw = exact(w);
          if (hw) hits.push(hw);
        }
      }
    }
    return hits;
  }

  function geocode(hints: Hint[]): GeoResult | null {
    let best: { hit: GazetteerHit; field: string } | null = null;
    let countryHit: GazetteerHit | null = null;
    for (const h of hints) {
      if (!h.text || !h.text.trim()) continue;
      const hits = lookup(h.text);
      if (!hits.length) continue;
      const tightest = hits.reduce((a, b) => (b.r < a.r ? b : a));
      if (h.kind === 'country' && !countryHit) countryHit = tightest;
      if (!best) best = { hit: tightest, field: h.text };
    }
    if (!best) return null;
    let hit = best.hit;
    let matched = best.field;
    if (countryHit && hit !== countryHit) {
      // A specific match in a different country from the stated one is probably a homonym
      // (Georgia the US state, Cambridge MA, Greek vs Egyptian Thebes…)
      const stated = world.countryAt(countryHit.lon, countryHit.lat, 600);
      const found = world.countryAt(hit.lon, hit.lat, 600);
      const d = haversineKm(hit.lon, hit.lat, countryHit.lon, countryHit.lat);
      if (stated !== found && d > hit.r + 300) {
        hit = countryHit;
        matched = countryHit.key;
      }
    }
    const country = world.countryAt(hit.lon, hit.lat, 600);
    if (!country) return null;
    return { lat: hit.lat, lon: hit.lon, r: hit.r, country, matched };
  }

  return { geocode, lookup };
}
