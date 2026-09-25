'use client';

import {useTranslations} from 'next-intl';
import {Gauge as GaugeIcon, RefreshCw, TrendingDown, TrendingUp, X} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {logger} from '@/lib/logger';

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

const PAD = {l: 36, r: 16, t: 16, b: 26};

function chartDims(width: number): {W: number; H: number} {
  const W = Math.max(240, Math.round(width));
  const H = Math.max(150, Math.min(230, Math.round(W * 0.55)));
  return {W, H};
}

let hydroCache: GaugeSeries[] | null = null;

function loadSeries(setSeries: (s: GaugeSeries[]) => void, onError: () => void) {
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
    .catch((err) => {
      logger.error('hydrograph load failed', err);
      onError();
    });
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
  const [failed, setFailed] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!hydroCache) loadSeries(setSeries, () => setFailed(true));
  }, []);

  const retry = () => {
    hydroCache = null;
    setFailed(false);
    setSeries(null);
    loadSeries(setSeries, () => setFailed(true));
  };

  const chartWrap = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState(340);
  useEffect(() => {
    const el = chartWrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWrapW(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const {W, H} = chartDims(wrapW);

  const data = series?.find((s) => s.station === gauge.station);
  const danger = gauge.danger_level_m ?? data?.danger_level_m ?? null;
  const warning = danger !== null ? danger - 0.5 : null;

  const tone =
    gauge.status === 'danger'
      ? {text: '#f43f5e', bg: 'rgba(244,63,94,.12)', border: 'rgba(244,63,94,.4)'}
      : gauge.status === 'warning'
        ? {text: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.4)'}
        : {text: '#2dd4bf', bg: 'rgba(45,212,191,.12)', border: 'rgba(45,212,191,.4)'};

  // Compute 24h tendency if data points available
  let tendency: {delta: number; isUp: boolean} | null = null;
  if (data && data.points.length >= 2) {
    const pts = data.points;
    const pCurrent = pts[pts.length - 1].level_m;
    const pPrev = pts[pts.length - 2].level_m;
    const delta = pCurrent - pPrev;
    tendency = {delta, isUp: delta >= 0};
  }

  let chart: React.ReactNode = null;
  if (data && data.points.length > 1) {
    const pts = data.points;
    const levels = [...pts.map((p) => p.level_m), danger, warning].filter((v): v is number => v != null);
    const min = Math.min(...levels) - 0.5;
    const max = Math.max(...levels) + 0.5;
    const x = (i: number) => PAD.l + (i / Math.max(1, pts.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + ((max - v) / (max - min)) * (H - PAD.t - PAD.b);

    const obs = pts.filter((p) => p.source === 'observed');
    const fc = pts.filter((p) => p.source !== 'observed');
    const obsPath = pathFor(obs.length > 1 ? obs : pts, (i) => x(pts.indexOf(obs[i] ?? pts[Math.min(i, pts.length - 1)])), y);
    const fcPath = pathFor(fc, (i) => x(pts.indexOf(fc[i])), y);

    const obsIdxs = pts.map((p, i) => (p.source === 'observed' ? i : -1)).filter((i) => i >= 0);
    const lastIdx = obsIdxs[obsIdxs.length - 1] ?? pts.length - 1;
    const areaPath =
      obsIdxs.length > 1
        ? `${obsIdxs.map((i, k) => `${k === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(pts[i].level_m).toFixed(1)}`).join(' ')} L${x(lastIdx).toFixed(1)},${y(min).toFixed(1)} L${x(obsIdxs[0]).toFixed(1)},${y(min).toFixed(1)} Z`
        : '';
    const labelStep = Math.max(1, Math.floor(pts.length / 7));

    const activePt = hoverIdx !== null && pts[hoverIdx] ? pts[hoverIdx] : null;
    const activeX = hoverIdx !== null ? x(hoverIdx) : null;
    const activeY = activePt ? y(activePt.level_m) : null;

    const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const normalizedX = (clientX / rect.width) * W;
      const clampedX = Math.max(PAD.l, Math.min(W - PAD.r, normalizedX));
      const ratio = (clampedX - PAD.l) / (W - PAD.l - PAD.r);
      const nearestIdx = Math.round(ratio * (pts.length - 1));
      setHoverIdx(Math.max(0, Math.min(pts.length - 1, nearestIdx)));
    };

    chart = (
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-crosshair select-none"
          role="img"
          aria-label={t('gauge.title')}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="gauge-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#2dd4bf" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
            </linearGradient>
            <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {Array.from({length: 5}, (_, i) => {
            const v = min + ((max - min) / 4) * i;
            const yy = y(v);
            return (
              <g key={i}>
                <line x1={PAD.l} x2={W - PAD.r} y1={yy} y2={yy} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
                <text x={PAD.l - 6} y={yy + 3} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="var(--font-mono), monospace">
                  {v.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Danger zone shading */}
          {danger !== null && (
            <>
              <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={Math.max(0, y(danger) - PAD.t)} fill="rgba(244,63,94,0.08)" />
              <line x1={PAD.l} x2={W - PAD.r} y1={y(danger)} y2={y(danger)} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 3" />
              <text x={W - PAD.r - 2} y={y(danger) - 4} textAnchor="end" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="var(--font-mono), monospace">
                {t('gauge.danger')} {danger.toFixed(2)}m
              </text>
            </>
          )}

          {/* Warning Level reference line */}
          {warning !== null && warning < (danger ?? 999) && (
            <>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(warning)} y2={y(warning)} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
              <text x={W - PAD.r - 2} y={y(warning) + 9} textAnchor="end" fill="#f59e0b" fontSize="8" fontFamily="var(--font-mono), monospace" opacity="0.8">
                WL {warning.toFixed(2)}m
              </text>
            </>
          )}

          {/* Gradient area */}
          {areaPath && <path d={areaPath} fill="url(#gauge-area)" />}

          {/* Observed path */}
          {obs.length > 0 && (
            <path d={obsPath} fill="none" stroke="#2dd4bf" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" filter="url(#gauge-glow)" />
          )}

          {/* Forecast path */}
          {fc.length > 0 && (
            <path d={fcPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" strokeLinejoin="round" />
          )}

          {/* Active Hover Crosshair */}
          {activeX !== null && activeY !== null && activePt && (
            <g>
              <line x1={activeX} x2={activeX} y1={PAD.t} y2={H - PAD.b} stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx={activeX} cy={activeY} r="4.5" fill="#2dd4bf" stroke="#101216" strokeWidth="2" />
              <circle cx={activeX} cy={activeY} r="8" fill="rgba(45,212,191,0.25)" />
            </g>
          )}

          {/* Date tick labels */}
          {pts.map((p, i) =>
            i % labelStep === 0 || i === pts.length - 1 ? (
              <text key={p.date + i} x={x(i)} y={H - 8} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="var(--font-mono), monospace">
                {p.date.slice(5)}
              </text>
            ) : null
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {activePt && (
          <div className="pointer-events-none absolute left-3 top-2 rounded-md border border-white/15 bg-black/85 px-2.5 py-1 text-[11px] backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-white/60">{activePt.date}</span>
              <span className="font-bold text-accent">{activePt.level_m.toFixed(2)}m</span>
              {danger !== null && (
                <span className={`text-[10px] ${activePt.level_m >= danger ? 'text-danger font-bold' : 'text-mist-3'}`}>
                  ({activePt.level_m >= danger ? '+' : ''}{(activePt.level_m - danger).toFixed(2)}m DL)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  } else if (data) {
    chart = <p className="text-[11.5px] text-mist-3">{t('gauge.insufficient')}</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col" role="region" aria-label={t('gauge.title')}>
      <div className="h-1 w-full shrink-0" style={{background: `linear-gradient(90deg, ${tone.text}, transparent 85%)`}} />
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2.5 sm:px-4">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-mist-3">
          <GaugeIcon size={12} aria-hidden />
          {t('gauge.title')}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-line p-1.5 text-mist-3 transition-colors hover:border-line-strong hover:text-mist-1"
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
          <div className="flex flex-col items-end gap-1">
            <span
              className="shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest"
              style={{color: tone.text, background: tone.bg, borderColor: tone.border}}
            >
              {t(`ops.lists.gaugeStatus.${gauge.status ?? 'normal'}`)}
            </span>
            {tendency && (
              <span className={`flex items-center gap-1 font-mono text-[10px] ${tendency.isUp ? 'text-danger' : 'text-accent'}`}>
                {tendency.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {tendency.isUp ? '+' : ''}{tendency.delta.toFixed(2)}m / 24h
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-line bg-ink-2/60 px-2.5 py-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-mist-3">{t('gauge.current')}</div>
            <div className="mt-0.5 font-mono text-[19px] font-bold leading-tight" style={{color: tone.text}}>
              {gauge.water_level_m?.toFixed(2)}
              <span className="ml-0.5 text-[11px] font-normal">m</span>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-ink-2/60 px-2.5 py-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-mist-3">{t('gauge.danger')}</div>
            <div className="mt-0.5 font-mono text-[19px] font-bold leading-tight text-danger">
              {danger !== null ? danger.toFixed(2) : '—'}
              <span className="ml-0.5 text-[11px] font-normal">m</span>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-ink-2/60 px-2.5 py-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-mist-3">{t('gauge.diff')}</div>
            <div
              className="mt-0.5 font-mono text-[19px] font-bold leading-tight"
              style={{color: gauge.difference_m != null && gauge.difference_m >= 0 ? '#f43f5e' : '#2dd4bf'}}
            >
              {gauge.difference_m != null ? `${gauge.difference_m >= 0 ? '+' : ''}${gauge.difference_m.toFixed(2)}` : '—'}
              <span className="ml-0.5 text-[11px] font-normal">m</span>
            </div>
          </div>
        </div>

        <div ref={chartWrap} className="rounded-lg border border-line bg-ink-2/40 p-2">
          {failed ? (
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-2.5 py-4">
              <p className="text-[11.5px] text-danger">{t('gauge.loadFailed')}</p>
              <button
                type="button"
                onClick={retry}
                className="flex min-h-[36px] items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-[11px] text-mist-2 transition-colors hover:border-line-strong hover:text-mist-1"
              >
                <RefreshCw size={12} aria-hidden />
                {t('common.retry')}
              </button>
            </div>
          ) : !series ? (
            <div className="animate-pulse" aria-hidden>
              <div className="flex min-h-[150px] flex-col justify-between gap-3 px-1 py-2" style={{height: H - 8}}>
                <div className="h-px w-full bg-line" />
                <div className="h-px w-full bg-line" />
                <div className="h-px w-full bg-line" />
                <div className="h-px w-full bg-line" />
                <div className="flex justify-between">
                  <div className="h-2 w-10 rounded bg-ink-3" />
                  <div className="h-2 w-10 rounded bg-ink-3" />
                  <div className="h-2 w-10 rounded bg-ink-3" />
                </div>
              </div>
            </div>
          ) : (
            (chart ?? <p className="py-2 text-[11.5px] text-mist-3">{t('gauge.insufficient')}</p>)
          )}
        </div>

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

        <p className="mt-auto font-mono text-[10px] leading-relaxed text-mist-3">
          {t('gauge.asOf', {date: gauge.as_of ?? '—'})} · FFWC · {t('ops.freshness.seededAsOf', {date: gauge.as_of ?? '—'})}
        </p>
      </div>
    </div>
  );
}
