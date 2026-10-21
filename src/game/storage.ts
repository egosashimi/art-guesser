// Everything the game remembers lives in localStorage under one prefix. All access is
// wrapped so private browsing / blocked storage just means "no memory", never a crash.
import type { BalanceGroup } from '../geo/regions.ts';
import { LAUNCH_DATE } from '../config.ts';
import type { RoundResult } from './types.ts';

const PREFIX = 'prov:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function clearAll(): void {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

// ── Dates ────────────────────────────────────────────────────────────────────

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dailyNumber(dateKey = todayKey()): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [ly, lm, ld] = LAUNCH_DATE.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ly, lm - 1, ld)) / 86400000) + 1;
}

// ── Saved games ─────────────────────────────────────────────────────────────

export interface SavedGame {
  configKey: string;
  label: string;
  date: string;
  objectIds: string[];
  results: RoundResult[];
  finished: boolean;
  spotlight?: BalanceGroup | null;
}

export const dailySaveKey = (date: string, configKey: string) => `daily:${date}:${configKey}`;

export function loadDaily(date: string, configKey: string): SavedGame | null {
  return load<SavedGame | null>(dailySaveKey(date, configKey), null);
}

export function saveDaily(g: SavedGame): void {
  save(dailySaveKey(g.date, g.configKey), g);
}

// ── Stats ────────────────────────────────────────────────────────────────────

export interface GameRecord {
  key: string;
  label: string;
  format: string;
  date: string;
  score: number;
  max: number;
  rounds: number;
}

export interface Acc {
  n: number;
  sum: number;
}

export interface Stats {
  games: GameRecord[];
  best: Record<string, number>;
  streak: { last: string | null; count: number; best: number };
  /** Average place accuracy (0..1) by balance group / region of the *true* answer. */
  byGroup: Record<string, Acc>;
  byRegion: Record<string, Acc>;
  /** Average time accuracy by era bucket. */
  byEra: Record<string, Acc>;
  /** Average by medium category. */
  byCat: Record<string, Acc>;
  roundsPlayed: number;
}

const EMPTY_STATS: Stats = { games: [], best: {}, streak: { last: null, count: 0, best: 0 }, byGroup: {}, byRegion: {}, byEra: {}, byCat: {}, roundsPlayed: 0 };

export function loadStats(): Stats {
  return { ...EMPTY_STATS, ...load<Partial<Stats>>('stats', {}) };
}

export function saveStats(s: Stats): void {
  s.games = s.games.slice(-300);
  save('stats', s);
}

export function bump(acc: Record<string, Acc>, key: string, value: number): void {
  const a = acc[key] ?? { n: 0, sum: 0 };
  a.n += 1;
  a.sum += value;
  acc[key] = a;
}

export function updateStreak(s: Stats, date: string): void {
  if (s.streak.last === date) return;
  const prev = new Date(date + 'T12:00:00');
  prev.setDate(prev.getDate() - 1);
  s.streak.count = s.streak.last === todayKey(prev) ? s.streak.count + 1 : 1;
  s.streak.last = date;
  s.streak.best = Math.max(s.streak.best, s.streak.count);
}

// ── History (drives long-run balance + no-repeat in endless) ────────────────

export interface History {
  recentGroups: BalanceGroup[];
  seen: string[];
}

export function loadHistory(): History {
  return load<History>('history', { recentGroups: [], seen: [] });
}

export function recordServed(groups: BalanceGroup[], ids: string[]): void {
  const h = loadHistory();
  h.recentGroups = [...h.recentGroups, ...groups].slice(-60);
  h.seen = [...h.seen, ...ids].slice(-4000);
  save('history', h);
}

// ── Collection, favourites, playtest flags ───────────────────────────────────

export interface CollectionEntry {
  first: string;
  best: number;
  max: number;
}

export function loadCollection(): Record<string, CollectionEntry> {
  return load('collection', {});
}

export function addToCollection(id: string, score: number, max: number): void {
  const c = loadCollection();
  const e = c[id];
  if (!e) c[id] = { first: todayKey(), best: score, max };
  else if (score / max > e.best / e.max) c[id] = { ...e, best: score, max };
  save('collection', c);
}

export function loadFavs(): string[] {
  return load('favs', []);
}

export function toggleFav(id: string): boolean {
  const f = new Set(loadFavs());
  const on = !f.has(id);
  if (on) f.add(id);
  else f.delete(id);
  save('favs', [...f]);
  return on;
}

export interface Flag {
  id: string;
  reason: string;
  note?: string;
  at: string;
}

export function loadFlags(): Flag[] {
  return load('flags', []);
}

export function addFlag(f: Flag): void {
  save('flags', [...loadFlags(), f]);
}

// ── Settings ─────────────────────────────────────────────────────────────────

export interface Settings {
  theme: 'auto' | 'light' | 'dark';
  units: 'km' | 'mi';
  labels: boolean;
  seenIntro: boolean;
}

export function loadSettings(): Settings {
  return { theme: 'auto', units: 'km', labels: true, seenIntro: false, ...load<Partial<Settings>>('settings', {}) };
}

export function saveSettings(s: Settings): void {
  save('settings', s);
}
