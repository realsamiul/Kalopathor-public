'use client';

import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useEffect, useState} from 'react';
import type {Bundle} from '@/lib/bundle';
import type {WorkflowItemId} from '@/lib/workflow';
import type {TopFloodPolygon} from './OperationsConsole';

interface GaugeListItem {
  gauge_id: string;
  station: string;
  river: string;
  district: string;
  water_level_m: number;
  danger_level_m: number | null;
  difference_m: number | null;
  status: string;
  as_of: string;
  lat: number;
  lon: number;
}

interface OpenMeteoBand {
  band_id: string;
  station: string;
  river: string;
  forecast_date: string;
  lead_time_hours: number;
  value: number;
  unit: string;
  source_model: string;
}

const TOP_N = 12;

function Panel({children, top}: {children: React.ReactNode; top?: string}) {
  return (
    <motion.div
      initial={{x: -24, opacity: 0}}
      animate={{x: 0, opacity: 1}}
      transition={{delay: 0.2}}
      style={top ? {top} : undefined}
      className="absolute left-3 top-[26.5rem] z-10 w-60 overflow-hidden rounded-lg border border-[#1f2937] bg-[#111827]/85 backdrop-blur"
    >
      <div className="max-h-[38vh] overflow-y-auto p-2">{children}</div>
    </motion.div>
  );
}

function Empty({message}: {message: string}) {
  return <div className="px-2 py-3 text-[11px] text-[#6b7280]">{message}</div>;
}

function SectionTitle({title}: {title: string}) {
  return (
    <div className="mb-1 px-2 pt-1 font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
      {title}
    </div>
  );
}

const CONFIDENCE_COLOR: Record<string, string> = {
  observed_high: 'bg-[#2dd4bf]',
  observed_medium: 'bg-[#f59e0b]',
  possible: 'bg-[#38bdf8]',
  review_required: 'bg-[#f43f5e]'
};

