'use client';

import {useLocale, useTranslations} from 'next-intl';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  FileText,
  Gauge,
  ListTree,
  MapPin,
  Route as RouteIcon,
  Users,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import {useState} from 'react';
import {
  type ActionCardOverrides,
  type ActionCardState,
  type Bundle,
  type ConfidenceClass,
  type RouteState,
  deriveActionCardState
} from '@/lib/bundle';

const CONFIDENCE_META: Record<
  ConfidenceClass,
  {color: string; labelKey: string}
> = {
  observed_high: {color: '#2dd4bf', labelKey: 'ops.card.confidence.observed_high'},
  observed_medium: {color: '#f59e0b', labelKey: 'ops.card.confidence.observed_medium'},
  possible: {color: '#38bdf8', labelKey: 'ops.card.confidence.possible'},
  forecast_only: {color: '#a78bfa', labelKey: 'ops.card.confidence.forecast_only'},
  review_required: {color: '#f43f5e', labelKey: 'ops.card.confidence.review_required'}
};

function ConfidenceGlyph({cls, color}: {cls: ConfidenceClass; color: string}) {
  if (cls === 'review_required') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 1.5 14.5 13h-13L8 1.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 6v3.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.3" r="0.9" fill={color} />
      </svg>
    );
  }
  if (cls === 'forecast_only') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M1.5 11.5c3 0 2.5-2.5 4.5-2.5s2 3.5 4.5 3.5c1.5 0 2.2-1 3.5-1.5"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path d="M4.5 4.5c2.6 1.4 4.8-1.6 7 0" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      </svg>
    );
  }
  if (cls === 'possible') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 9.4V6.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="1" fill={color} />
        <circle cx="8" cy="8" r="6.2" stroke={color} strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 14 3 11V5.2L8 2l5 3.2V11L8 14Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5.8 8.6 7.2 10l3-3.4" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Section({
  label,
  icon: Icon,
  children
}: {
  label: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-mist-3">
        <Icon size={12} aria-hidden />
        {label}
      </div>
      {children}
    </section>
  );
}

