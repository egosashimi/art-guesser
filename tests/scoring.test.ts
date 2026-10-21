import { describe, expect, it } from 'vitest';
import { applyHints, eraWindow, scorePlace, scoreTime } from '../src/game/scoring.ts';
import { posToYear, yearToPos } from '../src/game/timeline.ts';
import type { GameObject } from '../src/game/types.ts';

const obj = (o: Partial<GameObject>): GameObject =>
  ({ id: 'x:1', y0: 1500, y1: 1550, lat: 35, lon: 135.7, r: 50, country: 'Japan', region: 'east-asia', continent: 'asia', group: 'east-asia', ...o }) as GameObject;

const noCenter = () => undefined;

describe('time scoring', () => {
  it('gives full points inside the date range', () => {
    expect(scoreTime(obj({}), 1520)).toBe(5000);
  });
  it('is more forgiving for older objects', () => {
    const recent = scoreTime(obj({ y0: 1750, y1: 1750 }), 1850);
    const ancient = scoreTime(obj({ y0: -2500, y1: -2500 }), -2400);
    expect(ancient).toBeGreaterThan(recent);
  });
  it('decreases monotonically with distance', () => {
    const o = obj({});
    expect(scoreTime(o, 1600)).toBeGreaterThan(scoreTime(o, 1700));
    expect(scoreTime(o, 1400)).toBeGreaterThan(scoreTime(o, 1200));
  });
});

describe('place scoring', () => {
  it('gives full pinpoint points inside the uncertainty radius', () => {
    expect(scorePlace(obj({}), { tier: 'pinpoint', lon: 135.5, lat: 35.1 }, noCenter).score).toBe(5000);
  });
  it('falls off with distance', () => {
    const near = scorePlace(obj({}), { tier: 'pinpoint', lon: 139.7, lat: 35.7 }, noCenter).score;
    const far = scorePlace(obj({}), { tier: 'pinpoint', lon: 2.3, lat: 48.9 }, noCenter).score;
    expect(near).toBeGreaterThan(far);
    expect(far).toBeLessThan(100);
  });
  it('scores clickable units as right / partial / wrong', () => {
    const centers: Record<string, [number, number]> = { 'east-asia': [115, 35], 'southeast-asia': [108, 8], 'west-africa': [-3, 11] };
    const c = (_t: string, id: string) => centers[id];
    expect(scorePlace(obj({}), { tier: 'region', id: 'east-asia', lon: 0, lat: 0 }, c).score).toBe(5000);
    const partial = scorePlace(obj({}), { tier: 'region', id: 'southeast-asia', lon: 0, lat: 0 }, c).score;
    const wrong = scorePlace(obj({}), { tier: 'region', id: 'west-africa', lon: 0, lat: 0 }, c).score;
    expect(partial).toBeGreaterThan(wrong);
    expect(partial).toBeLessThan(5000);
    expect(scorePlace(obj({}), { tier: 'continent', id: 'europe', lon: 0, lat: 0 }, () => [0, 0]).score).toBe(0);
  });
});

describe('hints', () => {
  it('apply multiplicative costs', () => {
    const r = applyHints(5000, 5000, { medium: true, era: true, area: false, zoomSteps: 0 });
    expect(r.place).toBe(4250);
    expect(r.time).toBe(2125);
  });
  it('era window contains the dates but is not centred on them', () => {
    let centred = 0;
    for (let i = 0; i < 200; i++) {
      const o = obj({ id: `t:${i}`, y0: 300, y1: 350 });
      const [a, b] = eraWindow(o);
      expect(a).toBeLessThanOrEqual(300);
      expect(b).toBeGreaterThanOrEqual(350);
      if (Math.abs((a + b) / 2 - 325) < 60) centred++;
    }
    expect(centred).toBeLessThan(80);
  });
});

describe('timeline scale', () => {
  it('round-trips', () => {
    for (const y of [-4000, -2500, -300, 0, 640, 1234, 1888, 1950]) expect(Math.round(posToYear(yearToPos(y)))).toBe(y);
  });
});
