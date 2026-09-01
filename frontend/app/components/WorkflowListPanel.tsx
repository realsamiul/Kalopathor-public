'use client';

import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {Bundle} from '@/lib/bundle';
import type {WorkflowItemId} from '@/lib/workflow';

function Panel({children}: {children: React.ReactNode}) {
  return (
    <motion.div
      initial={{x: -24, opacity: 0}}
      animate={{x: 0, opacity: 1}}
      transition={{delay: 0.2}}
      className="absolute left-3 top-[21rem] z-10 w-56 overflow-hidden rounded-lg border border-[#1f2937] bg-[#111827]/85 backdrop-blur"
    >
      <div className="max-h-[40vh] overflow-y-auto p-2">{children}</div>
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

function ConfidenceDot({cls}: {cls: string}) {
  const color: Record<string, string> = {
    observed_high: 'bg-[#2dd4bf]',
    observed_medium: 'bg-[#f59e0b]',
    possible: 'bg-[#38bdf8]',
    review_required: 'bg-[#f43f5e]'
  };
  return <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${color[cls] ?? 'bg-[#6b7280]'}`} />;
}

export default function WorkflowListPanel({
  view,
  bundle,
  hoveredPolygonId,
  onHoverPolygon,
  onSelectPolygon,
  onFocus
}: {
  view: WorkflowItemId;
  bundle: Bundle | null;
  hoveredPolygonId: number | null;
  onHoverPolygon: (id: number | null) => void;
  onSelectPolygon: (id: number) => void;
  onFocus: (lat: number, lon: number) => void;
}) {
  const t = useTranslations();
  if (!bundle) return null;

  if (view === 'now_flooding') {
    const polys = [...bundle.flood_polygons].sort((a, b) => b.area_km2 - a.area_km2);
    return (
      <Panel>
        <SectionTitle title={t('ops.lists.incidents')} />
        {polys.length === 0 && <Empty message={t('ops.lists.noIncidents')} />}
        {polys.map((p) => (
          <button
            key={p.polygon_id}
            onMouseEnter={() => onHoverPolygon(p.polygon_id)}
            onMouseLeave={() => onHoverPolygon(null)}
            onClick={() => onSelectPolygon(p.polygon_id)}
            className={`mb-1 flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors ${
              hoveredPolygonId === p.polygon_id
                ? 'bg-[#818cf8]/20'
                : 'hover:bg-[#1f2937]'
            }`}
          >
            <ConfidenceDot cls={p.confidence_class} />
            <div className="min-w-0">
              <div className="text-[11px] text-[#e5e7eb]">
                {p.district ?? p.region} · {p.area_km2.toFixed(1)} km²
              </div>
              <div className="font-mono text-[9px] text-[#6b7280]">
                {p.sar_pass_date} · {p.confidence_class}
              </div>
            </div>
          </button>
        ))}
      </Panel>
    );
  }

  if (view === 'next_72h') {
    const bands = bundle.forecast_bands ?? [];
    return (
      <Panel>
        <SectionTitle title={t('ops.lists.forecast')} />
        {bands.length === 0 && <Empty message={t('ops.lists.noForecast')} />}
        {bands.map((b) => (
          <div
            key={b.band_id}
            className="mb-1 flex items-center justify-between rounded px-2 py-1.5 hover:bg-[#1f2937]"
          >
            <div className="min-w-0">
              <div className="text-[11px] text-[#e5e7eb]">{b.station}</div>
              <div className="font-mono text-[9px] text-[#6b7280]">{b.river}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] text-[#818cf8]">
                {t('ops.lists.lead', {h: b.lead_time_hours})}
              </div>
              <div className="font-mono text-[9px] text-[#2dd4bf]">
                {b.value} {b.unit}
              </div>
            </div>
          </div>
        ))}
      </Panel>
    );
  }

  if (view === 'people_at_risk') {
    const exp = [...bundle.exposure].sort((a, b) => b.affected_people - a.affected_people);
    return (
      <Panel>
        <SectionTitle title={t('ops.lists.peopleAtRisk')} />
        {exp.length === 0 && <Empty message={t('ops.lists.noExposure')} />}
        {exp.map((e) => (
          <button
            key={e.polygon_id}
            onMouseEnter={() => onHoverPolygon(e.polygon_id)}
            onMouseLeave={() => onHoverPolygon(null)}
            onClick={() => onSelectPolygon(e.polygon_id)}
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
    const gauges = [...bundle.gauges].sort(
      (a, b) => a.difference_m - b.difference_m
    );
    const statusTone: Record<string, string> = {
      danger: 'text-[#f43f5e]',
      warning: 'text-[#f59e0b]',
      normal: 'text-[#2dd4bf]'
    };
    return (
      <Panel>
        <SectionTitle title={t('ops.lists.gauges')} />
        {gauges.length === 0 && <Empty message={t('ops.lists.noGauges')} />}
        {gauges.map((g) => (
          <button
            key={g.gauge_id}
            onClick={() => g.location && onFocus(g.location.lat, g.location.lon)}
            className="mb-1 flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-[#1f2937]"
          >
            <div className="min-w-0">
              <div className="text-[11px] text-[#e5e7eb]">{g.station}</div>
              <div className="font-mono text-[9px] text-[#6b7280]">{g.river}</div>
            </div>
            <div className="text-right">
              <div className={`font-mono text-[10px] ${statusTone[g.status] ?? 'text-[#9ca3af]'}`}>
                {t(`ops.lists.gaugeStatus.${g.status ?? 'normal'}`)}
              </div>
              <div className="font-mono text-[9px] text-[#9ca3af]">
                {g.difference_m >= 0 ? '+' : ''}
                {g.difference_m.toFixed(1)} m
              </div>
            </div>
          </button>
        ))}
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
            {t('ops.lists.status')}: {a.status} · {a.go_before}
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