import { HINT_COSTS, MAX_PLACE, MAX_TIME, SCORING } from '../config.ts';
import { CONTINENT_BY_ID, haversineKm, REGION_BY_ID } from '../geo/regions.ts';
import type { GameObject, GeoTier, HintState, PlaceGuess } from './types.ts';
import { hashString } from './rng.ts';

export interface PlaceOutcome {
  score: number;
  km: number;
  correct: boolean | null;
}

/** Answer id for an object at a given tier. */
export function answerId(o: GameObject, tier: GeoTier): string | null {
  if (tier === 'continent') return o.continent;
  if (tier === 'region') return o.region;
  if (tier === 'country') return o.country;
  return null;
}

export function scorePlace(
  o: GameObject,
  guess: PlaceGuess,
  unitCenter: (tier: GeoTier, id: string) => [number, number] | undefined,
): PlaceOutcome {
  const km = haversineKm(guess.lon, guess.lat, o.lon, o.lat);
  if (guess.tier === 'pinpoint') {
    const eff = Math.max(0, km - o.r);
    return { score: Math.round(MAX_PLACE * Math.exp(-eff / SCORING.pinpointScaleKm)), km, correct: null };
  }
  const want = answerId(o, guess.tier);
  if (want === guess.id) return { score: MAX_PLACE, km, correct: true };
  const a = unitCenter(guess.tier, guess.id);
  const b = unitCenter(guess.tier, want!);
  const partialMax = SCORING.partialMax[guess.tier] ?? 0;
  if (!a || !b || partialMax <= 0) return { score: 0, km, correct: false };
  const d = haversineKm(a[0], a[1], b[0], b[1]);
  return { score: Math.round(MAX_PLACE * partialMax * Math.exp(-d / SCORING.partialScaleKm[guess.tier])), km, correct: false };
}

export function scoreTime(o: Pick<GameObject, 'y0' | 'y1'>, year: number): number {
  if (year >= o.y0 && year <= o.y1) return MAX_TIME;
  const gap = year < o.y0 ? o.y0 - year : year - o.y1;
  const mid = (o.y0 + o.y1) / 2;
  const age = 2025 - mid;
  const scale = Math.max(SCORING.timeMinScaleYears, age * SCORING.timeAgeFactor);
  return Math.round(MAX_TIME * Math.exp(-gap / scale));
}

export function applyHints(place: number | null, time: number | null, h: HintState): { place: number | null; time: number | null } {
  const roundMult = (h.medium ? HINT_COSTS.medium : 1) * HINT_COSTS.zoom ** h.zoomSteps;
  return {
    place: place === null ? null : Math.round(place * roundMult * (h.area ? HINT_COSTS.area : 1)),
    time: time === null ? null : Math.round(time * roundMult * (h.era ? HINT_COSTS.era : 1)),
  };
}

/** Name of the unit one level above `tier`, used by the "area" hint (none in continent mode). */
export function areaHint(o: GameObject, tier: GeoTier): string | null {
  if (tier === 'continent') return null;
  if (tier === 'region') return CONTINENT_BY_ID.get(o.continent)?.name ?? null;
  return REGION_BY_ID.get(o.region)?.name ?? null;
}

/**
 * A window that contains the object's dates, offset pseudo-randomly (per object) so that the
 * middle of the window is not the answer. 1000 years wide before 1000 CE, 400 after.
 */
export function eraWindow(o: Pick<GameObject, 'id' | 'y0' | 'y1'>): [number, number] {
  const mid = (o.y0 + o.y1) / 2;
  const span = mid > 1000 ? 400 : 1000;
  const u = 0.15 + 0.7 * ((hashString(o.id) % 1000) / 1000);
  const start = Math.round((mid - span * u) / 50) * 50;
  const lo = Math.min(start, o.y0);
  const hi = Math.max(start + span, o.y1);
  return [lo, Math.min(hi, 1950)];
}
