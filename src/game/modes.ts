import type { Category } from '../data/types.ts';
import type { CollectionId, Format, GameConfig, GameObject, GeoMode, GeoTier } from './types.ts';
import type { Rng } from './rng.ts';

export interface CollectionDef {
  id: CollectionId;
  name: string;
  blurb: string;
  filter: (o: GameObject) => boolean;
  /** Whether the regional balance algorithm should apply (off for single-region collections). */
  balanced: boolean;
}

const ARTIFACT_CATS: Category[] = ['sculpture', 'textile', 'ceramic', 'metal', 'other'];

export const COLLECTIONS: CollectionDef[] = [
  { id: 'everything', name: 'Everything', blurb: 'Artifacts, paintings and works on paper from every region', filter: () => true, balanced: true },
  { id: 'artifacts', name: 'Artifacts', blurb: 'Objects, not pictures: sculpture, textiles, ceramics, metalwork (the Anthropeum feel)', filter: (o) => ARTIFACT_CATS.includes(o.cat), balanced: true },
  { id: 'paintings', name: 'Paintings', blurb: 'Oils, scrolls, miniatures, icons, screens, from everywhere', filter: (o) => o.cat === 'painting', balanced: true },
  { id: 'sculpture', name: 'Sculpture', blurb: 'Figures, masks, reliefs and carvings', filter: (o) => o.cat === 'sculpture', balanced: true },
  { id: 'textiles', name: 'Textiles & Dress', blurb: 'Weaving, embroidery, costume, featherwork, baskets', filter: (o) => o.cat === 'textile', balanced: true },
  { id: 'ceramics', name: 'Ceramics & Glass', blurb: 'Pots, porcelain, tiles and glass', filter: (o) => o.cat === 'ceramic', balanced: true },
  { id: 'metal', name: 'Metal & Arms', blurb: 'Bronzes, gold, jewelry, armor', filter: (o) => o.cat === 'metal', balanced: true },
  { id: 'paper', name: 'Works on Paper', blurb: 'Prints, drawings, manuscripts and calligraphy', filter: (o) => o.cat === 'paper', balanced: true },
  { id: 'ancient', name: 'Antiquity', blurb: 'Everything made before 500 CE', filter: (o) => (o.y0 + o.y1) / 2 < 500, balanced: true },
  { id: 'beyond-europe', name: 'Beyond Europe', blurb: 'No European objects at all', filter: (o) => o.group !== 'europe', balanced: true },
  { id: 'europe', name: 'Europe Deep Cut', blurb: 'Only Europe, for telling Flemish from Florentine', filter: (o) => o.group === 'europe', balanced: false },
  { id: 'highlights', name: 'Masterpieces', blurb: 'Only objects the museums flag as highlights', filter: (o) => !!o.hl, balanced: true },
];

export const COLLECTION_BY_ID = new Map(COLLECTIONS.map((c) => [c.id, c]));

export const GEO_MODES: { id: GeoMode; name: string; blurb: string }[] = [
  { id: 'continent', name: 'Continent', blurb: 'Six big areas. A gentle start.' },
  { id: 'region', name: 'Region', blurb: '22 cultural regions, like “West Africa” or “Andes”' },
  { id: 'country', name: 'Country', blurb: 'Pick the modern country' },
  { id: 'pinpoint', name: 'Pinpoint', blurb: 'Drop a pin; scored by distance' },
  { id: 'mixed', name: 'Mixed scale', blurb: 'Every round picks a different scale' },
  { id: 'off', name: 'No map', blurb: 'Only guess the date' },
];

export const FORMATS: { id: Format; name: string; blurb: string }[] = [
  { id: 'daily', name: 'Daily', blurb: '10 objects, the same for everyone today' },
  { id: 'endless', name: 'Endless', blurb: 'Keep going as long as you like' },
  { id: 'survival', name: 'Survival', blurb: '3 lives. A weak round costs one.' },
  { id: 'blitz', name: 'Blitz', blurb: '10 rounds, 30 seconds each' },
];

export interface Preset {
  id: string;
  name: string;
  blurb: string;
  icon: string;
  config: Omit<GameConfig, 'format'>;
  formats: Format[];
}

const ALL: Format[] = ['daily', 'endless', 'survival', 'blitz'];

