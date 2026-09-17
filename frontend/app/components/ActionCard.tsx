'use client';

import {useLocale, useTranslations} from 'next-intl';
import Link from 'next/link';
import {motion} from 'framer-motion';
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
  {dot: string; text: string; border: string; bg: string; labelKey: string}
> = {
  observed_high: {
    dot: '#2dd4bf',
    text: 'text-teal-300',
    border: 'border-teal-400/50',
    bg: 'bg-teal-500/10',
    labelKey: 'ops.card.confidence.observed_high'
  },
  observed_medium: {
    dot: '#f59e0b',
    text: 'text-amber-300',
    border: 'border-amber-400/50',
    bg: 'bg-amber-500/10',
    labelKey: 'ops.card.confidence.observed_medium'
  },
  possible: {
    dot: '#38bdf8',
    text: 'text-sky-300',
    border: 'border-sky-400/50',
    bg: 'bg-sky-500/10',
    labelKey: 'ops.card.confidence.possible'
  },
  forecast_only: {
    dot: '#a78bfa',
    text: 'text-violet-300',
    border: 'border-violet-400/50',
    bg: 'bg-violet-500/10',
    labelKey: 'ops.card.confidence.forecast_only'
  },
  review_required: {
    dot: '#f43f5e',
    text: 'text-rose-300',
    border: 'border-rose-400/50',
    bg: 'bg-rose-500/10',
    labelKey: 'ops.card.confidence.review_required'
  }
};

