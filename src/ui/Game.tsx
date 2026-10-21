import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { BLITZ_SECONDS, MAX_PLACE, MAX_TIME, ROUNDS_PER_GAME, SURVIVAL } from '../config.ts';
import type { GameData } from '../data/load.ts';
import { CATEGORY_NAMES, SOURCE_NAMES } from '../data/types.ts';
import { CONTINENT_BY_ID, REGION_BY_ID, type BalanceGroup } from '../geo/regions.ts';
import { COLLECTION_BY_ID, configKey, configLabel, tierForRound } from '../game/modes.ts';
import { hashString, rngFrom, mulberry32 } from '../game/rng.ts';
import { applyHints, areaHint, eraWindow, scorePlace, scoreTime } from '../game/scoring.ts';
import { eraBucket, pickGame, Picker } from '../game/selection.ts';
import {
  addFlag, addToCollection, bump, dailyNumber, loadDaily, loadFavs, loadHistory, loadStats, recordServed,
  saveDaily, saveStats, todayKey, toggleFav, updateStreak, type Settings,
} from '../game/storage.ts';
import { formatRange } from '../game/timeline.ts';
import type { GameConfig, GameObject, GeoTier, HintState, PlaceGuess, RoundResult } from '../game/types.ts';
import { MapView } from './MapView.tsx';
import { Results } from './Results.tsx';
import { Timeline } from './Timeline.tsx';

const NO_HINTS: HintState = { medium: false, era: false, area: false, zoomSteps: 0 };
const CLOSE_LOOK_SCALES = [3.2, 2.1, 1.4, 1];

interface Props {
  data: GameData;
  config: GameConfig;
  settings: Settings;
  onExit: () => void;
  onPlay: (c: GameConfig) => void;
}

