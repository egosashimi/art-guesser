import { useMemo, useState } from 'preact/hooks';
import { GAME_NAME, HINT_COSTS, MAX_PLACE, MAX_TIME, SURVIVAL, BLITZ_SECONDS } from '../config.ts';
import type { GameData } from '../data/load.ts';
import { CATEGORY_NAMES, type Category } from '../data/types.ts';
import { BALANCE_GROUP_NAMES, REGIONS, type BalanceGroup } from '../geo/regions.ts';
import {
  clearAll, loadCollection, loadFavs, loadFlags, loadStats, saveSettings, type Acc, type Settings,
} from '../game/storage.ts';

// ── How to play ─────────────────────────────────────────────────────────────

export function Help({ onBack }: { onBack: () => void }) {
  return (
    <div class="screen page">
      <button class="ghost" onClick={onBack}>← Back</button>
      <h1>How to play</h1>
      <p>
        You’re shown an object from a museum collection: a mask, a bowl, a scroll, a helmet, a painting. Work out
        <b> where</b> and <b>when</b> it was made.
      </p>
      <h3>Where</h3>
      <ul>
        <li><b>Continent</b>: six big areas. All or nothing.</li>
        <li><b>Region</b>: 22 cultural regions such as “West Africa”, “Andes”, “Iran & Central Asia”. A near miss gets partial credit.</li>
        <li><b>Country</b>: the modern country where it was made (or found). A neighbouring country earns some points.</li>
        <li><b>Pinpoint</b>: drop a pin. Points fall off with distance. When the museum only records a country or a people, anywhere inside that uncertainty circle counts as perfect.</li>
        <li><b>Mixed scale</b>: every round picks one of the above at random. The banner above the map tells you which.</li>
      </ul>
      <h3>When</h3>
      <p>
        Drag the timeline, use the arrow keys, or type a year. The scale is stretched toward recent centuries.
        Anything inside the object’s date range scores the full {MAX_TIME.toLocaleString()}. Older objects are
        forgiven more: 100 years off on a Bronze Age pot costs little, while 100 years off on a Rococo snuffbox costs a lot.
      </p>
      <h3>Hints</h3>
      <ul>
        <li>🧱 <b>Material</b>: object type and medium. Costs {Math.round((1 - HINT_COSTS.medium) * 100)}% of the round.</li>
        <li>⏳ <b>Era</b>: a window that contains the date (not centred on it). Halves your date points.</li>
        <li>🧭 <b>Area</b>: the next-larger area. Halves your place points.</li>
        <li>🔍 <b>Zoom out</b> (Close Look mode): each step costs 10%.</li>
      </ul>
      <h3>Formats</h3>
      <ul>
        <li><b>Daily</b>: ten objects, the same for everyone that day, in every mode.</li>
        <li><b>Endless</b>: infinite play. Objects you’ve already seen are held back until you’ve seen most of the collection.</li>
        <li><b>Survival</b>: a round under {Math.round(SURVIVAL.passFraction * 100)}% costs one of {SURVIVAL.lives} lives.</li>
        <li><b>Blitz</b>: {BLITZ_SECONDS} seconds per object. When time runs out, your current guess is submitted.</li>
      </ul>
      <h3>Why the mix feels different every day</h3>
      <p>
        There are no quotas like “one African piece, one East Asian piece”. Each game draws regions at random, weighted
        toward a long-run target where about three quarters of objects come from outside Europe. Some days lean
        Andean, some lean Japanese. Occasionally a <i>Spotlight</i> day goes deep on one part of the world. In Endless,
        the game remembers what you’ve been shown and corrects the balance over time.
      </p>
      <p class="muted small">Max score per round: {(MAX_PLACE + MAX_TIME).toLocaleString()} ({MAX_PLACE.toLocaleString()} place + {MAX_TIME.toLocaleString()} date).</p>
    </div>
  );
}

// ── Stats & collection ──────────────────────────────────────────────────────

const ERA_NAMES = ['Before 1000 BCE', '1000–1 BCE', '1–600 CE', '600–1200', '1200–1600', '1600–1800', '1800–1950'];

