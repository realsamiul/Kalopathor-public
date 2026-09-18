'use client';

import {useTranslations} from 'next-intl';
import {AlertTriangle, RefreshCw, ShieldCheck, X} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import type {FreshnessContract, FreshnessBasis, FreshnessStatus} from '@/lib/freshness';
import {ageSeconds, humanAge} from '@/lib/freshness';
import {logger} from '@/lib/logger';

const STATUS_META: Record<FreshnessStatus, {labelKey: string; color: string}> = {
  fresh: {labelKey: 'ops.freshness.fresh', color: '#2dd4bf'},
  stale: {labelKey: 'ops.freshness.stale', color: '#f59e0b'},
  failed: {labelKey: 'ops.freshness.failed', color: '#f43f5e'}
};

function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function Dot({color, pulse}: {color: string; pulse?: boolean}) {
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${pulse ? 'pulse-dot' : ''}`}
      style={{background: color, color}}
    />
  );
}

function BasisChip({
  basis,
  mode,
  status,
  asOf
}: {
  basis: FreshnessBasis;
  mode: 'seeded' | 'live';
  status: FreshnessStatus;
  asOf: string | null;
}) {
  const t = useTranslations();
  // Genuinely verifiable (live mode or a live-grounded layer): show real status.
  if (mode === 'live' || basis === 'live') {
    const meta = STATUS_META[status];
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest" style={{color: meta.color}}>
        <Dot color={meta.color} pulse={status === 'fresh'} />
        {t(meta.labelKey)}
      </span>
    );
  }
  // Static facts (version/provenance): as-of date, neutral.
  if (basis === 'static') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-mist-3">
        <Dot color="#64748b" />
        {t('ops.freshness.seededAsOf', {date: asOf ?? t('ops.freshness.unknown')})}
      </span>
    );
  }
  // Seeded demo data: neutral, never green "fresh".
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-mist-3">
      <Dot color="#64748b" />
      {t('ops.freshness.seededDate', {date: asOf ?? t('ops.freshness.unknown')})}
    </span>
  );
}

function Age({iso, serverTime, estimated}: {iso: string | null; serverTime: string; estimated?: boolean}) {
  const t = useTranslations();
  const age = ageSeconds(iso, serverTime);
  if (age === null) return <span className="text-mist-3">{t('ops.freshness.unknown')}</span>;
  return (
    <span className="font-mono text-[10px] text-mist-2">
      {t('ops.freshness.age', {age: humanAge(age)})}
      {estimated && <sup className="text-accent2"> ·{t('ops.freshness.estimated')}</sup>}
    </span>
  );
}

function Row({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-2.5">
      <span className="pt-0.5 text-[12px] font-medium text-mist-1">{label}</span>
      <div className="flex flex-col items-end gap-1">{children}</div>
    </div>
  );
}

export default function DataQualityPanel({onClose}: {onClose?: () => void}) {
  const t = useTranslations();
  const [contract, setContract] = useState<FreshnessContract | null>(null);
  const [error, setError] = useState(false);
  const [, setTick] = useState(0);
  // Stations above danger — computed from the shipped FFWC gauge set (seeded,
  // like the rest of the panel, so counts are honest, never fabricated).
  const [gaugeStatus, setGaugeStatus] = useState<{danger: number; warning: number} | null>(null);

  const load = useCallback(() => {
    fetch('/api/freshness')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`freshness ${r.status}`))))
      .then((c: FreshnessContract) => {
        setContract(c);
        setError(false);
      })
      .catch((err) => {
        logger.error('freshness load failed', err);
        setError(true);
      });
  }, []);

  useEffect(() => {
    load();
    const ageTimer = setInterval(() => setTick((x) => x + 1), 30_000);
    const refreshTimer = setInterval(load, 120_000);
    return () => {
      clearInterval(ageTimer);
      clearInterval(refreshTimer);
    };
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/ffwc_gauges.geojson')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`gauges ${r.status}`))))
      .then((fc: {features: {properties: {status?: string}}[]}) => {
        if (cancelled) return;
        let danger = 0;
        let warning = 0;
        for (const f of fc.features) {
          if (f.properties?.status === 'danger') danger += 1;
          else if (f.properties?.status === 'warning') warning += 1;
        }
        setGaugeStatus({danger, warning});
      })
      .catch((err) => logger.warn('gauge status count failed', err));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col" role="region" aria-label={t('ops.freshness.title')}>
      <div className="h-1 w-full shrink-0" style={{background: 'linear-gradient(90deg, #2dd4bf, transparent 85%)'}} />
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2.5 sm:px-4">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-mist-3">
          <ShieldCheck size={12} className="text-accent" aria-hidden />
          {t('ops.freshness.title')}
        </span>
        <div className="flex items-center gap-2">
          {contract && (
            <span className="hidden font-mono text-[10px] text-mist-3 sm:block">
              {t('ops.freshness.serverTime')} {new Date(contract.server_time).toISOString().slice(11, 19)}Z
            </span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-line p-1.5 text-mist-3 transition-colors hover:border-line-strong hover:text-mist-1"
            >
              <X size={13} aria-hidden />
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="flex flex-col items-start gap-3 px-4 py-6">
          <div className="text-[12.5px] text-danger">{t('ops.freshness.offline')}</div>
          <button
            type="button"
            onClick={load}
            className="flex min-h-[36px] items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-[11px] text-mist-2 transition-colors hover:border-line-strong hover:text-mist-1"
          >
            <RefreshCw size={12} aria-hidden />
            {t('common.retry')}
          </button>
        </div>
      )}

      {!contract && !error && (
        // loading skeleton — pulsing stand-in rows match the row rhythm below
        <div className="animate-pulse px-3 py-2 sm:px-4" aria-hidden>
          {Array.from({length: 7}, (_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-line py-3.5">
              <div className="h-3 w-28 rounded bg-ink-3" />
              <div className="flex flex-col items-end gap-1.5">
                <div className="h-3 w-20 rounded bg-ink-3" />
                <div className="h-2.5 w-14 rounded bg-ink-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {contract && !error && (
        <>
          {contract.mode !== 'live' && (
            <div className="mx-3 mt-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2.5 sm:mx-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-est">
                {t('ops.freshness.seededBannerTitle')}
              </div>
              <div className="mt-0.5 text-[10.5px] leading-snug text-[#fcd34d]">
                {t('ops.freshness.seededBannerBody')}
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1 sm:px-4">
            <Row label={t('ops.freshness.layers.ffwcGauges')}>
              <BasisChip
                basis={contract.layers.ffwc_gauges.basis}
                mode={contract.mode}
                status={contract.layers.ffwc_gauges.status}
                asOf={shortDate(contract.layers.ffwc_gauges.last_success)}
              />
              {contract.mode === 'live' && (
                <Age iso={contract.layers.ffwc_gauges.last_success} serverTime={contract.server_time} estimated />
              )}
              <span className="font-mono text-[10px] text-mist-3">
                {t('ops.freshness.staleAfter', {s: humanAge(contract.layers.ffwc_gauges.stale_after_s)})}
              </span>
            </Row>

            <Row label={t('ops.freshness.layers.sarDetection')}>
              <BasisChip
                basis={contract.layers.sar_detection.basis}
                mode={contract.mode}
                status={contract.layers.sar_detection.status}
                asOf={shortDate(contract.layers.sar_detection.last_pass)}
              />
              {contract.layers.sar_detection.basis === 'live' && contract.layers.sar_detection.last_pass && (
                <span className="font-mono text-[10px] text-accent">
                  {t('ops.freshness.sarComputed', {date: shortDate(contract.layers.sar_detection.last_pass) ?? ''})}
                </span>
              )}
              <div className="font-mono text-[10px] text-accent2">
                {t('ops.freshness.nextPass')}{' '}
                {contract.layers.sar_detection.next_pass
                  ? new Date(contract.layers.sar_detection.next_pass).toISOString().slice(0, 10)
                  : t('ops.freshness.unknown')}
                {contract.layers.sar_detection.next_pass && (
                  <sup className="text-mist-3"> ·{t('ops.freshness.estimated')}</sup>
                )}
              </div>
              <span className="font-mono text-[10px] text-mist-3">
                {contract.layers.sar_detection.next_pass_source} · {t('ops.freshness.region')}{' '}
                {contract.layers.sar_detection.region}
              </span>
            </Row>

            <Row label={t('ops.freshness.layers.glofasForecast')}>
              <BasisChip
                basis={contract.layers.forecast_glofas.basis}
                mode={contract.mode}
                status={contract.layers.forecast_glofas.status}
                asOf={shortDate(contract.layers.forecast_glofas.run_ts)}
              />
            </Row>

            <Row label={t('ops.freshness.layers.openmeteoForecast')}>
              <BasisChip
                basis={contract.layers.forecast_openmeteo.basis}
                mode={contract.mode}
                status={contract.layers.forecast_openmeteo.status}
                asOf={shortDate(contract.layers.forecast_openmeteo.run_ts)}
              />
            </Row>

            <Row label={t('ops.freshness.layers.shelters')}>
              <BasisChip
                basis={contract.layers.shelters.basis}
                mode={contract.mode}
                status={contract.layers.shelters.status}
                asOf={shortDate(contract.server_time)}
              />
              <span className="font-mono text-[10px] text-mist-1">v{contract.layers.shelters.version}</span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                  contract.layers.shelters.provenance === 'official'
                    ? 'bg-accent/15 text-accent'
                    : 'bg-est/15 text-est'
                }`}
              >
                {t(`ops.freshness.prov.${contract.layers.shelters.provenance}`)}
              </span>
            </Row>

            <Row label={t('ops.freshness.layers.model')}>
              <BasisChip basis={contract.layers.model.basis} mode={contract.mode} status={'fresh'} asOf={shortDate(contract.server_time)} />
              <span className="font-mono text-[10px] text-mist-1">v{contract.layers.model.version}</span>
              {contract.layers.model.frozen && (
                <span className="rounded bg-accent2/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent2">
                  {t('ops.freshness.frozen')}
                </span>
              )}
            </Row>

            {gaugeStatus && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-mist-1">
                  {gaugeStatus.danger > 0 && (
                    <AlertTriangle size={12} className="text-danger" aria-hidden />
                  )}
                  {t('ops.freshness.staleStations')}
                </span>
                <span
                  className={`font-mono text-[10px] ${
                    gaugeStatus.danger > 0 ? 'text-danger' : gaugeStatus.warning > 0 ? 'text-est' : 'text-mist-2'
                  }`}
                >
                  {t('ops.freshness.staleStationsValue', {
                    danger: gaugeStatus.danger,
                    warning: gaugeStatus.warning
                  })}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