export function Game({ data, config, settings, onExit, onPlay }: Props) {
  const key = configKey(config);
  const date = useMemo(() => todayKey(), []);
  const collection = COLLECTION_BY_ID.get(config.collection)!;
  const pool = useMemo(() => data.objects.filter(collection.filter), [data, collection]);
  const singleCategory = ['paintings', 'sculpture', 'textiles', 'ceramics', 'metal', 'paper'].includes(config.collection);

  // ── Set up the object sequence ────────────────────────────────────────────
  const setup = useMemo(() => {
    const isDaily = config.format === 'daily';
    if (isDaily) {
      const saved = loadDaily(date, key);
      const seed = `${date}|${key}`;
      const tierRng = rngFrom(seed + '|tiers');
      const tiers = Array.from({ length: ROUNDS_PER_GAME }, () => tierForRound(config.geo, tierRng));
      if (saved && saved.objectIds.every((id) => data.byId.has(id))) {
        return { objects: saved.objectIds.map((id) => data.byId.get(id)!), tiers, results: saved.results, spotlight: saved.spotlight ?? null, picker: null };
      }
      // Only objects that were in the pool before today, so a pool update can't change today's puzzle.
      const eligible = pool.filter((o) => !o.added || o.added < date);
      const { objects, spotlight } = pickGame(eligible.length >= 50 ? eligible : pool, ROUNDS_PER_GAME, {
        rng: rngFrom(seed),
        balanced: collection.balanced,
        spreadCategories: !singleCategory,
        spotlightChance: 0.12,
      });
      return { objects, tiers, results: [] as RoundResult[], spotlight, picker: null };
    }
    const rng = mulberry32((Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0);
    const history = loadHistory();
    const picker = new Picker(pool, {
      rng,
      balanced: collection.balanced,
      spreadCategories: !singleCategory,
      recentGroups: history.recentGroups,
      exclude: new Set(history.seen),
    });
    const tiers: (GeoTier | null)[] = [];
    const objects: GameObject[] = [];
    const first = picker.next();
    if (first) {
      objects.push(first);
      tiers.push(tierForRound(config.geo, rng));
    }
    return { objects, tiers, results: [] as RoundResult[], spotlight: null, picker: { picker, rng } };
  }, [data, key]);

  const [objects, setObjects] = useState<GameObject[]>(setup.objects);
  const [tiers, setTiers] = useState<(GeoTier | null)[]>(setup.tiers);
  const [results, setResults] = useState<RoundResult[]>(setup.results);
  const [phase, setPhase] = useState<'guess' | 'reveal' | 'done'>(
    config.format === 'daily' && setup.results.length >= setup.objects.length ? 'done' : 'guess',
  );
  const idx = phase === 'reveal' ? results.length - 1 : results.length;
  const obj = objects[idx] as GameObject | undefined;
  const tier = tiers[idx] ?? null;

  const [place, setPlace] = useState<PlaceGuess | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [hints, setHints] = useState<HintState>(NO_HINTS);
  const [imgState, setImgState] = useState<'loading' | 'ok' | 'fallback' | 'error'>('loading');
  const [lightbox, setLightbox] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(BLITZ_SECONDS);
  const [fav, setFav] = useState(() => (setup.objects[setup.results.length] ? loadFavs().includes(setup.objects[setup.results.length].id) : false));
  const [flagOpen, setFlagOpen] = useState(false);
  const statsRecorded = useRef(config.format === 'daily' && setup.results.length >= setup.objects.length);

  const lives = config.format === 'survival' ? SURVIVAL.lives - results.filter((r) => r.max > 0 && r.total / r.max < SURVIVAL.passFraction).length : null;

  // Per-round UI state is reset synchronously in advance(), so a fast click on the next
  // round can't be wiped out by a late effect.
  function resetRound(next: GameObject | undefined) {
    setPlace(null);
    setYear(null);
    setHints(NO_HINTS);
    setImgState('loading');
    setSecondsLeft(BLITZ_SECONDS);
    setFlagOpen(false);
    setFav(next ? loadFavs().includes(next.id) : false);
  }

  // Preload the next image
  useEffect(() => {
    const next = objects[idx + 1];
    if (next) new Image().src = next.img;
  }, [idx, objects]);

  // Blitz timer
  useEffect(() => {
    if (config.format !== 'blitz' || phase !== 'guess' || !obj) return;
    if (secondsLeft <= 0) {
      submit(true);
      return;
    }
    const h = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(h);
  }, [secondsLeft, phase, obj?.id]);

  // Keyboard: Enter submits / advances
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (phase === 'guess' && canSubmit) submit(false);
      else if (phase === 'reveal') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const needPlace = tier !== null;
  const needTime = config.time;
  const canSubmit = (!needPlace || place !== null) && (!needTime || year !== null);

  function unitCenter(t: GeoTier, id: string): [number, number] | undefined {
    if (t === 'continent') return data.world.continents.find((c) => c.id === id)?.center;
    if (t === 'region') return REGION_BY_ID.get(id)?.center;
    if (t === 'country') return data.world.countryByName.get(id)?.center;
    return undefined;
  }

  function submit(timedOut: boolean) {
    if (!obj || phase !== 'guess') return;
    const p = needPlace && place ? scorePlace(obj, place, unitCenter) : null;
    const rawPlace = needPlace ? (p?.score ?? 0) : null;
    const rawTime = needTime ? (year === null ? 0 : scoreTime(obj, year)) : null;
    const adj = applyHints(rawPlace, rawTime, hints);
    const max = (needPlace ? MAX_PLACE : 0) + (needTime ? MAX_TIME : 0);
    const r: RoundResult = {
      objectId: obj.id,
      tier,
      place: needPlace ? place : null,
      year: needTime ? year : null,
      placeScore: adj.place,
      timeScore: adj.time,
      km: p ? p.km : null,
      correctUnit: p ? p.correct : null,
      hints,
      total: (adj.place ?? 0) + (adj.time ?? 0),
      max,
      ...(timedOut ? { timedOut: true } : {}),
    };
    const nextResults = [...results, r];
    setResults(nextResults);
    setPhase('reveal');
    recordRound(obj, r);
    if (config.format === 'daily') {
      saveDaily({ configKey: key, label: configLabel(config), date, objectIds: objects.map((o) => o.id), results: nextResults, finished: nextResults.length >= objects.length, spotlight: setup.spotlight });
    }
  }

  function skipBrokenImage() {
    if (!obj) return;
    const r: RoundResult = { objectId: obj.id, tier, place: null, year: null, placeScore: null, timeScore: null, km: null, correctUnit: null, hints: NO_HINTS, total: 0, max: 0 };
    const nextResults = [...results, r];
    setResults(nextResults);
    if (config.format === 'daily') {
      saveDaily({ configKey: key, label: configLabel(config), date, objectIds: objects.map((o) => o.id), results: nextResults, finished: nextResults.length >= objects.length, spotlight: setup.spotlight });
    }
    advance(nextResults);
  }

  function recordRound(o: GameObject, r: RoundResult) {
    const s = loadStats();
    s.roundsPlayed += 1;
    if (r.placeScore !== null) {
      bump(s.byGroup, o.group, r.placeScore / MAX_PLACE);
      bump(s.byRegion, o.region, r.placeScore / MAX_PLACE);
    }
    if (r.timeScore !== null) bump(s.byEra, String(eraBucket(o)), r.timeScore / MAX_TIME);
    if (r.max > 0) bump(s.byCat, o.cat, r.total / r.max);
    saveStats(s);
    addToCollection(o.id, r.total, r.max);
    recordServed([o.group], [o.id]);
  }

  function isOver(rs: RoundResult[]): boolean {
    if (config.format === 'daily') return rs.length >= objects.length;
    if (config.format === 'blitz') return rs.length >= ROUNDS_PER_GAME;
    if (config.format === 'survival') {
      const lost = rs.filter((r) => r.max > 0 && r.total / r.max < SURVIVAL.passFraction).length;
      return lost >= SURVIVAL.lives;
    }
    return false;
  }

  function next() {
    advance(results);
  }

  function advance(rs: RoundResult[]) {
    if (isOver(rs)) return finish(rs);
    let nextObj = objects[rs.length];
    if (!nextObj) {
      if (!setup.picker) return finish(rs);
      if (rs.length % ROUNDS_PER_GAME === 0) setup.picker.picker.resetGame();
      const o = setup.picker.picker.next();
      if (!o) return finish(rs);
      nextObj = o;
      setObjects([...objects, o]);
      setTiers([...tiers, tierForRound(config.geo, setup.picker.rng)]);
    }
    resetRound(nextObj);
    setPhase('guess');
  }

  function finish(rs: RoundResult[]) {
    setPhase('done');
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    const played = rs.filter((r) => r.max > 0);
    if (!played.length) return;
    const s = loadStats();
    const score = played.reduce((a, r) => a + r.total, 0);
    const max = played.reduce((a, r) => a + r.max, 0);
    s.games.push({ key, label: configLabel(config), format: config.format, date, score, max, rounds: played.length });
    const bestKey = config.format === 'endless' || config.format === 'survival' ? `${key}:rounds` : key;
    const value = config.format === 'survival' ? played.length : config.format === 'endless' ? Math.round((score / max) * 100) : score;
    s.best[bestKey] = Math.max(s.best[bestKey] ?? 0, value);
    if (config.format === 'daily') updateStreak(s, date);
    saveStats(s);
  }

  if (!pool.length) {
    return (
      <div class="screen center">
        <p>No objects match this collection yet. The pool may still be building.</p>
        <button onClick={onExit}>Back</button>
      </div>
    );
  }

  if (phase === 'done') {
    const title = config.format === 'daily' ? `#${dailyNumber(date)} · ${configLabel(config)}` : configLabel(config);
    return (
      <Results
        data={data}
        config={config}
        title={title}
        objects={objects}
        results={results}
        spotlight={setup.spotlight as BalanceGroup | null}
        onExit={onExit}
        onPlay={onPlay}
      />
    );
  }

  if (!obj) return null;

  const result = phase === 'reveal' ? results[results.length - 1] : null;
  const totalSoFar = results.reduce((a, r) => a + r.total, 0);
  const roundLabel =
    config.format === 'daily' ? `${idx + 1} / ${objects.length}` : config.format === 'blitz' ? `${idx + 1} / ${ROUNDS_PER_GAME}` : `Round ${idx + 1}`;
  const zoomScale = config.closeLook && phase === 'guess' ? CLOSE_LOOK_SCALES[Math.min(hints.zoomSteps, CLOSE_LOOK_SCALES.length - 1)] : 1;
  const h = hashString(obj.id);
  const origin = `${30 + (h % 40)}% ${30 + ((h >> 8) % 40)}%`;
  const area = tier ? areaHint(obj, tier) : null;
  const hintAreaUnit =
    hints.area && tier && tier !== 'continent'
      ? tier === 'region'
        ? { tier: 'continent' as const, id: obj.continent }
        : { tier: 'region' as const, id: obj.region }
      : null;
  const era = eraWindow(obj);

  return (
    <div class="screen game">
      <header class="game-bar">
        <button class="ghost" onClick={onExit} aria-label="Leave game">←</button>
        <div class="game-bar-mode">{configLabel(config)}</div>
        <div class="game-bar-stats">
          <span class="pill">{roundLabel}</span>
          <span class="pill">{totalSoFar.toLocaleString()} pts</span>
          {lives !== null && <span class="pill lives" aria-label={`${lives} lives`}>{'♥'.repeat(Math.max(0, lives))}{'♡'.repeat(Math.max(0, SURVIVAL.lives - lives))}</span>}
          {config.format === 'blitz' && phase === 'guess' && <span class={`pill timer ${secondsLeft <= 5 ? 'urgent' : ''}`}>{secondsLeft}s</span>}
          {config.format === 'endless' && results.length > 0 && phase === 'guess' && (
            <button class="small ghost" onClick={() => finish(results)}>Finish</button>
          )}
        </div>
      </header>

      <div class="game-body">
        <section class="artwork" aria-label="Artwork">
          <div class={`artwork-frame ${imgState}`} onClick={() => imgState !== 'error' && setLightbox(true)}>
            {imgState === 'loading' && <div class="spinner" aria-label="Loading image" />}
            {imgState !== 'error' ? (
              <img
                key={obj.id + imgState}
                src={imgState === 'fallback' ? obj.imgFull : obj.img}
                alt="The object to identify"
                style={{ transform: `scale(${zoomScale})`, transformOrigin: origin }}
                onLoad={() => setImgState((s) => (s === 'fallback' ? 'fallback' : 'ok'))}
                onError={() => setImgState((s) => (s === 'loading' && obj.imgFull ? 'fallback' : 'error'))}
              />
            ) : (
              <div class="img-error">
                <p>This image didn’t load.</p>
                {phase === 'guess' && <button onClick={skipBrokenImage}>Skip this object (no penalty)</button>}
              </div>
            )}
            {imgState !== 'error' && <span class="expand-hint">⤢</span>}
          </div>

          {phase === 'guess' && (
            <div class="hints">
              {config.closeLook && hints.zoomSteps < CLOSE_LOOK_SCALES.length - 1 && (
                <button class="hint" onClick={() => setHints({ ...hints, zoomSteps: hints.zoomSteps + 1 })}>
                  🔍 Zoom out <small>−10%</small>
                </button>
              )}
              <button class="hint" disabled={hints.medium} onClick={() => setHints({ ...hints, medium: true })}>
                {hints.medium ? (
                  <span class="hint-text">
                    {obj.kind ? <b>{obj.kind}</b> : null}
                    {obj.kind && obj.medium ? ' · ' : ''}
                    {obj.medium && obj.medium.length > 110 ? obj.medium.slice(0, 108) + '…' : obj.medium}
                    {!obj.kind && !obj.medium ? CATEGORY_NAMES[obj.cat] : ''}
                  </span>
                ) : (
                  <>🧱 Material <small>−15%</small></>
                )}
              </button>
              {needTime && (
                <button class="hint" disabled={hints.era} onClick={() => setHints({ ...hints, era: true })}>
                  {hints.era ? <span class="hint-text">Made between {formatRange(era[0], era[1])}</span> : <>⏳ Era <small>½ date pts</small></>}
                </button>
              )}
              {area && (
                <button class="hint" disabled={hints.area} onClick={() => setHints({ ...hints, area: true })}>
                  {hints.area ? <span class="hint-text">{area}</span> : <>🧭 Area <small>½ place pts</small></>}
                </button>
              )}
            </div>
          )}
        </section>

        <section class="guess-panel">
          {tier && (
            <>
              <div class="tier-banner">
                <span class={`tier-chip tier-${tier}`}>{TIER_PROMPTS[tier]}</span>
                {config.geo === 'mixed' && <span class="muted"> · scale changes every round</span>}
              </div>
              <MapView
                world={data.world}
                tier={tier}
                guess={place}
                onGuess={phase === 'guess' ? setPlace : undefined}
                answer={phase === 'reveal' ? obj : null}
                hintArea={hintAreaUnit}
                showLabels={settings.labels}
                roundKey={`${idx}:${obj.id}`}
              />
            </>
          )}
          {needTime && (
            <Timeline
              year={phase === 'reveal' ? (result?.year ?? null) : year}
              onChange={phase === 'guess' ? setYear : undefined}
              answer={phase === 'reveal' ? obj : null}
              hint={hints.era && phase === 'guess' ? era : null}
            />
          )}
          {phase === 'guess' && (
            <button class="primary submit" disabled={!canSubmit} onClick={() => submit(false)}>
              {canSubmit ? 'Make guess' : needPlace && !place ? (tier === 'pinpoint' ? 'Drop a pin on the map' : `Pick a ${tier} on the map`) : 'Pick a year'}
            </button>
          )}
        </section>
      </div>

      {phase === 'reveal' && result && (
        <RevealPanel
          obj={obj}
          result={result}
          units={settings.units}
          fav={fav}
          onFav={() => setFav(toggleFav(obj.id))}
          flagOpen={flagOpen}
          setFlagOpen={setFlagOpen}
          isLast={isOver(results) || (!setup.picker && results.length >= objects.length)}
          livesLost={config.format === 'survival' && result.max > 0 && result.total / result.max < SURVIVAL.passFraction}
          onNext={next}
        />
      )}

      {lightbox && (
        <div class="lightbox" onClick={() => setLightbox(false)} role="dialog" aria-label="Full-size image">
          <img src={obj.imgFull || obj.img} alt="" style={config.closeLook && phase === 'guess' ? { transform: `scale(${zoomScale})`, transformOrigin: origin } : undefined} />
          <button class="lightbox-close" aria-label="Close">✕</button>
        </div>
      )}
    </div>
  );
}

const TIER_PROMPTS: Record<GeoTier, string> = {
  continent: 'Which continent?',
  region: 'Which region?',
  country: 'Which modern country?',
  pinpoint: 'Pin it on the map',
};

interface RevealProps {
  obj: GameObject;
  result: RoundResult;
  units: 'km' | 'mi';
  fav: boolean;
  onFav: () => void;
  flagOpen: boolean;
  setFlagOpen: (b: boolean) => void;
  isLast: boolean;
  livesLost: boolean;
  onNext: () => void;
}

function RevealPanel({ obj, result, units, fav, onFav, flagOpen, setFlagOpen, isLast, livesLost, onNext }: RevealProps) {
  const [flagged, setFlagged] = useState(false);
  const dist = result.km === null ? null : units === 'mi' ? `${Math.round(result.km * 0.621).toLocaleString()} mi` : `${Math.round(result.km).toLocaleString()} km`;
  const where = REGION_BY_ID.get(obj.region)?.name;
  const cont = CONTINENT_BY_ID.get(obj.continent)?.name;
  const timeOff = result.year === null ? null : result.year < obj.y0 ? obj.y0 - result.year : result.year > obj.y1 ? result.year - obj.y1 : 0;

  function flag(reason: string) {
    addFlag({ id: obj.id, reason, at: new Date().toISOString() });
    setFlagged(true);
    setFlagOpen(false);
  }

  return (
    <div class="reveal" role="dialog" aria-label="Answer">
      <div class="reveal-inner">
        <div class="reveal-scores">
          {result.placeScore !== null && (
            <div class="score-block">
              <div class="score-num">{result.placeScore.toLocaleString()}</div>
              <div class="score-label">
                place
                {result.correctUnit === true ? ' · correct!' : result.correctUnit === false ? ' · not quite' : dist ? ` · ${dist} away` : ''}
              </div>
            </div>
          )}
          {result.timeScore !== null && (
            <div class="score-block">
              <div class="score-num">{result.timeScore.toLocaleString()}</div>
              <div class="score-label">date · {timeOff === null ? 'no guess' : timeOff === 0 ? 'spot on!' : `${timeOff.toLocaleString()} yrs off`}</div>
            </div>
          )}
          {result.timedOut && <div class="muted">⏱ Time ran out</div>}
          {livesLost && <div class="life-lost">−1 ♥</div>}
        </div>
        <h2 class="reveal-title">{obj.title}</h2>
        <dl class="facts">
          {obj.artist && (<><dt>Artist</dt><dd>{obj.artist}</dd></>)}
          {obj.culture && (<><dt>Culture</dt><dd>{obj.culture}</dd></>)}
          <dt>Made in</dt>
          <dd>{obj.place} <span class="muted">({where}, {cont})</span></dd>
          <dt>Date</dt>
          <dd>{obj.date}</dd>
          {obj.medium && (<><dt>Medium</dt><dd>{obj.medium}</dd></>)}
          <dt>Collection</dt>
          <dd>
            <a href={obj.url} target="_blank" rel="noopener">{SOURCE_NAMES[obj.src]} ↗</a>
            {obj.credit ? <span class="muted"> · {obj.credit}</span> : null}
          </dd>
        </dl>
        {obj.r >= 300 && <p class="muted small">The museum records this only at the country/region level, so anywhere within ~{Math.round(obj.r / 10) * 10} km of the marker scored full points.</p>}
        <div class="reveal-actions">
          <button class={`ghost ${fav ? 'on' : ''}`} onClick={onFav} aria-pressed={fav}>{fav ? '♥ Saved' : '♡ Save'}</button>
          <div class="flag-wrap">
            <button class="ghost" onClick={() => setFlagOpen(!flagOpen)} disabled={flagged}>{flagged ? '⚑ Flagged, thanks' : '⚑ Report'}</button>
            {flagOpen && (
              <div class="flag-menu">
                {['Location looks wrong', 'Date looks wrong', 'Bad / misleading image', 'Too easy', 'Unfair / impossible', 'Loved this one'].map((r) => (
                  <button key={r} onClick={() => flag(r)}>{r}</button>
                ))}
              </div>
            )}
          </div>
          <button class="primary" onClick={onNext} autoFocus>{isLast ? 'See results' : 'Next →'}</button>
        </div>
      </div>
    </div>
  );
}

