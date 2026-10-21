import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { geoCircle, geoGraticule10, geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import type { World } from '../geo/world.ts';
import { regionFor } from '../geo/regions.ts';
import type { GameObject, GeoTier, PlaceGuess } from '../game/types.ts';
import { answerId } from '../game/scoring.ts';

const W = 960;
const H = 500;

export interface MapViewProps {
  world: World;
  tier: GeoTier;
  guess: PlaceGuess | null;
  onGuess?: (g: PlaceGuess) => void;
  answer?: GameObject | null;
  /** Unit to outline as a hint (one tier above the current one). */
  hintArea?: { tier: 'continent' | 'region'; id: string } | null;
  showLabels: boolean;
}

export function MapView({ world, tier, guess, onGuess, answer, hintArea, showLabels }: MapViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [t, setT] = useState<ZoomTransform>(zoomIdentity);
  const [hover, setHover] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  const projection = useMemo(() => geoNaturalEarth1().rotate([-11, 0]).fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' }), []);
  const path = useMemo(() => geoPath(projection), [projection]);

  const base = useMemo(
    () => ({
      sphere: path({ type: 'Sphere' }) ?? '',
      graticule: path(geoGraticule10()) ?? '',
      countries: world.countries.map((c) => ({ name: c.name, d: path(c.feature) ?? '' })),
      regions: world.regions.map((r) => ({ id: r.id, name: r.name, d: path(r.feature) ?? '', c: projection(r.center) })),
      continents: world.continents.map((r) => ({ id: r.id, name: r.name, d: path(r.feature) ?? '', c: projection(r.center) })),
    }),
    [world, path, projection],
  );

  // Zoom & pan
  useEffect(() => {
    const svg = svgRef.current!;
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 40])
      .translateExtent([[0, 0], [W, H]])
      .clickDistance(5)
      .on('zoom', (e) => setT(e.transform));
    zoomRef.current = z;
    select(svg).call(z).on('dblclick.zoom', null);
    return () => {
      select(svg).on('.zoom', null);
    };
  }, []);

  // Reset the view between rounds
  useEffect(() => {
    if (!answer && !guess) zoomTo(zoomIdentity, false);
  }, [answer, guess, tier]);

  // On reveal, frame the guess and the answer together
  useEffect(() => {
    if (!answer) return;
    const pts: [number, number][] = [[answer.lon, answer.lat]];
    if (guess) pts.push([guess.lon, guess.lat]);
    const xy = pts.map((p) => projection(p)!).filter(Boolean);
    const xs = xy.map((p) => p[0]);
    const ys = xy.map((p) => p[1]);
    const pad = 80;
    const bw = Math.max(...xs) - Math.min(...xs) + pad * 2;
    const bh = Math.max(...ys) - Math.min(...ys) + pad * 2;
    const k = Math.max(1, Math.min(6, Math.min(W / bw, H / bh)));
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    zoomTo(zoomIdentity.translate(W / 2 - k * cx, H / 2 - k * cy).scale(k), true);
  }, [answer]);

  function zoomTo(tr: ZoomTransform, animate: boolean) {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    setAnimating(animate);
    select(svg).call(zoomRef.current.transform, tr);
    if (animate) setTimeout(() => setAnimating(false), 650);
  }

  function zoomBy(f: number) {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    setAnimating(true);
    select(svg).call(zoomRef.current.scaleBy, f, [W / 2, H / 2]);
    setTimeout(() => setAnimating(false), 300);
  }

  function lonLatFromEvent(e: MouseEvent): [number, number] | null {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const [x, y] = t.invert([pt.x, pt.y]);
    const ll = projection.invert?.([x, y]);
    if (!ll || !Number.isFinite(ll[0])) return null;
    // Natural Earth's invert happily returns points for clicks outside the globe; reject them.
    const back = projection(ll);
    if (!back || Math.hypot(back[0] - x, back[1] - y) > 1) return null;
    return ll as [number, number];
  }

  function unitAt(lon: number, lat: number): string | null {
    if (tier === 'pinpoint') return null;
    const country = world.countryAt(lon, lat, 350);
    if (!country) return null;
    if (tier === 'country') return country;
    const region = regionFor(lon, lat, country);
    if (!region) return null;
    return tier === 'region' ? region.id : region.continent;
  }

  function onClick(e: MouseEvent) {
    if (!onGuess) return;
    const ll = lonLatFromEvent(e);
    if (!ll) return;
    const [lon, lat] = ll;
    if (tier === 'pinpoint') {
      onGuess({ tier, lon, lat });
      return;
    }
    const id = unitAt(lon, lat);
    if (id) onGuess({ tier, id, lon, lat });
  }

  function onMove(e: MouseEvent) {
    if (!onGuess || tier === 'pinpoint') {
      if (hover) setHover(null);
      return;
    }
    const target = e.target as SVGElement;
    const id = target.getAttribute?.('data-unit');
    setHover(id ?? null);
  }

  const k = t.k;
  const guessId = guess && guess.tier !== 'pinpoint' ? guess.id : null;
  const correctId = answer ? answerId(answer, tier) : null;

  const units = tier === 'continent' ? base.continents : tier === 'region' ? base.regions : null;
  const hoverName =
    hover && (tier === 'country' ? hover : (units ?? []).find((u) => u.id === hover)?.name);
  const guessName = guessId ? (tier === 'country' ? guessId : (units ?? []).find((u) => u.id === guessId)?.name) : null;

  const hintD = hintArea ? (hintArea.tier === 'continent' ? base.continents : base.regions).find((u) => u.id === hintArea.id)?.d : null;

  const answerXY = answer ? projection([answer.lon, answer.lat]) : null;
  const guessXY = guess ? projection([guess.lon, guess.lat]) : null;
  const circleD = answer ? path(geoCircle().center([answer.lon, answer.lat]).radius(Math.max(answer.r, 20) / 111.2)() as GeoPermissibleObjects) : null;
  const lineD = answer && guess ? path({ type: 'LineString', coordinates: [[guess.lon, guess.lat], [answer.lon, answer.lat]] }) : null;

  const unitClass = (id: string) =>
    [
      'unit',
      onGuess ? 'interactive' : '',
      id === hover ? 'hover' : '',
      id === guessId ? (answer ? (id === correctId ? 'correct' : 'wrong') : 'selected') : '',
      answer && id === correctId ? 'correct' : '',
    ].join(' ');

  return (
    <div class={`map ${onGuess ? 'is-active' : ''} tier-${tier}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="application"
        aria-label={`World map. ${tier === 'pinpoint' ? 'Click to drop a pin.' : `Click a ${tier} to select it.`}`}
      >
        <g class={animating ? 'zoom-layer animating' : 'zoom-layer'} style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})` }}>
          <path class="sphere" d={base.sphere} />
          <path class="graticule" d={base.graticule} />
          {base.countries.map((c) =>
            tier === 'country' ? (
              <path key={c.name} d={c.d} data-unit={c.name} class={'country ' + unitClass(c.name)} />
            ) : (
              <path key={c.name} d={c.d} class="country" />
            ),
          )}
          {units?.map((u) => <path key={u.id} d={u.d} data-unit={u.id} class={unitClass(u.id)} />)}
          {hintD && <path class="hint-area" d={hintD} />}
          {showLabels && units && !answer &&
            units.map((u) =>
              u.c ? (
                <text key={u.id} class="unit-label" x={u.c[0]} y={u.c[1]} style={{ fontSize: `${11 / Math.sqrt(k)}px` }}>
                  {u.name}
                </text>
              ) : null,
            )}
          {circleD && <path class="answer-radius" d={circleD} />}
          {lineD && <path class="guess-line" d={lineD} style={{ strokeDasharray: `${4 / k} ${4 / k}` }} />}
          {guessXY && (tier === 'pinpoint' || answer) && (
            <g transform={`translate(${guessXY[0]},${guessXY[1]}) scale(${1 / k})`} class="pin guess-pin">
              <circle r="7" />
              <circle r="2.5" class="pin-dot" />
            </g>
          )}
          {answerXY && (
            <g transform={`translate(${answerXY[0]},${answerXY[1]}) scale(${1 / k})`} class="pin answer-pin">
              <circle r="8" />
              <circle r="3" class="pin-dot" />
            </g>
          )}
        </g>
      </svg>
      <div class="map-controls">
        <button type="button" onClick={() => zoomBy(1.8)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoomBy(1 / 1.8)} aria-label="Zoom out">−</button>
        <button type="button" onClick={() => zoomTo(zoomIdentity, true)} aria-label="Reset view">⟲</button>
      </div>
      <div class="map-status" aria-live="polite">
        {answer ? null : hoverName ? <span>{hoverName}</span> : guessName ? <span>Selected: <b>{guessName}</b></span> : tier === 'pinpoint' && guess ? <span>Pin placed. Scroll or pinch to zoom; click again to move it.</span> : null}
      </div>
    </div>
  );
}
