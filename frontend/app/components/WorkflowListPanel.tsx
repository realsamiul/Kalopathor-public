'use client';

import {useTranslations} from 'next-intl';
import {
  Bell,
  CalendarClock,
  Droplets,
  ListTree,
  MapPin,
  ShieldCheck,
  Users
} from 'lucide-react';
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

const CONFIDENCE_COLOR: Record<string, string> = {
  observed_high: '#2dd4bf',
  observed_medium: '#f59e0b',
  possible: '#38bdf8',
  forecast_only: '#a78bfa',
  review_required: '#f43f5e'
};

const BADGE_STYLE: Record<string, string> = {
  monitoring: 'bg-accent/15 text-accent',
  analysis: 'bg-accent2/15 text-accent2',
  historical: 'bg-ink-3 text-mist-3'
};

function Row({
  active,
  onClick,
  onHover,
  onLeave,
  children
}: {
  active?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  children: React.ReactNode;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
        active ? 'bg-accent2/15' : onClick ? 'hover:bg-ink-3' : ''
      }`}
    >
      {children}
    </Tag>
  );
}

function Head({
  Icon,
  title,
  meta
}: {
  Icon: typeof ListTree;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between px-2 pt-1">
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-mist-3">
        <Icon size={12} className="text-accent" aria-hidden />
        {title}
      </span>
      {meta && <span className="font-mono text-[10px] text-mist-3">{meta}</span>}
    </div>
  );
}

function Empty({message}: {message: string}) {
  return <div className="px-2 py-4 text-center text-[11.5px] text-mist-3">{message}</div>;
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
        .then(
          (fc: {
            features: Array<{geometry: {coordinates: number[]}; properties: GaugeListItem}>;
          }) =>
            setGauges(
              fc.features.map((f) => ({
                ...f.properties,
                lon: f.geometry.coordinates[0],
                lat: f.geometry.coordinates[1]
              }))
            )
        )
        .catch(() => undefined);
    }
    if ((view as string) === 'next_72h' && bands === null) {
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
      <div className="flex min-h-0 flex-1 flex-col">
        <Head Icon={ListTree} title={t('ops.lists.incidents')} meta={`${topPolys.length}`} />
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {list.length === 0 && <Empty message={t('ops.lists.noIncidents')} />}
          {list.map((p) => (
            <Row
              key={p.polygon_id}
              active={hoveredPolygonId === p.polygon_id}
              onHover={() => onHoverPolygon(p.polygon_id)}
              onLeave={() => onHoverPolygon(null)}
              onClick={() => onSelectPolygon(p)}
            >
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: CONFIDENCE_COLOR[p.confidence_class] ?? '#64748b',
                  boxShadow: `0 0 6px ${CONFIDENCE_COLOR[p.confidence_class] ?? '#64748b'}66`
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px] font-medium text-mist-1">
                    {p.district ?? '—'}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-mist-2">
                    {p.area_km2.toFixed(1)} km²
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`rounded px-1 py-px font-mono text-[10px] uppercase tracking-widest ${
                      BADGE_STYLE[p.badge] ?? ''
                    }`}
                  >
                    {t(`ops.badge.${p.badge}`)}
                  </span>
                  <span className="truncate font-mono text-[10px] text-mist-3">
                    {p.affected_people?.toLocaleString() ?? '—'} {t('ops.card.people')}
                  </span>
                </div>
              </div>
            </Row>
          ))}
          {topPolys.length > TOP_N && (
            <div className="px-2 pt-1 font-mono text-[10px] text-mist-3">
              {t('ops.lists.topN', {n: TOP_N, total: topPolys.length})}
            </div>
          )}
        </div>
      </div>
    );
  }

  if ((view as string) === 'next_72h') {
    const all = bands ?? [];
    const shown = all.slice(0, 16);
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Head Icon={CalendarClock} title={t('ops.lists.forecast')} meta={`${all.length}`} />
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {shown.length === 0 && <Empty message={t('ops.lists.noForecast')} />}
          {shown.map((b) => (
            <Row key={b.band_id}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-mist-1">{b.station}</div>
                <div className="font-mono text-[10px] text-mist-3">{b.river}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-[10px] text-warn">{t('ops.lists.lead', {h: b.lead_time_hours})}</div>
                <div className="font-mono text-[10px] text-accent">
                  {b.value.toLocaleString()} {b.unit}
                </div>
              </div>
            </Row>
          ))}
          <div className="px-2 pt-1 font-mono text-[10px] text-mist-3">
            {all.length > shown.length && t('ops.lists.topN', {n: shown.length, total: all.length})}
            {all.length > 0 && ` · ${t('layers.note.forecastSource')}`}
          </div>
        </div>
      </div>
    );
  }

  if ((view as string) === 'people_at_risk') {
    const exp = [...(bundle.exposure ?? [])].sort((a, b) => b.affected_people - a.affected_people);
    const expList = exp.slice(0, TOP_N);
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Head Icon={Users} title={t('ops.lists.peopleAtRisk')} meta={`${exp.length}`} />
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {expList.length === 0 && <Empty message={t('ops.lists.noExposure')} />}
          {expList.map((e) => (
            <Row
              key={e.polygon_id}
              active={hoveredPolygonId === e.polygon_id}
              onHover={() => onHoverPolygon(e.polygon_id)}
              onLeave={() => onHoverPolygon(null)}
              onClick={() =>
                onSelectPolygon({
                  polygon_id: e.polygon_id,
                  area_km2: e.area_km2,
                  district: e.district,
                  confidence_class:
                    bundle.flood_polygons.find((p) => p.polygon_id === e.polygon_id)?.confidence_class ??
                    'possible',
                  badge: 'historical',
                  affected_people: e.affected_people,
                  sar_pass_date: bundle.event.sar_pass_date,
                  lon: null,
                  lat: null
                })
              }
            >
              <MapPin size={13} className="shrink-0 text-mist-3" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-mist-1">
                {e.district}
              </span>
              <span className="shrink-0 font-mono text-[10.5px] text-warn">
                {e.affected_people.toLocaleString()}
              </span>
            </Row>
          ))}
        </div>
      </div>
    );
  }

  if ((view as string) === 'routes_shelters') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Head Icon={MapPin} title={t('ops.lists.shelters')} meta={`${bundle.shelters.length}`} />
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {bundle.shelters.length === 0 && <Empty message={t('ops.lists.noShelters')} />}
          {bundle.shelters.map((s) => (
            <Row
              key={s.shelter_id}
              onClick={() => s.location && onFocus(s.location.lat, s.location.lon)}
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#a78bfa]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-mist-1">{s.name}</div>
                <div className="font-mono text-[10px] text-mist-3">{s.type}</div>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-mist-3">
                {s.capacity_status ?? t('ops.lists.capacityUnknown')}
              </span>
            </Row>
          ))}
        </div>
        <Head Icon={ListTree} title={t('ops.lists.routes')} meta={`${bundle.routes.length}`} />
        <div className="min-h-0 overflow-y-auto px-2 pb-2">
          {bundle.routes.map((r) => (
            <Row key={r.route_id}>
              <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-mist-1">
                {r.from_area_id} → {r.to_shelter_id}
              </span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                  r.is_safe_for_recommendation
                    ? 'bg-accent/15 text-accent'
                    : 'bg-danger/15 text-danger'
                }`}
              >
                {r.is_safe_for_recommendation ? t('ops.lists.passable') : t('ops.lists.blocked')}
              </span>
            </Row>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'gauges') {
    const statusTone: Record<string, string> = {
      danger: 'text-danger',
      warning: 'text-warn',
      normal: 'text-accent'
    };
    const sorted = [...(gauges ?? [])].sort((a, b) => (a.difference_m ?? 99) - (b.difference_m ?? 99));
    const shown = sorted.slice(0, 30);
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Head Icon={Droplets} title={t('ops.lists.gauges')} meta={`${gauges?.length ?? ''}`} />
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {!gauges && <Empty message={`${t('common.loading')}…`} />}
          {gauges && shown.length === 0 && <Empty message={t('ops.lists.noGauges')} />}
          {shown.map((g) => (
            <Row key={g.gauge_id} onClick={() => onFocus(g.lat, g.lon, 8)}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-mist-1">{g.station}</div>
                <div className="font-mono text-[10px] text-mist-3">{g.river}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className={`font-mono text-[10px] ${statusTone[g.status] ?? 'text-mist-2'}`}>
                  {t(`ops.lists.gaugeStatus.${g.status ?? 'normal'}`)}
                </div>
                <div className="font-mono text-[10px] text-mist-3">
                  {g.difference_m != null && (g.difference_m >= 0 ? '+' : '')}
                  {g.difference_m != null ? g.difference_m.toFixed(1) : '—'} m
                </div>
              </div>
            </Row>
          ))}
          {gauges && gauges.length > shown.length && (
            <div className="px-2 pt-1 font-mono text-[10px] text-mist-3">
              {t('ops.lists.topN', {n: shown.length, total: gauges.length})}
            </div>
          )}
        </div>
      </div>
    );
  }

  if ((view as string) === 'alerts') {
    const a = bundle.alert_draft;
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Head Icon={Bell} title={t('ops.lists.alertQueue')} />
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <div className="mb-1 rounded-lg border border-line bg-ink-2/60 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-mist-1">{a.alert_id}</span>
              <span
                className={`rounded px-1.5 py-px font-mono text-[10px] uppercase tracking-widest ${
                  a.severity === 'severe' ? 'bg-danger/15 text-danger' : 'bg-warn/15 text-est'
                }`}
              >
                {a.severity}
              </span>
            </div>
            <div className="mt-1 text-[11.5px] text-mist-2">
              {a.district} · {t(`ops.card.confidence.${a.confidence_class}`)}
            </div>
            <div className="mt-1 font-mono text-[10px] text-mist-3">
              {t('ops.lists.status')}: {a.status} · {a.go_before}{' '}
              <span className="text-est/80">({t('ops.card.goBeforeEstimate')})</span>
            </div>
            <div className="mt-1.5 text-[11px] leading-snug text-mist-1">
              {a.messages?.en?.subject ?? ''}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // data_quality
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Head Icon={ShieldCheck} title={t('ops.freshness.title')} />
      <div className="px-2 pb-2 text-[11px] leading-relaxed text-mist-3">
        {t('ops.lists.qualityHint')}
      </div>
    </div>
  );
}
