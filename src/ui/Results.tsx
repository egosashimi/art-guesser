import { useState } from 'preact/hooks';
import { FEEDBACK_URL, GAME_NAME } from '../config.ts';
import type { GameData } from '../data/load.ts';
import { BALANCE_GROUP_NAMES, REGION_BY_ID, type BalanceGroup } from '../geo/regions.ts';
import { FORMATS } from '../game/modes.ts';
import { shareText, square } from '../game/share.ts';
import type { GameConfig, GameObject, RoundResult } from '../game/types.ts';

interface Props {
  data: GameData;
  config: GameConfig;
  title: string;
  objects: GameObject[];
  results: RoundResult[];
  spotlight: BalanceGroup | null;
  onExit: () => void;
  onPlay: (c: GameConfig) => void;
}

export function Results({ data, config, title, objects, results, spotlight, onExit, onPlay }: Props) {
  const [copied, setCopied] = useState(false);
  const played = results.filter((r) => r.max > 0);
  const total = played.reduce((a, r) => a + r.total, 0);
  const max = played.reduce((a, r) => a + r.max, 0);
  const pct = max ? Math.round((100 * total) / max) : 0;

  // What did this game's mix look like? (Shown after the fact so it can't be used to predict.)
  const mix = new Map<string, number>();
  for (const r of results) {
    const o = data.byId.get(r.objectId);
    if (o) mix.set(o.group, (mix.get(o.group) ?? 0) + 1);
  }

  async function share() {
    const text = shareText({
      title,
      results: played,
      url: location.origin + location.pathname,
      extra: spotlight ? `Spotlight: ${BALANCE_GROUP_NAMES[spotlight]}` : undefined,
    });
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div class="screen results">
      <header class="results-head">
        <p class="eyebrow">{GAME_NAME}</p>
        <h1>{title}</h1>
        <div class="big-score">
          {total.toLocaleString()} <span class="muted">/ {max.toLocaleString()}</span>
        </div>
        <div class="meter" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <p class="muted">{verdict(pct)} · {played.length} {played.length === 1 ? 'object' : 'objects'}</p>
        {spotlight && <p class="spotlight">✨ Today was a <b>Spotlight</b> day: {BALANCE_GROUP_NAMES[spotlight]}</p>}
        <div class="row center">
          <button class="primary" onClick={share}>{copied ? 'Copied!' : 'Share result'}</button>
          {config.format !== 'daily' && <button onClick={() => onPlay({ ...config })}>Play again</button>}
          {config.format === 'daily' && <button onClick={() => onPlay({ ...config, format: 'endless' })}>Keep playing (Endless)</button>}
          <button class="ghost" onClick={onExit}>Menu</button>
        </div>
        {FEEDBACK_URL && (
          <p><a href={FEEDBACK_URL} target="_blank" rel="noopener">Playtesting? Tell us what you thought ↗</a></p>
        )}
      </header>

      <ol class="round-list">
        {results.map((r, i) => {
          const o = objects.find((x) => x.id === r.objectId) ?? data.byId.get(r.objectId);
          if (!o) return null;
          return (
            <li key={r.objectId} class="round-row">
              <span class="round-n">{i + 1}</span>
              <img src={o.img} alt="" loading="lazy" />
              <div class="round-info">
                <a href={o.url} target="_blank" rel="noopener" class="round-title">{o.title}</a>
                <div class="muted small">{o.place} · {o.date}</div>
                <div class="muted small">{REGION_BY_ID.get(o.region)?.name}</div>
              </div>
              <div class="round-score">
                {r.max === 0 ? (
                  <span class="muted">skipped</span>
                ) : (
                  <>
                    <span>{r.placeScore !== null && square(r.placeScore / 5000)}{r.timeScore !== null && square(r.timeScore / 5000)}</span>
                    <b>{r.total.toLocaleString()}</b>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <section class="mix">
        <h3>This game’s mix</h3>
        <div class="chips">
          {[...mix.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => (
            <span key={g} class="chip">{BALANCE_GROUP_NAMES[g as BalanceGroup]} × {n}</span>
          ))}
        </div>
        <p class="muted small">
          No fixed quotas: the mix is random but weighted, so over many games about three quarters of objects come from outside Europe.
        </p>
      </section>

      {config.format !== 'daily' && (
        <section class="mix">
          <h3>Try another format</h3>
          <div class="chips">
            {FORMATS.filter((f) => f.id !== config.format).map((f) => (
              <button key={f.id} class="chip" onClick={() => onPlay({ ...config, format: f.id })}>{f.name}</button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function verdict(pct: number): string {
  if (pct >= 90) return 'Curator-level';
  if (pct >= 75) return 'Connoisseur';
  if (pct >= 60) return 'Seasoned visitor';
  if (pct >= 40) return 'Gallery wanderer';
  if (pct >= 20) return 'First visit';
  return 'Lost in the museum';
}
