import { GAME_NAME } from '../config.ts';
import type { RoundResult } from './types.ts';

export function square(frac: number): string {
  if (frac >= 0.9) return '🟩';
  if (frac >= 0.7) return '🟨';
  if (frac >= 0.45) return '🟧';
  if (frac >= 0.2) return '🟥';
  return '⬛';
}

export function shareText(opts: { title: string; results: RoundResult[]; url: string; extra?: string }): string {
  const total = opts.results.reduce((a, r) => a + r.total, 0);
  const max = opts.results.reduce((a, r) => a + r.max, 0);
  const place = opts.results.map((r) => (r.placeScore === null ? '' : square(r.placeScore / 5000))).join('');
  const time = opts.results.map((r) => (r.timeScore === null ? '' : square(r.timeScore / 5000))).join('');
  const lines = [`${GAME_NAME} ${opts.title}`, `${total.toLocaleString('en-US')} / ${max.toLocaleString('en-US')}`];
  if (place) lines.push(`🌍 ${place}`);
  if (time) lines.push(`⏳ ${time}`);
  if (opts.extra) lines.push(opts.extra);
  lines.push(opts.url);
  return lines.join('\n');
}