function ConfidenceDot({cls}: {cls: string}) {
  return <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${CONFIDENCE_COLOR[cls] ?? 'bg-[#6b7280]'}`} />;
}

const BADGE_COLOR: Record<string, string> = {
  monitoring: 'bg-[#2dd4bf]/15 text-[#2dd4bf]',
  analysis: 'bg-[#818cf8]/15 text-[#a5b4fc]',
  historical: 'bg-[#1f2937] text-[#6b7280]'
};

function BadgeChip({badge}: {badge: string}) {
  const t = useTranslations();
  return (
    <span className={`rounded px-1 py-px font-mono text-[8px] uppercase tracking-widest ${BADGE_COLOR[badge] ?? ''}`}>
      {t(`ops.badge.${badge}`)}
    </span>
  );
}

export default function WorkflowListPanel({
  view,
  bundle,
  topPolys,
  hoveredPolygonId,
  onHoverPolygon,
  onSelectPolygon,
  onFocus
}: {
  view: WorkflowItemId;
  bundle: Bundle | null;
  topPolys: TopFloodPolygon[];
  hoveredPolygonId: number | null;
  onHoverPolygon: (id: number | null) => void;
  onSelectPolygon: (p: TopFloodPolygon) => void;
  onFocus: (lat: number, lon: number, zoom?: number) => void;
}) {
  const t = useTranslations();
  const [gauges, setGauges] = useState<GaugeListItem[] | null>(null);
  const [bands, setBands] = useState<OpenMeteoBand[] | null>(null);

  useEffect(() => {
    if (view === 'gauges' && gauges === null) {
      fetch('/data/ffwc_gauges.geojson')
        .then((r) => r.json())
        .then((fc: {features: Array<{geometry: {coordinates: number[]}; properties: GaugeListItem}>}) =>
          setGauges(fc.features.map((f) => ({...f.properties, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1]})))
        )
        .catch(() => undefined);
    }
    if (view === 'next_72h' && bands === null) {
      fetch('/data/openmeteo_forecast.json')
        .then((r) => r.json())
        .then((d: {bands: OpenMeteoBand[]}) => setBands(d.bands))
        .catch(() => undefined);
    }
  }, [view, gauges, bands]);

  if (!bundle) return null;

  if (view === 'now_flooding') {
    const list = topPolys.slice(0, TOP_N);
    return (
      <Panel>
        <SectionTitle title={t('ops.lists.incidents')} />
        {list.length === 0 && <Empty message={t('ops.lists.noIncidents')} />}
        {list.map((p) => (
          <button
            key={p.polygon_id}
            onMouseEnter={() => onHoverPolygon(p.polygon_id)}
            onMouseLeave={() => onHoverPolygon(null)}
            onClick={() => onSelectPolygon(p)}
            className={`mb-1 flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors ${
              hoveredPolygonId === p.polygon_id ? 'bg-[#818cf8]/20' : 'hover:bg-[#1f2937]'
            }`}
          >
            <ConfidenceDot cls={p.confidence_class} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[11px] text-[#e5e7eb]">
                  {p.district ?? '—'} · {p.area_km2.toFixed(1)} km²
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <BadgeChip badge={p.badge} />
                <span className="font-mono text-[9px] text-[#6b7280]">
                  {p.affected_people?.toLocaleString() ?? '—'} {t('ops.card.people')}
                </span>
              </div>
            </div>
          </button>
        ))}
        {topPolys.length > TOP_N && (
          <div className="px-2 pb-1 font-mono text-[9px] text-[#6b7280]">
            {t('ops.lists.topN', {n: TOP_N, total: topPolys.length})}
          </div>
        )}
      </Panel>
    );
  }

  if (view === 'next_72h') {
    const all = bands ?? [];
    const shown = all.slice(0, 16);
    return (
      <Panel>
        <SectionTitle title={t('ops.lists.forecast')} />
        {shown.length === 0 && <Empty message={t('ops.lists.noForecast')} />}
        {shown.map((b) => (
          <div key={b.band_id} className="mb-1 flex items-center justify-between rounded px-2 py-1.5 hover:bg-[#1f2937]">
            <div className="min-w-0">
              <div className="text-[11px] text-[#e5e7eb]">{b.station}</div>
              <div className="font-mono text-[9px] text-[#6b7280]">{b.river}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] text-[#f59e0b]">
                {t('ops.lists.lead', {h: b.lead_time_hours})}
              </div>
              <div className="font-mono text-[9px] text-[#2dd4bf]">
                {b.value.toLocaleString()} {b.unit}
              </div>
            </div>
          </div>
        ))}
        <div className="px-2 pb-1 font-mono text-[9px] text-[#6b7280]">
          {all.length > shown.length && t('ops.lists.topN', {n: shown.length, total: all.length})} · {t('layers.note.forecastSource')}
        </div>
      </Panel>
    );
  }

  if (view === 'people_at_risk') {
    const exp = [...(bundle.exposure ?? [])].sort((a, b) => b.affected_people - a.affected_people);
    const expList = exp.slice(0, TOP_N);
    return (
      <Panel>
        <SectionTitle title={t('ops.lists.peopleAtRisk')} />
        {expList.length === 0 && <Empty message={t('ops.lists.noExposure')} />}
        {expList.map((e) => (
          <button
            key={e.polygon_id}
            onMouseEnter={() => onHoverPolygon(e.polygon_id)}
            onMouseLeave={() => onHoverPolygon(null)}
            onClick={() => onSelectPolygon({
              polygon_id: e.polygon_id,
              area_km2: e.area_km2,
              district: e.district,
              confidence_class: bundle.flood_polygons.find((p) => p.polygon_id === e.polygon_id)?.confidence_class ?? 'possible',
              badge: 'historical',
              affected_people: e.affected_people,
              sar_pass_date: bundle.event.sar_pass_date,
              lon: null,
              lat: null
            })}
            className={`mb-1 flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition-colors ${
              hoveredPolygonId === e.polygon_id ? 'bg-[#818cf8]/20' : 'hover:bg-[#1f2937]'
            }`}
          >
            <div className="text-[11px] text-[#e5e7eb]">{e.district}</div>
            <div className="font-mono text-[10px] text-[#f59e0b]">
              {e.affected_people.toLocaleString()} {t('ops.card.people')}
            </div>
          </button>
        ))}
      </Panel>
    );
  }

  if (view === 'routes_shelters') {
    return (
      <Panel>
        <SectionTitle title={t('ops.lists.shelters')} />
        {bundle.shelters.length === 0 && <Empty message={t('ops.lists.noShelters')} />}
        {bundle.shelters.map((s) => (
          <button
            key={s.shelter_id}
            onClick={() => s.location && onFocus(s.location.lat, s.location.lon)}
            className="mb-1 flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-[#1f2937]"
          >
            <div className="min-w-0">
              <div className="text-[11px] text-[#e5e7eb]">{s.name}</div>
              <div className="font-mono text-[9px] text-[#6b7280]">{s.type}</div>
            </div>
            <span className="font-mono text-[9px] text-[#9ca3af]">
              {s.capacity_status ?? t('ops.lists.capacityUnknown')}
            </span>
          </button>
        ))}
        <SectionTitle title={t('ops.lists.routes')} />
        {bundle.routes.map((r) => (
          <div key={r.route_id} className="mb-1 flex items-center justify-between rounded px-2 py-1.5 hover:bg-[#1f2937]">
            <div className="text-[11px] text-[#e5e7eb]">
              {r.from_area_id} → {r.to_shelter_id}
            </div>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
                r.is_safe_for_recommendation
                  ? 'bg-[#2dd4bf]/15 text-[#2dd4bf]'
                  : 'bg-[#f43f5e]/15 text-[#f43f5e]'
              }`}
            >
              {r.is_safe_for_recommendation
                ? t('ops.lists.passable')
                : t('ops.lists.blocked')}
            </span>
          </div>
        ))}
      </Panel>
    );
  }

  if (view === 'gauges') {
    const statusTone: Record<string, string> = {
      danger: 'text-[#f43f5e]',
      warning: 'text-[#f59e0b]',
      normal: 'text-[#2dd4bf]'
    };
    const sorted = [...(gauges ?? [])].sort((a, b) => (a.difference_m ?? 99) - (b.difference_m ?? 99));
    const shown = sorted.slice(0, 30);
    return (
      <Panel>
        <SectionTitle title={t('ops.lists.gauges')} />
        {!gauges && <Empty message={t('common.loading')} />}
        {gauges && shown.length === 0 && <Empty message={t('ops.lists.noGauges')} />}
        {shown.map((g) => (
          <button
            key={g.gauge_id}
            onClick={() => onFocus(g.lat, g.lon, 8)}
            className="mb-1 flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-[#1f2937]"
          >
            <div className="min-w-0">
              <div className="truncate text-[11px] text-[#e5e7eb]">{g.station}</div>
              <div className="font-mono text-[9px] text-[#6b7280]">{g.river}</div>
            </div>
            <div className="text-right">
              <div className={`font-mono text-[10px] ${statusTone[g.status] ?? 'text-[#9ca3af]'}`}>
                {t(`ops.lists.gaugeStatus.${g.status ?? 'normal'}`)}
              </div>
              <div className="font-mono text-[9px] text-[#9ca3af]">
                {g.difference_m != null && (g.difference_m >= 0 ? '+' : '')}
                {g.difference_m != null ? g.difference_m.toFixed(1) : '—'} m
              </div>
            </div>
          </button>
        ))}
        {gauges && gauges.length > shown.length && (
          <div className="px-2 pb-1 font-mono text-[9px] text-[#6b7280]">
            {t('ops.lists.topN', {n: shown.length, total: gauges.length})}
          </div>
        )}
      </Panel>
    );
  }

  if (view === 'alerts') {
    const a = bundle.alert_draft;
    return (
      <Panel>
        <SectionTitle title={t('ops.lists.alertQueue')} />
        <div className="mb-1 rounded border border-[#1f2937] px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#e5e7eb]">{a.alert_id}</span>
            <span className="font-mono text-[9px] uppercase text-[#f59e0b]">{a.severity}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-[#9ca3af]">
            {a.district} · {t(`ops.card.confidence.${a.confidence_class}`)}
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-[#6b7280]">
            {t('ops.lists.status')}: {a.status} · {a.go_before} <span className="text-[#f59e0b]/70">({t('ops.card.goBeforeEstimate')})</span>
          </div>
          <div className="mt-1 text-[10px] text-[#e5e7eb]">
            {a.messages?.en?.subject ?? ''}
          </div>
        </div>
      </Panel>
    );
  }

  return null;
}