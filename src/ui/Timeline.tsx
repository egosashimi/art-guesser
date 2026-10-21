import { useRef, useState } from 'preact/hooks';
import { formatRange, formatYear, posToYear, snapYear, TICKS, yearToPos, YEAR_MAX, YEAR_MIN } from '../game/timeline.ts';

export interface TimelineProps {
  year: number | null;
  onChange?: (y: number) => void;
  answer?: { y0: number; y1: number } | null;
  hint?: [number, number] | null;
}

const ERAS: [number, number, string][] = [
  [-4000, -1200, 'Bronze Age & earlier'],
  [-1200, 500, 'Classical antiquity'],
  [500, 1400, 'Medieval'],
  [1400, 1800, 'Early modern'],
  [1800, 1950, 'Modern'],
];

export function Timeline({ year, onChange, answer, hint }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [typed, setTyped] = useState('');
  const [era, setEra] = useState<'BCE' | 'CE'>('CE');

  function setFromClientX(x: number) {
    if (!onChange || !trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    onChange(snapYear(posToYear((x - r.left) / r.width)));
  }

  function onPointerDown(e: PointerEvent) {
    if (!onChange) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    setFromClientX(e.clientX);
  }

  function onKey(e: KeyboardEvent) {
    if (!onChange) return;
    const y = year ?? 1000;
    const step = e.shiftKey ? 100 : y < -1000 ? 50 : y < 0 ? 25 : 10;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(YEAR_MIN, y - step));
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(YEAR_MAX, y + step));
    else return;
    e.preventDefault();
  }

  function submitTyped(e: Event) {
    e.preventDefault();
    const n = parseInt(typed, 10);
    if (!Number.isFinite(n) || !onChange) return;
    const y = era === 'BCE' ? -Math.abs(n) : Math.abs(n);
    onChange(Math.max(YEAR_MIN, Math.min(YEAR_MAX, y)));
    setTyped('');
  }

  const pct = (y: number) => `${(yearToPos(y) * 100).toFixed(3)}%`;

  return (
    <div class={`timeline ${onChange ? 'is-active' : ''}`}>
      <div class="timeline-head">
        <span class="timeline-value">{year === null ? (onChange ? 'Drag to pick a year' : 'No date guessed') : formatYear(year)}</span>
        {onChange && (
          <form class="year-entry" onSubmit={submitTyped}>
            <input
              inputMode="numeric"
              aria-label="Type a year"
              placeholder="Year"
              value={typed}
              onInput={(e) => setTyped((e.target as HTMLInputElement).value.replace(/[^\d]/g, '').slice(0, 4))}
            />
            <button type="button" class="era-toggle" onClick={() => setEra(era === 'CE' ? 'BCE' : 'CE')} aria-label="Toggle BCE / CE">
              {era}
            </button>
            <button type="submit" class="small">Set</button>
          </form>
        )}
        {answer && <span class="timeline-answer-label">Made {formatRange(answer.y0, answer.y1)}</span>}
      </div>
      <div
        ref={trackRef}
        class={`timeline-track ${dragging ? 'dragging' : ''}`}
        role="slider"
        tabIndex={onChange ? 0 : -1}
        aria-valuemin={YEAR_MIN}
        aria-valuemax={YEAR_MAX}
        aria-valuenow={year ?? undefined}
        aria-valuetext={year === null ? 'none' : formatYear(year)}
        aria-label="Year"
        onPointerDown={onPointerDown}
        onPointerMove={(e) => dragging && setFromClientX(e.clientX)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={onKey}
      >
        {ERAS.map(([a, b, name], i) => (
          <div key={name} class={`era era-${i}`} style={{ left: pct(a), width: `calc(${pct(b)} - ${pct(a)})` }} title={name}>
            <span>{name}</span>
          </div>
        ))}
        {hint && <div class="timeline-hint" style={{ left: pct(hint[0]), width: `calc(${pct(hint[1])} - ${pct(hint[0])})` }} />}
        {answer && (
          <div
            class="timeline-answer"
            style={{ left: pct(answer.y0), width: `max(4px, calc(${pct(answer.y1)} - ${pct(answer.y0)}))` }}
          />
        )}
        {year !== null && <div class="timeline-thumb" style={{ left: pct(year) }} />}
      </div>
      <div class="timeline-ticks" aria-hidden="true">
        {TICKS.map((y) => (
          <span key={y} style={{ left: pct(y) }}>
            {y < 0 ? `${-y} BCE` : y === 0 ? '0' : y}
          </span>
        ))}
      </div>
    </div>
  );
}
