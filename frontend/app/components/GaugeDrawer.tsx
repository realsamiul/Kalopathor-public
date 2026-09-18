'use client';

import {useTranslations} from 'next-intl';
import {Gauge as GaugeIcon, X} from 'lucide-react';
import {useEffect, useState} from 'react';

export interface GaugePoint {
  date: string;
  level_m: number;
  source: string;
}

export interface GaugeSeries {
  station: string;
  river: string;
  district: string;
  danger_level_m: number | null;
  points: GaugePoint[];
}

export interface GaugeFeatureProps {
  gauge_id: string;
  station: string;
  river: string;
  district: string;
  water_level_m: number;
  danger_level_m: number | null;
  difference_m: number | null;
  status: string;
  as_of: string;
}

const W = 340;
const H = 170;
const PAD = {l: 34, r: 12, t: 14, b: 26};

let hydroCache: GaugeSeries[] | null = null;

function loadSeries(setSeries: (s: GaugeSeries[]) => void) {
  if (hydroCache) {
    setSeries(hydroCache);
    return;
  }
  fetch('/data/ffwc_hydrographs.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`hydro ${r.status}`))))
    .then((d: {stations: GaugeSeries[]}) => {
      hydroCache = d.stations;
      setSeries(d.stations);
    })
    .catch((err) => console.error('hydrograph load failed', err));
}

function pathFor(points: GaugePoint[], x: (i: number) => number, y: (v: number) => number): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.level_m).toFixed(1)}`).join(' ');
}

export default function GaugeDrawer({
  gauge,
  onClose
}: {
  gauge: GaugeFeatureProps;
  onClose: () => void;
}) {
  const t = useTranslations();
  const [series, setSeries] = useState<GaugeSeries[] | null>(hydroCache);

  useEffect(() => {
    if (!hydroCache) loadSeries(setSeries);
  }, []);

  const data = series?.find((s) => s.station === gauge.station);
  const danger = gauge.danger_level_m ?? data?.danger_level_m ?? null;
  const tone =
    gauge.status === 'danger'
      ? {text: '#f43f5e', bg: 'rgba(244,63,94,.12)', border: 'rgba(244,63,94,.4)'}
      : gauge.status === 'warning'
        ? {text: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.4)'}
        : {text: '#2dd4bf', bg: 'rgba(45,212,191,.12)', border: 'rgba(45,212,191,.4)'};

  let chart: React.ReactNode = null;
  if (data && data.points.length > 1) {
    const pts = data.points;
    const levels = [...pts.map((p) => p.level_m), danger].filter((v): v is number => v != null);
    const min = Math.min(...levels) - 0.5;
    const max = Math.max(...levels) + 0.5;
    const x = (i: number) => PAD.l + (i / Math.max(1, pts.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + ((max - v) / (max - min)) * (H - PAD.t - PAD.b);
    const obs = pts.filter((p) => p.source === 'observed');
    const fc = pts.filter((p) => p.source !== 'observed');
    const obsPath = pathFor(obs.length > 1 ? obs : pts, (i) => x(pts.indexOf(obs[i] ?? pts[Math.min(i, pts.length - 1)])), y);
    const fcPath = pathFor(fc, (i) => x(pts.indexOf(fc[i])), y);
    // area under the observed line
    const obsIdxs = pts.map((p, i) => (p.source === 'observed' ? i : -1)).filter((i) => i >= 0);
    const lastIdx = obsIdxs[obsIdxs.length - 1] ?? pts.length - 1;
    const areaPath =
      obsIdxs.length > 1
        ? `${obsIdxs.map((i, k) => `${k === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(pts[i].level_m).toFixed(1)}`).join(' ')} L${x(lastIdx).toFixed(1)},${y(min).toFixed(1)} L${x(obsIdxs[0]).toFixed(1)},${y(min).toFixed(1)} Z`
        : '';
    const labelStep = Math.max(1, Math.floor(pts.length / 8));

    chart = (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t('gauge.title')}>
        <defs>
          <linearGradient id="gauge-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({length: 5}, (_, i) => {
          const v = min + ((max - min) / 4) * i;
          const yy = y(v);
          return (
            <g key={i}>
              <line x1={PAD.l} x2={W - PAD.r} y1={yy} y2={yy} stroke="rgba(148,163,184,.12)" strokeWidth="1" />
              <text x={PAD.l - 5} y={yy + 3} textAnchor="end" fill="#6d7891" fontSize="8" fontFamily="var(--font-mono), monospace">
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}
        {areaPath && <path d={areaPath} fill="url(#gauge-area)" />}
        {danger !== null && (
          <>
            <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={Math.max(0, y(danger) - PAD.t)} fill="rgba(244,63,94,.05)" />
            <line x1={PAD.l} x2={W - PAD.r} y1={y(danger)} y2={y(danger)} stroke="#ef4444" strokeWidth="1.4" strokeDasharray="5 3" />
            <text x={W - PAD.r - 2} y={y(danger) - 4} textAnchor="end" fill="#f43f5e" fontSize="7.5" fontFamily="var(--font-mono), monospace">
              {t('gauge.danger')} {danger.toFixed(1)}
            </text>
          </>
        )}
        {obs.length > 0 && <path d={obsPath} fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinejoin="round" />}
        {fc.length > 0 && <path d={fcPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" strokeLinejoin="round" />}
        {pts.map((p, i) =>
          i % labelStep === 0 ? (
            <text key={p.date} x={x(i)} y={H - 8} textAnchor="middle" fill="#6d7891" fontSize="8" fontFamily="var(--font-mono), monospace">
              {p.date.slice(5)}
            </text>
          ) : null
        )}
      </svg>
    );
  } else if (data) {
    chart = <p className="text-[11.5px] text-mist-3">{t('gauge.insufficient')}</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col" aria-label={t('gauge.title')}>
      <div className="h-1 w-full shrink-0" style={{background: `linear-gradient(90deg, ${tone.text}, transparent 85%)`}} />
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2.5 sm:px-4">
        <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.22em] text-mist-3">
          <GaugeIcon size={12} aria-hidden />
          {t('gauge.title')}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="rounded-md border border-line p-1.5 text-mist-3 transition-colors hover:border-line-strong hover:text-mist-1"
        >
          <X size={13} aria-hidden />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4 sm:px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-bold leading-tight tracking-tight text-mist-1">{gauge.station}</p>
            <p className="mt-0.5 truncate text-[11.5px] text-mist-3">
              {gauge.river}
              {gauge.district ? ` · ${gauge.district}` : ''}
            </p>
          </div>
          <span
            className="shrink-0 rounded-md border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-widest"
            style={{color: tone.text, background: tone.bg, borderColor: tone.border}}
          >
            {t(`ops.lists.gaugeStatus.${gauge.status ?? 'normal'}`)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-ink-2/60 px-2.5 py-2">
            <div className="font-mono text-[8.5px] uppercase tracking-widest text-mist-3">{t('gauge.current')}</div>
            <div className="mt-0.5 font-mono text-[19px] font-bold leading-tight" style={{color: tone.text}}>
              {gauge.water_level_m?.toFixed(2)}
              <span className="ml-0.5 text-[11px] font-normal">m</span>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-ink-2/60 px-2.5 py-2">
            <div className="font-mono text-[8.5px] uppercase tracking-widest text-mist-3">{t('gauge.danger')}</div>
            <div className="mt-0.5 font-mono text-[19px] font-bold leading-tight text-danger">
              {danger !== null ? danger.toFixed(2) : '—'}
              <span className="ml-0.5 text-[11px] font-normal">m</span>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-ink-2/60 px-2.5 py-2">
            <div className="font-mono text-[8.5px] uppercase tracking-widest text-mist-3">{t('gauge.diff')}</div>
            <div
              className="mt-0.5 font-mono text-[19px] font-bold leading-tight"
              style={{color: gauge.difference_m != null && gauge.difference_m >= 0 ? '#f43f5e' : '#2dd4bf'}}
            >
              {gauge.difference_m != null ? `${gauge.difference_m >= 0 ? '+' : ''}${gauge.difference_m.toFixed(2)}` : '—'}
              <span className="ml-0.5 text-[11px] font-normal">m</span>
            </div>
          </div>
        </div>

        {!data && <p className="text-[11.5px] text-mist-3">{t('common.loading')}…</p>}
        <div className="rounded-lg border border-line bg-ink-2/40 p-2">{chart}</div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-mist-2">
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded-full bg-accent" /> {t('gauge.observed')}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-[3px] w-4 rounded-full"
              style={{background: 'repeating-linear-gradient(90deg,#f59e0b 0 3px,transparent 3px 5px)'}}
            />{' '}
            {t('gauge.forecast')}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-[3px] w-4 rounded-full"
              style={{background: 'repeating-linear-gradient(90deg,#ef4444 0 4px,transparent 4px 6px)'}}
            />{' '}
            {t('gauge.dangerLine')}
          </span>
        </div>

        <p className="mt-auto font-mono text-[9px] leading-relaxed text-mist-3">
          {t('gauge.asOf', {date: gauge.as_of ?? '—'})} · FFWC · {t('ops.freshness.seededAsOf', {date: gauge.as_of ?? '—'})}
        </p>
      </div>
    </div>
  );
}