export const PRESETS: Preset[] = [
  { id: 'classic', name: 'Classic', icon: '🏺', blurb: 'Pin the place and the date. Mostly artifacts, some paintings.', config: { geo: 'pinpoint', time: true, collection: 'everything', closeLook: false }, formats: ALL },
  { id: 'continents', name: 'Continents', icon: '🌍', blurb: 'Pick the continent and the date. Good for a first game.', config: { geo: 'continent', time: true, collection: 'everything', closeLook: false }, formats: ALL },
  { id: 'regions', name: 'Regions', icon: '🗺️', blurb: '22 cultural regions plus the date', config: { geo: 'region', time: true, collection: 'everything', closeLook: false }, formats: ALL },
  { id: 'countries', name: 'Countries', icon: '📍', blurb: 'Name the modern country plus the date', config: { geo: 'country', time: true, collection: 'everything', closeLook: false }, formats: ALL },
  { id: 'mixed', name: 'Mixed Scale', icon: '🎲', blurb: 'Each round randomly asks for a continent, region, country or pin', config: { geo: 'mixed', time: true, collection: 'everything', closeLook: false }, formats: ALL },
  { id: 'gallery', name: 'Gallery', icon: '🖼️', blurb: 'Paintings only, from every tradition', config: { geo: 'region', time: true, collection: 'paintings', closeLook: false }, formats: ALL },
  { id: 'artifacts', name: 'Artifacts', icon: '🗿', blurb: 'No paintings: just objects, as in Anthropeum', config: { geo: 'pinpoint', time: true, collection: 'artifacts', closeLook: false }, formats: ALL },
  { id: 'timetraveler', name: 'Time Traveler', icon: '⏳', blurb: 'No map. Only the date.', config: { geo: 'off', time: true, collection: 'everything', closeLook: false }, formats: ALL },
  { id: 'globetrotter', name: 'Globetrotter', icon: '🧭', blurb: 'No timeline. Only the place.', config: { geo: 'pinpoint', time: false, collection: 'everything', closeLook: false }, formats: ALL },
  { id: 'closelook', name: 'Close Look', icon: '🔍', blurb: 'Start zoomed in on a detail. Zoom out at a cost.', config: { geo: 'region', time: true, collection: 'everything', closeLook: true }, formats: ALL },
  { id: 'antiquity', name: 'Antiquity', icon: '🏛️', blurb: 'Before 500 CE, everywhere', config: { geo: 'region', time: true, collection: 'ancient', closeLook: false }, formats: ALL },
  { id: 'beyond', name: 'Beyond Europe', icon: '🧵', blurb: 'Pinpoint, with every object from outside Europe', config: { geo: 'pinpoint', time: true, collection: 'beyond-europe', closeLook: false }, formats: ALL },
];

export const PRESET_BY_ID = new Map(PRESETS.map((p) => [p.id, p]));

/** Stable key for a config (daily seeds, stats buckets, saved progress). */
export function configKey(c: GameConfig): string {
  return [c.geo, c.time ? 't' : 'nt', c.collection, c.closeLook ? 'cl' : '', c.format].join('.');
}

export function configLabel(c: GameConfig): string {
  const preset = PRESETS.find(
    (p) => p.config.geo === c.geo && p.config.time === c.time && p.config.collection === c.collection && p.config.closeLook === c.closeLook,
  );
  const fmt = FORMATS.find((f) => f.id === c.format)?.name ?? c.format;
  if (preset) return `${preset.name} · ${fmt}`;
  const geo = GEO_MODES.find((g) => g.id === c.geo)?.name ?? c.geo;
  const coll = COLLECTION_BY_ID.get(c.collection)?.name ?? c.collection;
  return `Custom: ${geo}${c.time ? ' + date' : ''} · ${coll}${c.closeLook ? ' · close look' : ''} · ${fmt}`;
}

/** Map tier for a round. Mixed mode leans toward the middle tiers. */
export function tierForRound(mode: GeoMode, rng: Rng): GeoTier | null {
  if (mode === 'off') return null;
  if (mode !== 'mixed') return mode;
  const r = rng();
  return r < 0.2 ? 'continent' : r < 0.5 ? 'region' : r < 0.75 ? 'country' : 'pinpoint';
}
