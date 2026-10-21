// Non-linear year scale: more room for recent centuries, where most objects (and most
// distinguishable styles) are, while still reaching back to 4000 BCE.

export const YEAR_MIN = -4000;
export const YEAR_MAX = 1950;

// [year, position 0..1]
const STOPS: [number, number][] = [
  [-4000, 0],
  [-2000, 0.1],
  [-1000, 0.19],
  [0, 0.31],
  [500, 0.4],
  [1000, 0.51],
  [1400, 0.64],
  [1600, 0.74],
  [1800, 0.88],
  [1950, 1],
];

export function yearToPos(y: number): number {
  const year = Math.max(YEAR_MIN, Math.min(YEAR_MAX, y));
  for (let i = 1; i < STOPS.length; i++) {
    const [y1, p1] = STOPS[i];
    if (year <= y1) {
      const [y0, p0] = STOPS[i - 1];
      return p0 + ((year - y0) / (y1 - y0)) * (p1 - p0);
    }
  }
  return 1;
}

export function posToYear(p: number): number {
  const pos = Math.max(0, Math.min(1, p));
  for (let i = 1; i < STOPS.length; i++) {
    const [y1, p1] = STOPS[i];
    if (pos <= p1) {
      const [y0, p0] = STOPS[i - 1];
      return y0 + ((pos - p0) / (p1 - p0)) * (y1 - y0);
    }
  }
  return YEAR_MAX;
}

/** Snap granularity appropriate to how far back we are (keeps the slider from feeling jittery). */
export function snapYear(y: number): number {
  const step = y < -1000 ? 50 : y < 0 ? 25 : y < 1000 ? 10 : 5;
  return Math.round(y / step) * step;
}

export function formatYear(y: number): string {
  const r = Math.round(y);
  if (r < 0) return `${-r} BCE`;
  if (r === 0) return '1 CE';
  return `${r} CE`;
}

export function formatRange(y0: number, y1: number): string {
  if (Math.round(y0) === Math.round(y1)) return formatYear(y0);
  if (y0 < 0 && y1 < 0) return `${-Math.round(y0)}–${-Math.round(y1)} BCE`;
  if (y0 >= 0 && y1 >= 0) return `${Math.round(y0)}–${Math.round(y1)} CE`;
  return `${formatYear(y0)} – ${formatYear(y1)}`;
}

export const TICKS = [-4000, -2000, -1000, 0, 500, 1000, 1400, 1600, 1800, 1950];