export default function ActionCard({
  bundle,
  polygonId,
  onClose,
  overrides
}: {
  bundle: Bundle;
  polygonId?: number | null;
  onClose?: () => void;
  overrides?: ActionCardOverrides;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [voice, setVoice] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const state = deriveActionCardState(bundle, locale, polygonId, overrides);
  const meta = CONFIDENCE_META[state.confidenceClass];

  return (
    <div className="flex h-full min-h-0 flex-col" aria-label={t('ops.card.title')}>
      {/* confidence accent bar */}
      <div className="h-1 w-full shrink-0" style={{background: `linear-gradient(90deg, ${meta.color}, transparent 85%)`}} />

      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2.5 sm:px-4">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-mist-3">
          {t('ops.card.title')}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setVoice((v) => !v)}
            aria-pressed={voice}
            title={t('ops.card.voiceMode')}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors ${
              voice
                ? 'border-accent2/60 bg-accent2/15 text-accent2'
                : 'border-line text-mist-3 hover:text-mist-1'
            }`}
          >
            {voice ? <Volume2 size={12} aria-hidden /> : <VolumeX size={12} aria-hidden />}
            {t('ops.card.voiceMode')}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="rounded-md border border-line p-1.5 text-mist-3 transition-colors hover:border-line-strong hover:text-mist-1"
            >
              <X size={13} aria-hidden />
            </button>
          )}
        </div>
      </header>

      {voice ? (
        <VoiceSummary state={state} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-4 sm:px-4">
          <div
            className="flex w-fit items-center gap-2 self-start rounded-md border px-2.5 py-1.5"
            style={{borderColor: `${meta.color}66`, background: `${meta.color}14`}}
          >
            <ConfidenceGlyph cls={state.confidenceClass} color={meta.color} />
            <span className="text-[11.5px] font-semibold uppercase tracking-wider" style={{color: meta.color}}>
              {t(meta.labelKey)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 rounded-lg border border-danger/35 bg-danger/10 px-3 py-3.5">
            <Clock size={22} className="shrink-0 text-danger" aria-hidden />
            <p className="text-[19px] font-extrabold leading-tight tracking-tight text-[#fecaca] sm:text-[21px]">
              {t('ops.card.criticalWindow', {time: state.criticalWindowTime})}
            </p>
          </div>

          {state.badge && (
            <span className="-mt-2 w-fit rounded bg-ink-3 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-mist-3">
              {t(`ops.badge.${state.badge}`)}
            </span>
          )}

          <Section label={t('ops.card.affectedPeople')} icon={Users}>
            <p className="text-[22px] font-bold leading-tight tracking-tight text-mist-1">
              {formatCount(state.affectedPeople, locale)}
              <span className="ml-2 text-[13px] font-normal text-mist-3">
                {t('ops.card.people')} · {state.district}
              </span>
            </p>
          </Section>

          <Section label={t('ops.card.recommendedAction')} icon={FileText}>
            <p className="text-[13.5px] leading-snug text-mist-1">{state.recommendedAction}</p>
          </Section>

          <Section label={t('ops.card.nearestShelter')} icon={MapPin}>
            {state.shelter ? (
              <ShelterBlock
                name={state.shelter.name}
                distanceKm={state.shelter.distanceKm}
                travelMinutes={state.route.kind === 'safe' ? state.route.travelTimeMinutes : undefined}
                capacityStatus={state.shelter.capacityStatus}
                capacity={state.shelter.capacity}
              />
            ) : (
              <p className="text-[13px] text-mist-3">{t('ops.card.noShelter')}</p>
            )}
          </Section>

          <RouteBlock state={state.route} />

          {state.gauge && <GaugeBlock state={state} />}

          <div className="mt-auto flex flex-col gap-2 pt-1">
            <Link
              href={`/${locale}/approval?alert=${state.capDraft.alertId}`}
              className="flex items-center justify-between rounded-lg border border-accent2/50 bg-accent2/12 px-3 py-2.5 text-[12.5px] font-semibold text-accent2 transition-colors hover:bg-accent2/20"
            >
              <span className="flex items-center gap-2">
                <FileText size={14} aria-hidden />
                {t('ops.card.capDraft')} · {state.capDraft.status.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                {t('ops.card.openApproval')}
                <ArrowRight size={12} aria-hidden />
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setShowEvidence((v) => !v)}
              aria-expanded={showEvidence}
              className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 transition-colors hover:bg-ink-3"
            >
              <span className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-mist-3">
                <ListTree size={12} aria-hidden />
                {t('ops.card.evidenceTrail')}
              </span>
              <span className={`text-[11px] text-mist-3 transition-transform ${showEvidence ? 'rotate-45' : ''}`}>
                +
              </span>
            </button>
            {showEvidence && <EvidenceTrail state={state} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ShelterBlock({
  name,
  distanceKm,
  travelMinutes,
  capacityStatus,
  capacity
}: {
  name: string;
  distanceKm: number | null;
  travelMinutes?: number;
  capacityStatus: string;
  capacity: number | null;
}) {
  const t = useTranslations();
  return (
    <div className="rounded-lg border border-line bg-ink-2/60 px-3 py-2.5">
      <p className="text-[13.5px] font-semibold leading-snug text-mist-1">{name}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px] text-mist-2">
        {distanceKm !== null && (
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-mist-3" aria-hidden />
            {t('ops.card.shelterDistance', {distance: distanceKm.toFixed(1)})}
          </span>
        )}
        {travelMinutes !== undefined && (
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-mist-3" aria-hidden />
            {t('ops.card.shelterTravelTime', {minutes: travelMinutes})}
          </span>
        )}
      </p>
      <p
        className={`mt-1.5 text-[11.5px] ${
          capacityStatus === 'unknown' ? 'text-est' : 'text-accent'
        }`}
      >
        {capacityStatus === 'unknown'
          ? t('ops.card.capacityUnknown')
          : t('ops.card.capacityKnown', {capacity: capacity ?? '—'})}
        {capacityStatus === 'unknown' && (
          <span className="ml-1.5 rounded bg-ink-3 px-1 py-px font-mono text-[8.5px] uppercase text-mist-3">
            {t('ops.card.provisional')}
          </span>
        )}
      </p>
    </div>
  );
}

function RouteBlock({state}: {state: RouteState}) {
  const t = useTranslations();
  const r = state;
  const passabilityKey = r.passability ? `ops.card.passability.${r.passability}` : undefined;

  if (r.kind === 'none') {
    return (
      <div className="rounded-lg border-2 border-danger bg-danger/10 px-3 py-3">
        <p className="flex items-center gap-2 text-[14px] font-bold text-[#fecaca]">
          <RouteIcon size={15} aria-hidden />
          {t('ops.card.noSafeRoute')}
        </p>
        <p className="mt-1 text-[12.5px] leading-snug text-[#fca5a5]">{t('ops.card.shelterInPlace')}</p>
        {r.reasonCodes && r.reasonCodes.length > 0 && (
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-mist-3/80">
            {r.reasonCodes.join(' · ')}
          </p>
        )}
      </div>
    );
  }

  return (
    <Section label={t('ops.card.route')} icon={RouteIcon}>
      <div className="rounded-lg border border-line bg-ink-2/60 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[12.5px] font-semibold ${
              r.passability === 'open' ? 'text-accent' : r.passability === 'caution' ? 'text-warn' : 'text-mist-1'
            }`}
          >
            {passabilityKey && t(passabilityKey)}
          </span>
          <span className="font-mono text-[9.5px] text-mist-3">
            {r.validUntil && t('ops.card.validUntil', {date: formatDate(r.validUntil)})}
          </span>
        </div>
        {r.distanceKm !== undefined && r.distanceKm !== null && (
          <p className="mt-1 text-[11.5px] text-mist-2">
            {t('ops.card.shelterDistance', {distance: r.distanceKm.toFixed(1)})}
          </p>
        )}
        {r.backup && (
          <p className="mt-1 text-[11.5px] text-accent2">
            {t('ops.card.backupRoute', {name: r.backup.shelterName, distance: r.backup.distanceKm.toFixed(1)})}
          </p>
        )}
      </div>
    </Section>
  );
}

