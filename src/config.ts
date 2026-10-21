// Central place for names and tunable numbers. Playtest feedback should mostly mean editing this file.

export const GAME_NAME = 'Provenance';
export const TAGLINE = 'Where and when was it made?';

/** Daily #1. */
export const LAUNCH_DATE = '2026-10-21';

/** Optional link (e.g. a Google Form) shown in the menu and on the results screen for playtesters. */
export const FEEDBACK_URL = '';

export const ROUNDS_PER_GAME = 10;
export const MAX_PLACE = 5000;
export const MAX_TIME = 5000;

export const SCORING = {
  /** Pinpoint: points = MAX * exp(-(distance - radius) / scaleKm). GeoGuessr's world map uses ~1500 km. */
  pinpointScaleKm: 1500,
  /** Clickable-area modes: wrong answer partial credit = MAX * partialMax * exp(-centroidDistance / scaleKm). */
  partialMax: { continent: 0, region: 0.45, country: 0.6 } as Record<string, number>,
  partialScaleKm: { continent: 1, region: 1800, country: 1200 } as Record<string, number>,
  /** Time: full points inside the object's date range; outside, exp decay with a scale that grows with age. */
  timeMinScaleYears: 80,
  timeAgeFactor: 0.12,
};

export const HINT_COSTS = {
  /** Medium & object type: multiplies the whole round. */
  medium: 0.85,
  /** Era window: multiplies the time score. */
  era: 0.5,
  /** Area (one tier up from the current mode): multiplies the place score. */
  area: 0.5,
  /** Close Look zoom-out step: multiplies the whole round per step. */
  zoom: 0.9,
};

export const SURVIVAL = { lives: 3, passFraction: 0.5 };
export const BLITZ_SECONDS = 30;