export function StatsPage({ data, onBack }: { data: GameData; onBack: () => void }) {
  const stats = useMemo(loadStats, []);
  const collection = useMemo(loadCollection, []);
  const favs = useMemo(() => new Set(loadFavs()), []);
  const [tab, setTab] = useState<'stats' | 'collection'>('stats');
  const [onlyFavs, setOnlyFavs] = useState(false);

  const seen = Object.entries(collection)
    .map(([id, e]) => ({ o: data.byId.get(id), e }))
    .filter((x) => x.o && (!onlyFavs || favs.has(x.o.id)))
    .sort((a, b) => b.e.first.localeCompare(a.e.first));

  const avg = (a?: Acc) => (a && a.n ? a.sum / a.n : null);
  const daily = stats.games.filter((g) => g.format === 'daily');

  const weakest = Object.entries(stats.byRegion)
    .filter(([, a]) => a.n >= 3)
    .map(([id, a]) => ({ id, v: a.sum / a.n }))
    .sort((a, b) => a.v - b.v)[0];

  return (
    <div class="screen page">
      <button class="ghost" onClick={onBack}>← Back</button>
      <div class="tabs">
        <button class={tab === 'stats' ? 'on' : ''} onClick={() => setTab('stats')}>Stats</button>
        <button class={tab === 'collection' ? 'on' : ''} onClick={() => setTab('collection')}>Collection ({Object.keys(collection).length})</button>
      </div>

      {tab === 'stats' && (
        <>
          <div class="stat-tiles">
            <Tile label="Games" value={stats.games.length} />
            <Tile label="Objects seen" value={stats.roundsPlayed} />
            <Tile label="Daily streak" value={stats.streak.count} sub={`best ${stats.streak.best}`} />
            <Tile label="Avg daily" value={daily.length ? `${Math.round((100 * daily.reduce((a, g) => a + g.score / g.max, 0)) / daily.length)}%` : '–'} />
          </div>
          {weakest && (
            <p class="callout">
              Your blind spot so far: <b>{REGIONS.find((r) => r.id === weakest.id)?.name}</b> ({Math.round(weakest.v * 100)}% place accuracy).
            </p>
          )}
          <h3>Place accuracy by part of the world</h3>
          <Bars rows={(Object.keys(BALANCE_GROUP_NAMES) as BalanceGroup[]).map((g) => [BALANCE_GROUP_NAMES[g], avg(stats.byGroup[g]), stats.byGroup[g]?.n ?? 0])} />
          <h3>Date accuracy by era</h3>
          <Bars rows={ERA_NAMES.map((n, i) => [n, avg(stats.byEra[String(i)]), stats.byEra[String(i)]?.n ?? 0])} />
          <h3>Overall by medium</h3>
          <Bars rows={(Object.keys(CATEGORY_NAMES) as Category[]).map((c) => [CATEGORY_NAMES[c], avg(stats.byCat[c]), stats.byCat[c]?.n ?? 0])} />
          <h3>Recent games</h3>
          <table class="games">
            <tbody>
              {stats.games.slice(-15).reverse().map((g, i) => (
                <tr key={i}>
                  <td>{g.date}</td>
                  <td>{g.label}</td>
                  <td class="num">{g.score.toLocaleString()} / {g.max.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'collection' && (
        <>
          <label class="check">
            <input type="checkbox" checked={onlyFavs} onChange={(e) => setOnlyFavs((e.target as HTMLInputElement).checked)} /> Only saved ♥
          </label>
          {!seen.length && <p class="muted">Objects you play appear here, with links to their museum pages.</p>}
          <div class="collection-grid">
            {seen.map(({ o, e }) => (
              <a key={o!.id} class="collection-item" href={o!.url} target="_blank" rel="noopener" title={`${o!.title} · ${o!.place} · ${o!.date}`}>
                <img src={o!.img} alt={o!.title} loading="lazy" />
                <span class="ci-title">{favs.has(o!.id) ? '♥ ' : ''}{o!.title}</span>
                <span class="ci-sub">{o!.place.split(',').slice(-1)[0]} · {Math.round((100 * e.best) / Math.max(1, e.max))}%</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div class="tile">
      <div class="tile-value">{value}</div>
      <div class="tile-label">{label}</div>
      {sub && <div class="tile-sub">{sub}</div>}
    </div>
  );
}

function Bars({ rows }: { rows: [string, number | null, number][] }) {
  return (
    <div class="bars">
      {rows.map(([label, v, n]) => (
        <div class="bar-row" key={label}>
          <span class="bar-label">{label}</span>
          <span class="bar-track">{v !== null && <span class="bar-fill" style={{ width: `${Math.round(v * 100)}%` }} />}</span>
          <span class="bar-value">{v === null ? '–' : `${Math.round(v * 100)}%`} <small class="muted">({n})</small></span>
        </div>
      ))}
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────

export function SettingsPage({ settings, onChange, onBack }: { settings: Settings; onChange: (s: Settings) => void; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const flags = loadFlags();
  const set = (patch: Partial<Settings>) => {
    const s = { ...settings, ...patch };
    saveSettings(s);
    onChange(s);
  };

  async function copyFlags() {
    await navigator.clipboard.writeText(JSON.stringify(flags, null, 1));
    setCopied(true);
  }

  return (
    <div class="screen page">
      <button class="ghost" onClick={onBack}>← Back</button>
      <h1>Settings</h1>
      <div class="settings">
        <label>
          Theme
          <select value={settings.theme} onChange={(e) => set({ theme: (e.target as HTMLSelectElement).value as Settings['theme'] })}>
            <option value="auto">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Distances
          <select value={settings.units} onChange={(e) => set({ units: (e.target as HTMLSelectElement).value as Settings['units'] })}>
            <option value="km">Kilometres</option>
            <option value="mi">Miles</option>
          </select>
        </label>
        <label class="check">
          <input type="checkbox" checked={settings.labels} onChange={(e) => set({ labels: (e.target as HTMLInputElement).checked })} />
          Show region / continent names on the map
        </label>
      </div>
      <h3>Playtesting</h3>
      <p>You’ve flagged {flags.length} object{flags.length === 1 ? '' : 's'}. Copy the list and paste it into your feedback.</p>
      <button disabled={!flags.length} onClick={copyFlags}>{copied ? 'Copied!' : 'Copy flagged objects'}</button>
      <h3>Data</h3>
      <p class="muted">Everything {GAME_NAME} remembers (stats, streaks, collection) stays in this browser.</p>
      <button
        class="danger"
        onClick={() => {
          if (confirm('Erase all stats, streaks, saved objects and daily progress?')) {
            clearAll();
            location.reload();
          }
        }}
      >
        Reset all data
      </button>
    </div>
  );
}
