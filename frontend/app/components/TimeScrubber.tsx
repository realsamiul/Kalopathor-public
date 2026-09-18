'use client';

import {useTranslations} from 'next-intl';
import {Pause, Play, Satellite, Waypoints} from 'lucide-react';
import type {CSSProperties} from 'react';
import {GIBS_DATES, GIBS_EVENT_DATE, GIBS_DEFAULT_DATE} from '@/lib/map-config';
import {PREDICTION_DATES} from '@/lib/workflow';

interface Props {
  mode: 'bar' | 'chips';
  gibsDate: string;
  onGibsDate: (d: string) => void;
  imergClipped: boolean;
  horizon: number;
  onHorizon: (h: number) => void;
  timeIndex: number;
  onTimeIndex: (i: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  forecastAvailable: boolean;
  onExpand?: () => void;
}

function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en', {day: 'numeric', month: 'short', timeZone: 'UTC'});
}

function fillStyle(value: number, max: number): CSSProperties {
  const pct = max <= 0 ? 0 : (value / max) * 100;
  return {'--fill': `${pct}%`} as CSSProperties;
}

export default function TimeScrubber({
  mode,
  gibsDate,
  onGibsDate,
  imergClipped,
  horizon,
  onHorizon,
  timeIndex,
  onTimeIndex,
  playing,
  onTogglePlay,
  forecastAvailable,
  onExpand
}: Props) {
  const t = useTranslations();
  const dateIndex = Math.max(0, GIBS_DATES.indexOf(gibsDate));
  const isEvent = gibsDate === GIBS_EVENT_DATE;

  if (mode === 'chips') {
    // Compact mobile strip: play + two tappable pills (open the full time sheet)
    return (
      <div className="glass-strong z-30 flex shrink-0 items-center gap-1.5 border-x-0 border-b-0 px-2 py-1.5">
        <button
          onClick={onTogglePlay}
          aria-label={playing ? t('time.pause') : t('time.play')}
          className={`rounded-md border p-1.5 transition-colors ${
            playing
              ? 'border-accent/50 bg-accent/15 text-accent'
              : 'border-line text-mist-2 hover:text-mist-1'
          }`}
        >
          {playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
        </button>
        <button
          onClick={onExpand}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-line bg-ink-2/60 px-2 py-1.5 text-left"
        >
          <Satellite size={13} className="shrink-0 text-accent" aria-hidden />
          <span className="min-w-0 truncate font-mono text-[10px] text-mist-1">
            {shortDate(gibsDate)} · VIIRS
          </span>
          {isEvent && (
            <span className="shrink-0 rounded bg-accent2/20 px-1 py-px font-mono text-[8px] uppercase tracking-wider text-accent2">
              {t('timeline.eventPass')}
            </span>
          )}
        </button>
        <button
          onClick={onExpand}
          disabled={!forecastAvailable}
          className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-colors ${
            forecastAvailable ? 'border-line bg-ink-2/60' : 'border-line opacity-50'
          }`}
        >
          <Waypoints size={13} className={`shrink-0 ${forecastAvailable ? 'text-warn' : 'text-mist-3'}`} aria-hidden />
          <span className="min-w-0 truncate font-mono text-[10px] text-mist-1">
            {forecastAvailable ? `T+${horizon} · ${shortDate(PREDICTION_DATES[timeIndex])}` : t('timeline.roadmap')}
          </span>
        </button>
      </div>
    );
  }

  // Full in-flow bar (desktop / time sheet)
  return (
    <div className="glass-strong flex shrink-0 flex-col gap-3 border-x-0 border-b-0 px-3 py-2.5 lg:flex-row lg:items-center lg:gap-5">
      {/* Imagery date scrubber */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-accent">
            <Satellite size={11} aria-hidden />
            {t('timeline.imagery')}
          </span>
          <span className="font-mono text-[11px] font-semibold text-accent">{gibsDate}</span>
          <span className="font-mono text-[9px] text-mist-3">VIIRS</span>
          {isEvent && (
            <span className="rounded bg-accent2/15 px-1.5 py-px font-mono text-[8.5px] uppercase tracking-wider text-accent2">
              {t('timeline.eventPass')}
            </span>
          )}
          {imergClipped && (
            <span className="rounded bg-warn/15 px-1.5 py-px font-mono text-[8.5px] uppercase tracking-wider text-est">
              {t('layers.note.capped')}
            </span>
          )}
          <button
            type="button"
            onClick={() => onGibsDate(isEvent ? GIBS_DEFAULT_DATE : GIBS_EVENT_DATE)}
            className={`ml-auto whitespace-nowrap rounded px-2 py-0.5 font-mono text-[9px] transition-colors ${
              isEvent ? 'bg-accent text-ink-0' : 'bg-ink-3 text-mist-2 hover:text-mist-1'
            }`}
          >
            {t('timeline.eventPass')}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[9px] text-mist-3 sm:block">{GIBS_DATES[0]}</span>
          <input
            type="range"
            min={0}
            max={GIBS_DATES.length - 1}
            value={dateIndex}
            onChange={(e) => onGibsDate(GIBS_DATES[Number(e.target.value)])}
            className="scrub scrub-teal min-w-0 flex-1"
            style={fillStyle(dateIndex, GIBS_DATES.length - 1)}
            aria-label={t('timeline.imagery')}
          />
          <span className="hidden font-mono text-[9px] text-mist-3 sm:block">
            {GIBS_DATES[GIBS_DATES.length - 1]}
          </span>
        </div>
      </div>

      {/* Forecast horizon + prediction date */}
      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${!forecastAvailable ? 'opacity-60' : ''}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-warn">
            <Waypoints size={11} aria-hidden />
            {t('timeline.forecast7d')}
          </span>
          <div className="flex gap-1">
            {[1, 3, 5, 7].map((h) => (
              <button
                key={h}
                onClick={() => onHorizon(h)}
                disabled={!forecastAvailable}
                className={`rounded px-2 py-0.5 font-mono text-[10.5px] transition-colors ${
                  horizon === h
                    ? 'bg-warn text-ink-0'
                    : 'bg-ink-3 text-mist-2 hover:text-mist-1'
                }`}
              >
                T+{h}
              </button>
            ))}
          </div>
          {!forecastAvailable && (
            <span className="rounded bg-warn/15 px-1.5 py-px font-mono text-[8.5px] uppercase tracking-wider text-est">
              {t('timeline.roadmapNote')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={PREDICTION_DATES.length - 1}
            value={timeIndex}
            disabled={!forecastAvailable}
            onChange={(e) => onTimeIndex(Number(e.target.value))}
            className="scrub scrub-amber min-w-0 flex-1"
            style={fillStyle(timeIndex, PREDICTION_DATES.length - 1)}
            aria-label={t('timeline.forecast7d')}
          />
          <span className="font-mono text-[11px] font-semibold text-warn">
            {PREDICTION_DATES[timeIndex]}
          </span>
        </div>
      </div>
    </div>
  );
}
