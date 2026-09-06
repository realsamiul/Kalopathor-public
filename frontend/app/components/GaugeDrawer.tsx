'use client';

import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
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
const PAD = {l: 30, r: 12, t: 14, b: 26};

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
  const statusTone =
    gauge.status === 'danger' ? 'text-[#f43f5e]' : gauge.status === 'warning' ? 'text-[#f59e0b]' : 'text-[#2dd4bf]';

  let chart: React.ReactNode = null;
  if (data && data.points.length > 1) {
    const pts = data.points;
    const levels = [...pts.map((p) => p.level_m), danger].filter((v): v is number => v !== null && v !== undefined);
    const min = Math.min(...levels) - 0.5;
    const max = Math.max(...levels) + 0.5;
    const x = (i: number) => PAD.l + (i / Math.max(1, pts.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + ((max - v) / (max - min)) * (H - PAD.t - PAD.b);
    const obs = pts.filter((p) => p.source === 'observed');
    const fc = pts.filter((p) => p.source !== 'observed');
    const obsPath = pathFor(obs.length > 1 ? obs : pts, (i) => x(pts.indexOf(obs[i] ?? pts[Math.min(i, pts.length - 1)])), y);
    const fcPath = pathFor(fc, (i) => x(pts.indexOf(fc[i])), y);
    const labelStep = Math.max(1, Math.floor(pts.length / 8));

    chart = (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t('gauge.title')}>
        {Array.from({length: 5}, (_, i) => {
          const v = min + ((max - min) / 4) * i;
          const yy = y(v);
          return (
            <g key={i}>
              <line x1={PAD.l} x2={W - PAD.r} y1={yy} y2={yy} stroke="#1f2937" strokeWidth="1" />
              <text x={PAD.l - 4} y={yy + 3} textAnchor="end" className="fill-[#6b7280]" fontSize="8" fontFamily="monospace">
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}
        {danger !== null && (
          <line x1={PAD.l} x2={W - PAD.r} y1={y(danger)} y2={y(danger)} stroke="#ef4444" strokeWidth="1.4" strokeDasharray="5 3" />
        )}
        {obs.length > 0 && <path d={obsPath} fill="none" stroke="#2dd4bf" strokeWidth="2" />}
        {fc.length > 0 && <path d={fcPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />}
        {pts.map((p, i) =>
          i % labelStep === 0 ? (
            <text key={p.date} x={x(i)} y={H - 8} textAnchor="middle" className="fill-[#6b7280]" fontSize="8" fontFamily="monospace">
              {p.date.slice(5)}
            </text>
          ) : null
        )}
      </svg>
    );
  } else if (data) {
    chart = <p className="text-[11px] text-[#9ca3af]">{t('gauge.insufficient')}</p>;
  }

  return (
    <motion.aside
      initial={{x: 24, opacity: 0}}
      animate={{x: 0, opacity: 1}}
      transition={{duration: 0.22}}
      className="pointer-events-auto flex h-full w-[360px] flex-col overflow-hidden rounded-lg border border-[#1f2937] bg-[#111827]/95 shadow-2xl backdrop-blur"
      aria-label={t('gauge.title')}
    >
      <header className="flex items-center justify-between border-b border-[#1f2937] px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
          {t('gauge.title')}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-[#1f2937] px-2 py-0.5 font-mono text-[10px] text-[#9ca3af] hover:text-[#e5e7eb]"
        >
          {t('common.close')}
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[14px] font-semibold leading-tight text-[#e5e7eb]">{gauge.station}</p>
            <p className="text-[11px] text-[#9ca3af]">
              {gauge.river}
              {gauge.district ? ` · ${gauge.district}` : ''}
            </p>
          </div>
          <span className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${statusTone}`}>
            {t(`ops.lists.gaugeStatus.${gauge.status ?? 'normal'}`)}
          </span>
        </div>

        <div className="flex gap-4 rounded border border-[#1f2937] bg-[#0f172a]/60 px-3 py-2">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[#6b7280]">{t('gauge.current')}</div>
            <div className={`font-mono text-lg font-bold ${statusTone}`}>
              {gauge.water_level_m?.toFixed(2)} m
            </div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[#6b7280]">{t('gauge.danger')}</div>
            <div className="font-mono text-lg font-bold text-[#ef4444]">
              {danger !== null ? danger.toFixed(2) : '—'}
            </div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[#6b7280]">{t('gauge.diff')}</div>
            <div className={`font-mono text-lg font-bold ${gauge.difference_m != null && gauge.difference_m >= 0 ? 'text-[#f43f5e]' : 'text-[#2dd4bf]'}`}>
              {gauge.difference_m != null ? `${gauge.difference_m >= 0 ? '+' : ''}${gauge.difference_m.toFixed(2)} m` : '—'}
            </div>
          </div>
        </div>

        {!data && <p className="text-[11px] text-[#9ca3af]">{t('common.loading')}…</p>}
        {chart}

        <div className="flex items-center gap-3 border-t border-[#1f2937] pt-2 text-[10px] text-[#9ca3af]">
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-[#2dd4bf]" /> {t('gauge.observed')}</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-[#f59e0b]" /> {t('gauge.forecast')}</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 border-t border-dashed border-[#ef4444]" /> {t('gauge.dangerLine')}</span>
        </div>

        <p className="font-mono text-[9px] leading-relaxed text-[#6b7280]">
          {t('gauge.asOf', {date: gauge.as_of ?? '—'})} · FFWC · {t('ops.freshness.seededAsOf', {date: gauge.as_of ?? '—'})}
        </p>
      </div>
    </motion.aside>
  );
}