function ConfidenceGlyph({cls}: {cls: ConfidenceClass}) {
  const stroke = CONFIDENCE_META[cls].dot;
  if (cls === 'review_required') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M8 1.5 14.5 13h-13L8 1.5Z"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 6v3.2" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.3" r="0.9" fill={stroke} />
      </svg>
    );
  }
  if (cls === 'forecast_only') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M1.5 11.5c3 0 2.5-2.5 4.5-2.5s2 3.5 4.5 3.5c1.5 0 2.2-1 3.5-1.5"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path d="M4.5 4.5c2.6 1.4 4.8-1.6 7 0" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      </svg>
    );
  }
  if (cls === 'possible') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 9.4V6.2" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="1" fill={stroke} />
        <circle cx="8" cy="8" r="6.2" stroke={stroke} strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 14 3 11V5.2L8 2l5 3.2V11L8 14Z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5.8 8.6 7.2 10l3-3.4" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
    <motion.aside
      initial={{x: 24, opacity: 0}}
      animate={{x: 0, opacity: 1}}
      transition={{duration: 0.25}}
      className="pointer-events-auto flex h-full w-[340px] flex-col overflow-hidden rounded-lg border border-[#1f2937] bg-[#111827]/95 shadow-2xl backdrop-blur"
      aria-label={t('ops.card.title')}
    >
      <header className="flex items-center justify-between border-b border-[#1f2937] px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
          {t('ops.card.title')}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVoice((v) => !v)}
            aria-pressed={voice}
            className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              voice
                ? 'bg-[#818cf8] text-[#0a0e17]'
                : 'border border-[#1f2937] text-[#9ca3af] hover:text-[#e5e7eb]'
            }`}
          >
            {t('ops.card.voiceMode')}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#1f2937] px-2 py-0.5 font-mono text-[10px] text-[#9ca3af] hover:text-[#e5e7eb]"
            >
              {t('common.close')}
            </button>
          )}
        </div>
      </header>

      {voice ? (
        <VoiceSummary state={state} />
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
          <StatusBadge state={state} meta={meta} />
          {state.badge && (
            <span className="self-start rounded bg-[#1f2937] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
              {t(`ops.badge.${state.badge}`)}
            </span>
          )}

          <CriticalWindow time={state.criticalWindowTime} />

          <Section label={t('ops.card.affectedPeople')}>
            <p className="text-lg font-bold leading-tight text-[#e5e7eb]">
              {formatCount(state.affectedPeople, locale)}
              <span className="text-sm font-normal text-[#9ca3af]">
                {' '}
                {t('ops.card.people')} · {state.district}
              </span>
            </p>
          </Section>

          <Section label={t('ops.card.recommendedAction')}>
            <p className="text-[13px] leading-snug text-[#e5e7eb]">
              {state.recommendedAction}
            </p>
          </Section>

          <Section label={t('ops.card.nearestShelter')}>
            {state.shelter ? (
              <ShelterBlock
                name={state.shelter.name}
                distanceKm={state.shelter.distanceKm}
                travelMinutes={state.route.kind === 'safe' ? state.route.travelTimeMinutes : undefined}
                capacityStatus={state.shelter.capacityStatus}
                capacity={state.shelter.capacity}
              />
            ) : (
              <p className="text-[13px] text-[#9ca3af]">{t('ops.card.noShelter')}</p>
            )}
          </Section>

          <RouteBlock state={state.route} />

          {state.gauge && <GaugeBlock state={state} />}

          <Link
            href={`/${locale}/approval?alert=${state.capDraft.alertId}`}
            className="mt-1 flex items-center justify-between rounded border border-[#818cf8]/60 bg-[#818cf8]/10 px-3 py-2 text-[12px] font-medium text-[#818cf8] transition-colors hover:bg-[#818cf8]/20"
          >
            <span>
              {t('ops.card.capDraft')} · {state.capDraft.status.toUpperCase()}
            </span>
            <span>{t('ops.card.openApproval')}</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowEvidence((v) => !v)}
            className="mt-1 flex w-full items-center justify-between rounded border border-[#1f2937] px-3 py-2 text-left"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
              {t('ops.card.evidenceTrail')}
            </span>
            <span className="text-[10px] text-[#9ca3af]">{showEvidence ? '−' : '+'}</span>
          </button>
          {showEvidence && <EvidenceTrail state={state} />}
        </div>
      )}
    </motion.aside>
  );
}

function StatusBadge({
  state,
  meta
}: {
  state: ActionCardState;
  meta: (typeof CONFIDENCE_META)[ConfidenceClass];
}) {
  const t = useTranslations();
  return (
    <div className={`flex items-center gap-2 self-start rounded border ${meta.border} ${meta.bg} px-2.5 py-1`}>
      <ConfidenceGlyph cls={state.confidenceClass} />
      <span className={`text-[11px] font-semibold uppercase tracking-wider ${meta.text}`}>
        {t(meta.labelKey)}
      </span>
    </div>
  );
}

function CriticalWindow({time}: {time: string}) {
  const t = useTranslations();
  return (
    <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2.5 text-center">
      <p className="text-xl font-extrabold leading-tight text-[#fecaca]">
        {t('ops.card.criticalWindow', {time})}
      </p>
    </div>
  );
}

function Section({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
        {label}
      </div>
      {children}
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
    <div className="rounded border border-[#1f2937] bg-[#0f172a]/60 px-2.5 py-2">
      <p className="text-[13px] font-medium leading-snug text-[#e5e7eb]">{name}</p>
      <p className="mt-0.5 text-[11px] text-[#9ca3af]">
        {distanceKm !== null && t('ops.card.shelterDistance', {distance: distanceKm.toFixed(1)})}
        {distanceKm !== null && travelMinutes !== undefined && ' · '}
        {travelMinutes !== undefined && t('ops.card.shelterTravelTime', {minutes: travelMinutes})}
      </p>
      <p className={`mt-1 text-[11px] ${capacityStatus === 'unknown' ? 'text-[#f59e0b]' : 'text-[#2dd4bf]'}`}>
        {capacityStatus === 'unknown'
          ? t('ops.card.capacityUnknown')
          : t('ops.card.capacityKnown', {capacity: capacity ?? '—'})}
        {capacityStatus === 'unknown' && (
          <span className="ml-1 rounded bg-[#1f2937] px-1 py-px font-mono text-[9px] uppercase text-[#9ca3af]">
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
  const passabilityKey = r.passability
    ? `ops.card.passability.${r.passability}`
    : undefined;

  if (r.kind === 'none') {
    return (
      <div className="rounded-lg border-2 border-[#ef4444] bg-[#ef4444]/10 px-3 py-2.5">
        <p className="text-sm font-bold text-[#fecaca]">
          {t('ops.card.noSafeRoute')}
        </p>
        <p className="mt-1 text-[12px] text-[#fca5a5]">
          {t('ops.card.shelterInPlace')}
        </p>
        {r.reasonCodes && r.reasonCodes.length > 0 && (
          <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[#9ca3af]/70">
            {r.reasonCodes.join(' · ')}
          </p>
        )}
      </div>
    );
  }

  return (
    <Section label={t('ops.card.route')}>
      <div className="rounded border border-[#1f2937] bg-[#0f172a]/60 px-2.5 py-2">
        <div className="flex items-center justify-between">
          <span
            className={`text-[12px] font-semibold ${
              r.passability === 'open' ? 'text-[#2dd4bf]' : r.passability === 'caution' ? 'text-[#f59e0b]' : 'text-[#e5e7eb]'
            }`}
          >
            {passabilityKey && t(passabilityKey)}
          </span>
          <span className="font-mono text-[10px] text-[#9ca3af]">
            {r.validUntil && t('ops.card.validUntil', {date: formatDate(r.validUntil)})}
          </span>
        </div>
        {r.distanceKm !== undefined && r.distanceKm !== null && (
          <p className="mt-0.5 text-[11px] text-[#9ca3af]">
            {t('ops.card.shelterDistance', {distance: r.distanceKm.toFixed(1)})}
          </p>
        )}
        {r.backup && (
          <p className="mt-1 text-[11px] text-[#818cf8]">
            {t('ops.card.backupRoute', {
              name: r.backup.shelterName,
              distance: r.backup.distanceKm.toFixed(1)
            })}
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
    g.direction === 'rising' || g.direction === 'falling'
      ? `ops.card.direction.${g.direction}`
      : null;
  const normal = g.waterLevelM < g.dangerLevelM;
  return (
    <Section label={t('ops.card.gaugeSignal')}>
      <div className="rounded border border-[#1f2937] bg-[#0f172a]/60 px-2.5 py-2">
        <p className="text-[12px] text-[#e5e7eb]">
          {g.station}
          {g.river ? ` (${g.river})` : ''}:{' '}
          <span className={`font-mono font-semibold ${normal ? 'text-[#2dd4bf]' : 'text-[#f59e0b]'}`}>
            {g.waterLevelM} m
          </span>{' '}
          <span className="text-[#9ca3af]">
            / danger {g.dangerLevelM} m
          </span>
        </p>
        <p className="mt-0.5 text-[11px] text-[#9ca3af]">
          {t(`ops.card.gaugeStatus.${g.status}`)} ·{' '}
          {directionKey ? t(directionKey) : g.direction}
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
    <div className="flex flex-col gap-1.5 rounded border border-[#1f2937] bg-[#0f172a]/60 px-2.5 py-2">
      <p className="text-[10px] text-[#9ca3af]">
        {t('ops.card.sarPass', {date: state.sarPassDate})} · {state.eventId}
      </p>
      {state.evidenceTrail.map((e, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#e5e7eb]">
              {e.component}
            </span>
            <span
              className={`rounded px-1.5 py-px font-mono text-[9px] uppercase ${
                e.flag === 'real'
                  ? 'bg-[#2dd4bf]/10 text-[#2dd4bf]'
                  : 'bg-[#f59e0b]/10 text-[#f59e0b]'
              }`}
            >
              {flagLabel[e.flag] ?? e.flag}
            </span>
          </div>
          <p className="text-[10px] leading-snug text-[#9ca3af]">{e.detail}</p>
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
      : `${r.passability ? t(`ops.card.passability.${r.passability}`) : ''}${r.validUntil ? `, ${t('ops.card.validUntil', {date: r.validUntil})}` : ''}`;

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
    <div
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
      aria-live="polite"
      role="status"
    >
      <p className="text-lg font-bold leading-snug text-[#fecaca]">
        {t('ops.card.criticalWindow', {time: state.criticalWindowTime})}
        <span className="ml-2 font-mono text-[11px] font-normal text-[#f59e0b]/80">
          {t('ops.card.goBeforeEstimate')}
        </span>
      </p>
      <p className="text-[15px] leading-snug text-[#e5e7eb]">{state.recommendedAction}</p>
      <p className="text-[15px] leading-snug text-[#e5e7eb]">{shelterText}</p>
      <p className="text-[15px] leading-snug text-[#e5e7eb]">{routeText}</p>
      <div className="mt-2 border-t border-[#1f2937] pt-2 font-mono text-[9px] text-[#4b5563]">
        <p>{t('ops.card.sarPass', {date: state.sarPassDate})} · {state.capDraft.alertId}</p>
        <p className="mt-0.5">
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