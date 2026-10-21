import type { ArtObject } from '../data/types.ts';
import type { BalanceGroup, ContinentId } from '../geo/regions.ts';

/** An ArtObject with client-side derived geography. */
export interface GameObject extends ArtObject {
  region: string;
  continent: ContinentId;
  group: BalanceGroup;
}

export type GeoTier = 'continent' | 'region' | 'country' | 'pinpoint';
export type GeoMode = 'off' | GeoTier | 'mixed';
export type Format = 'daily' | 'endless' | 'survival' | 'blitz';

export type CollectionId =
  | 'everything'
  | 'artifacts'
  | 'paintings'
  | 'sculpture'
  | 'textiles'
  | 'ceramics'
  | 'metal'
  | 'paper'
  | 'ancient'
  | 'beyond-europe'
  | 'europe'
  | 'highlights';

export interface GameConfig {
  geo: GeoMode;
  time: boolean;
  collection: CollectionId;
  format: Format;
  closeLook: boolean;
}

/** What the player has picked on the map. */
export type PlaceGuess =
  | { tier: 'pinpoint'; lon: number; lat: number }
  | { tier: Exclude<GeoTier, 'pinpoint'>; id: string; lon: number; lat: number };

export interface HintState {
  medium: boolean;
  era: boolean;
  area: boolean;
  zoomSteps: number;
}

export interface RoundResult {
  objectId: string;
  tier: GeoTier | null;
  place: PlaceGuess | null;
  year: number | null;
  placeScore: number | null;
  timeScore: number | null;
  /** Distance from guess to answer (pinpoint) in km. */
  km: number | null;
  correctUnit: boolean | null;
  hints: HintState;
  total: number;
  max: number;
  timedOut?: boolean;
}