function GaugeBlock({state}: {state: ActionCardState}) {
  const t = useTranslations();
  const g = state.gauge;
  if (!g) return null;
  const directionKey =
    g.direction === 'rising' || g.direction === 'falling' ? `ops.card.direction.${g.direction}` : null;
  const normal = g.waterLevelM < g.dangerLevelM;
  return (
    <Section label={t('ops.card.gaugeSignal')} icon={Gauge}>
      <div className="rounded-lg border border-line bg-ink-2/60 px-3 py-2.5">
        <p className="text-[12.5px] text-mist-1">
          {g.station}
          {g.river ? ` (${g.river})` : ''}:{' '}
          <span className={`font-mono font-bold ${normal ? 'text-accent' : 'text-warn'}`}>
            {g.waterLevelM} m
          </span>{' '}
          <span className="text-mist-3">/ {g.dangerLevelM} m</span>
        </p>
        <p className="mt-1 text-[11.5px] text-mist-2">
          {t(`ops.card.gaugeStatus.${g.status}`)} · {directionKey ? t(directionKey) : g.direction}
        </p>
      </div>
    </Section>
  );
}

function EvidenceTrail({state}: {state: ActionCardState}) {
  const t = useTranslations();
  const flagLabel: Record<string, string> = {
    real: 'real',
    proxy: t('ops.card.provisional'),
    derived: 'derived'
  };
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-ink-2/60 px-3 py-2.5">
      <p className="font-mono text-[9.5px] text-mist-3">
        {t('ops.card.sarPass', {date: state.sarPassDate})} · {state.eventId}
      </p>
      {state.evidenceTrail.map((e, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9.5px] uppercase tracking-wider text-mist-1">{e.component}</span>
            <span
              className={`rounded px-1.5 py-px font-mono text-[8.5px] uppercase ${
                e.flag === 'real' ? 'bg-accent/10 text-accent' : 'bg-est/10 text-est'
              }`}
            >
              {flagLabel[e.flag] ?? e.flag}
            </span>
          </div>
          <p className="text-[10.5px] leading-snug text-mist-2">{e.detail}</p>
        </div>
      ))}
    </div>
  );
}

function VoiceSummary({state}: {state: ActionCardState}) {
  const t = useTranslations();
  const r = state.route;
  const routeText =
    r.kind === 'none'
      ? `${t('ops.card.noSafeRoute')}. ${t('ops.card.shelterInPlace')}`
      : `${r.passability ? t(`ops.card.passability.${r.passability}`) : ''}${
          r.validUntil ? `, ${t('ops.card.validUntil', {date: r.validUntil})}` : ''
        }`;

  const shelterText = state.shelter
    ? `${state.shelter.name}. ${
        state.shelter.distanceKm !== null
          ? t('ops.card.shelterDistance', {distance: state.shelter.distanceKm.toFixed(1)})
          : ''
      }. ${
        state.shelter.capacityStatus === 'unknown'
          ? t('ops.card.capacityUnknown')
          : t('ops.card.capacityKnown', {capacity: state.shelter.capacity ?? '—'})
      }`
    : t('ops.card.noShelter');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-5" aria-live="polite" role="status">
      <p className="text-[22px] font-extrabold leading-snug tracking-tight text-[#fecaca]">
        {t('ops.card.criticalWindow', {time: state.criticalWindowTime})}
        <span className="mt-1 block font-mono text-[11px] font-normal text-est/80">
          {t('ops.card.goBeforeEstimate')}
        </span>
      </p>
      <p className="text-[16px] leading-snug text-mist-1">{state.recommendedAction}</p>
      <p className="text-[16px] leading-snug text-mist-1">{shelterText}</p>
      <p className="text-[16px] leading-snug text-mist-1">{routeText}</p>
      <div className="mt-auto border-t border-line pt-3 font-mono text-[9.5px] text-mist-3">
        <p>
          {t('ops.card.sarPass', {date: state.sarPassDate})} · {state.capDraft.alertId}
        </p>
        <p className="mt-1">
          {t('ops.card.modelVersion')}: d3v4.2 · {t('ops.card.threshold')}: τ=0.5 · {t('ops.card.polygonCount')}: 1,199
        </p>
      </div>
    </div>
  );
}

function formatCount(n: number, locale: string): string {
  return n.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}
