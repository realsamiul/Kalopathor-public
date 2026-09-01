'use client';

import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useEffect, useState} from 'react';
import type {
  FreshnessContract,
  FreshnessBasis,
  FreshnessStatus
} from '@/lib/freshness';
import {ageSeconds, humanAge} from '@/lib/freshness';

const STATUS_META: Record<FreshnessStatus, {labelKey: string; chip: string; text: string}> = {
  fresh: {labelKey: 'ops.freshness.fresh', chip: 'bg-[#2dd4bf] shadow-[0_0_6px_#2dd4bf]', text: 'text-[#2dd4bf]'},
  stale: {labelKey: 'ops.freshness.stale', chip: 'bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]', text: 'text-[#f59e0b]'},
  failed: {labelKey: 'ops.freshness.failed', chip: 'bg-[#f43f5e] shadow-[0_0_6px_#f43f5e]', text: 'text-[#f43f5e]'}
};

function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
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
      <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${meta.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${meta.chip}`} />
        {t(meta.labelKey)}
      </span>
    );
  }
  // Static facts (version/provenance): as-of date, neutral.
  if (basis === 'static') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#6b7280]" />
        {t('ops.freshness.seededAsOf', {date: asOf ?? t('ops.freshness.unknown')})}
      </span>
    );
  }
  // Seeded demo data: neutral, never green "fresh".
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#6b7280]" />
      {t('ops.freshness.seededDate', {date: asOf ?? t('ops.freshness.unknown')})}
    </span>
  );
}

function Age({
  iso,
  serverTime,
  estimated
}: {
  iso: string | null;
  serverTime: string;
  estimated?: boolean;
}) {
  const t = useTranslations();
  const age = ageSeconds(iso, serverTime);
  if (age === null) return <span className="text-[#6b7280]">{t('ops.freshness.unknown')}</span>;
  return (
    <span className="font-mono text-[10px] text-[#9ca3af]">
      {t('ops.freshness.age', {age: humanAge(age)})}
      {estimated && <sup className="text-[#818cf8]"> ·{t('ops.freshness.estimated')}</sup>}
    </span>
  );
}

function Row({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#1f2937] py-2">
      <span className="text-[11px] text-[#e5e7eb]">{label}</span>
      <div className="flex flex-col items-end gap-0.5">{children}</div>
    </div>
  );
}

export default function DataQualityPanel() {
  const t = useTranslations();
  const [contract, setContract] = useState<FreshnessContract | null>(null);
  const [error, setError] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch('/api/freshness')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`freshness ${r.status}`))))
        .then((c: FreshnessContract) => {
          if (cancelled) return;
          setContract(c);
          setError(false);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        });
    };
    load();
    const ageTimer = setInterval(() => setTick((x) => x + 1), 30_000);
    const refreshTimer = setInterval(load, 120_000);
    return () => {
      cancelled = true;
      clearInterval(ageTimer);
      clearInterval(refreshTimer);
    };
  }, []);

  if (error) {
    return (
      <motion.div
        initial={{opacity: 0, x: 24}}
        animate={{opacity: 1, x: 0}}
        className="absolute bottom-20 right-3 top-14 z-10 w-80 rounded-lg border border-[#1f2937] bg-[#0d1220]/95 p-4 backdrop-blur"
      >
        <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
          {t('ops.freshness.title')}
        </div>
        <div className="text-[12px] text-[#f43f5e]">{t('ops.freshness.offline')}</div>
      </motion.div>
    );
  }

  if (!contract) {
    return (
      <motion.div
        initial={{opacity: 0, x: 24}}
        animate={{opacity: 1, x: 0}}
        className="absolute bottom-20 right-3 top-14 z-10 w-80 rounded-lg border border-[#1f2937] bg-[#0d1220]/95 p-4 backdrop-blur"
      >
        <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
          {t('ops.freshness.title')}
        </div>
        <div className="font-mono text-[11px] text-[#9ca3af]">{t('common.loading')}…</div>
      </motion.div>
    );
  }

  const {mode, layers, server_time} = contract;
  const serverTime = server_time;
  const seeded = mode !== 'live';

  return (
    <motion.div
      initial={{opacity: 0, x: 24}}
      animate={{opacity: 1, x: 0}}
      className="absolute bottom-20 right-3 top-14 z-10 flex w-80 flex-col overflow-hidden rounded-lg border border-[#1f2937] bg-[#0d1220]/95 backdrop-blur"
    >
      <div className="flex items-center justify-between border-b border-[#1f2937] px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
          {t('ops.freshness.title')}
        </span>
        <span className="font-mono text-[9px] text-[#6b7280]">
          {t('ops.freshness.serverTime')} {new Date(serverTime).toISOString().slice(11, 19)}Z
        </span>
      </div>

      {seeded && (
        <div className="border-b border-[#f59e0b]/40 bg-[#f59e0b]/10 px-4 py-2">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#fbbf24]">
            {t('ops.freshness.seededBannerTitle')}
          </div>
          <div className="text-[10px] text-[#fcd34d]">{t('ops.freshness.seededBannerBody')}</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-1">
        <Row label="FFWC gauges">
          <BasisChip
            basis={layers.ffwc_gauges.basis}
            mode={mode}
            status={layers.ffwc_gauges.status}
            asOf={shortDate(layers.ffwc_gauges.last_success)}
          />
          {!seeded && (
            <Age iso={layers.ffwc_gauges.last_success} serverTime={serverTime} estimated />
          )}
          <span className="font-mono text-[9px] text-[#6b7280]">
            {t('ops.freshness.staleAfter', {s: humanAge(layers.ffwc_gauges.stale_after_s)})}
          </span>
        </Row>

        <Row label="SAR detection">
          <BasisChip
            basis={layers.sar_detection.basis}
            mode={mode}
            status={layers.sar_detection.status}
            asOf={shortDate(layers.sar_detection.last_pass)}
          />
          {layers.sar_detection.basis === 'live' && layers.sar_detection.last_pass && (
            <span className="font-mono text-[10px] text-[#2dd4bf]">
              {t('ops.freshness.sarComputed', {date: shortDate(layers.sar_detection.last_pass) ?? ''})}
            </span>
          )}
          <div className="font-mono text-[10px] text-[#818cf8]">
            {t('ops.freshness.nextPass')}{' '}
            {layers.sar_detection.next_pass
              ? new Date(layers.sar_detection.next_pass).toISOString().slice(0, 10)
              : t('ops.freshness.unknown')}
            {layers.sar_detection.next_pass && (
              <sup className="text-[#9ca3af]"> ·{t('ops.freshness.estimated')}</sup>
            )}
          </div>
          <span className="font-mono text-[9px] text-[#6b7280]">
            {layers.sar_detection.next_pass_source} · {t('ops.freshness.region')}{' '}
            {layers.sar_detection.region}
          </span>
        </Row>

        <Row label="GLOFAS forecast">
          <BasisChip
            basis={layers.forecast_glofas.basis}
            mode={mode}
            status={layers.forecast_glofas.status}
            asOf={shortDate(layers.forecast_glofas.run_ts)}
          />
        </Row>

        <Row label="Open-Meteo forecast">
          <BasisChip
            basis={layers.forecast_openmeteo.basis}
            mode={mode}
            status={layers.forecast_openmeteo.status}
            asOf={shortDate(layers.forecast_openmeteo.run_ts)}
          />
        </Row>

        <Row label="Shelters">
          <BasisChip
            basis={layers.shelters.basis}
            mode={mode}
            status={layers.shelters.status}
            asOf={shortDate(serverTime)}
          />
          <span className="font-mono text-[10px] text-[#9ca3af]">
            v{layers.shelters.version}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
              layers.shelters.provenance === 'official'
                ? 'bg-[#2dd4bf]/15 text-[#2dd4bf]'
                : 'bg-[#f59e0b]/15 text-[#f59e0b]'
            }`}
          >
            {t(`ops.freshness.prov.${layers.shelters.provenance}`)}
          </span>
        </Row>

        <Row label="Model">
          <BasisChip
            basis={layers.model.basis}
            mode={mode}
            status={'fresh'}
            asOf={shortDate(serverTime)}
          />
          <span className="font-mono text-[10px] text-[#e5e7eb]">
            v{layers.model.version}
          </span>
          {layers.model.frozen && (
            <span className="rounded bg-[#818cf8]/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#a5b4fc]">
              {t('ops.freshness.frozen')}
            </span>
          )}
        </Row>

        <div className="border-b border-[#1f2937] py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-[#e5e7eb]">
              {t('ops.freshness.staleStations')}
            </span>
            <span className="font-mono text-[9px] text-[#6b7280]">
              {t('ops.freshness.staleStationsNone')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}