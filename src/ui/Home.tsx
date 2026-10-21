import { useState } from 'preact/hooks';
import { FEEDBACK_URL, GAME_NAME, TAGLINE } from '../config.ts';
import type { GameData } from '../data/load.ts';
import { COLLECTIONS, configKey, FORMATS, GEO_MODES, PRESETS, PRESET_BY_ID, type Preset } from '../game/modes.ts';
import { dailyNumber, loadDaily, todayKey } from '../game/storage.ts';
import type { CollectionId, Format, GameConfig, GeoMode } from '../game/types.ts';
import { SOURCE_NAMES } from '../data/types.ts';

interface Props {
  data: GameData;
  onPlay: (c: GameConfig) => void;
  onNav: (screen: 'stats' | 'help' | 'settings') => void;
}

const DAILY_PRESETS = ['classic', 'continents', 'regions', 'countries', 'mixed', 'gallery', 'artifacts', 'timetraveler'];

export function Home({ data, onPlay, onNav }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [custom, setCustom] = useState<GameConfig>({ geo: 'region', time: true, collection: 'everything', format: 'endless', closeLook: false });
  const date = todayKey();
  const num = dailyNumber(date);
  const classic = PRESET_BY_ID.get('classic')!;

  function dailyStatus(p: Preset) {
    const c: GameConfig = { ...p.config, format: 'daily' };
    const saved = loadDaily(date, configKey(c));
    if (!saved) return null;
    const played = saved.results.filter((r) => r.max > 0);
    const score = played.reduce((a, r) => a + r.total, 0);
    return { finished: saved.finished, score, progress: saved.results.length, total: saved.objectIds.length };
  }

  const classicStatus = dailyStatus(classic);

  return (
    <div class="screen home">
      <header class="home-head">
        <div>
          <h1 class="logo">{GAME_NAME}</h1>
          <p class="tagline">{TAGLINE}</p>
        </div>
        <nav class="home-nav">
          <button class="ghost" onClick={() => onNav('help')}>How to play</button>
          <button class="ghost" onClick={() => onNav('stats')}>Stats & collection</button>
          <button class="ghost" onClick={() => onNav('settings')} aria-label="Settings">⚙</button>
        </nav>
      </header>

      <section class="daily-hero">
        <div>
          <p class="eyebrow">Daily #{num} · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h2>Today’s ten objects</h2>
          <p>Pin each one on the map and place it on the timeline. Everyone gets the same objects today.</p>
        </div>
        <button class="primary big" onClick={() => onPlay({ ...classic.config, format: 'daily' })}>
          {classicStatus?.finished ? `See today’s result: ${classicStatus.score.toLocaleString()}` : classicStatus ? `Continue (${classicStatus.progress}/${classicStatus.total})` : 'Play today’s Daily'}
        </button>
      </section>

      <section>
        <h3 class="section-title">More dailies</h3>
        <div class="daily-strip">
          {DAILY_PRESETS.filter((id) => id !== 'classic').map((id) => {
            const p = PRESET_BY_ID.get(id)!;
            const st = dailyStatus(p);
            return (
              <button key={id} class={`daily-chip ${st?.finished ? 'done' : ''}`} onClick={() => onPlay({ ...p.config, format: 'daily' })}>
                <span class="icon">{p.icon}</span>
                <span>{p.name}</span>
                <small>{st?.finished ? `✓ ${st.score.toLocaleString()}` : st ? `${st.progress}/${st.total}` : 'Play'}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 class="section-title">Modes</h3>
        <p class="muted">Every mode can be played as Daily, Endless (infinite), Survival (3 lives) or Blitz (30 s per object).</p>
        <div class="preset-grid">
          {PRESETS.map((p) => (
            <div key={p.id} class={`preset ${open === p.id ? 'open' : ''}`}>
              <button class="preset-main" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
                <span class="icon">{p.icon}</span>
                <span class="preset-name">{p.name}</span>
                <span class="preset-blurb">{p.blurb}</span>
              </button>
              {open === p.id && (
                <div class="format-row">
                  {FORMATS.filter((f) => p.formats.includes(f.id)).map((f) => (
                    <button key={f.id} class={f.id === 'endless' ? 'primary small' : 'small'} onClick={() => onPlay({ ...p.config, format: f.id })} title={f.blurb}>
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section class="custom">
        <h3 class="section-title">Build your own</h3>
        <div class="custom-grid">
          <label>
            Map
            <select value={custom.geo} onChange={(e) => setCustom({ ...custom, geo: (e.target as HTMLSelectElement).value as GeoMode })}>
              {GEO_MODES.map((g) => <option key={g.id} value={g.id}>{g.name}: {g.blurb}</option>)}
            </select>
          </label>
          <label>
            Collection
            <select value={custom.collection} onChange={(e) => setCustom({ ...custom, collection: (e.target as HTMLSelectElement).value as CollectionId })}>
              {COLLECTIONS.map((c) => <option key={c.id} value={c.id}>{c.name}: {c.blurb}</option>)}
            </select>
          </label>
          <label>
            Format
            <select value={custom.format} onChange={(e) => setCustom({ ...custom, format: (e.target as HTMLSelectElement).value as Format })}>
              {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.name}: {f.blurb}</option>)}
            </select>
          </label>
          <label class="check">
            <input type="checkbox" checked={custom.time} disabled={custom.geo === 'off'} onChange={(e) => setCustom({ ...custom, time: (e.target as HTMLInputElement).checked })} />
            Guess the date too
          </label>
          <label class="check">
            <input type="checkbox" checked={custom.closeLook} onChange={(e) => setCustom({ ...custom, closeLook: (e.target as HTMLInputElement).checked })} />
            Close Look (start zoomed in)
          </label>
        </div>
        <button class="primary" disabled={custom.geo === 'off' && !custom.time} onClick={() => onPlay({ ...custom, time: custom.geo === 'off' ? true : custom.time })}>
          Start custom game
        </button>
      </section>

      <footer class="home-foot muted small">
        <p>
          {data.objects.length.toLocaleString()} objects from the open-access collections of{' '}
          {Object.values(SOURCE_NAMES).join(', ')}. Images are public domain / CC0. Not affiliated with any museum.
        </p>
        <p>Pool built {new Date(data.built).toLocaleDateString()}.{FEEDBACK_URL && <> · <a href={FEEDBACK_URL} target="_blank" rel="noopener">Playtest feedback ↗</a></>}</p>
      </footer>
    </div>
  );
}
