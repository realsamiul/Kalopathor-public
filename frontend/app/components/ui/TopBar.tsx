'use client';

import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';
import {Droplets, Menu} from 'lucide-react';

export interface TopStats {
  sar: string;
  ffwc: string;
  fcst: string;
  next: string;
}

export default function TopBar({
  eventName,
  stats,
  healthMode,
  gfmVisible,
  onGfmToggle,
  onOpenMenu,
  showMenu
}: {
  eventName: string;
  stats: TopStats;
  healthMode: 'seeded' | 'live';
  gfmVisible: boolean;
  onGfmToggle: () => void;
  onOpenMenu: () => void;
  /** mobile: show the menu button (sheet) instead of inline stats */
  showMenu: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const live = healthMode === 'live';

  return (
    <header className="glass-strong relative z-30 flex h-12 shrink-0 items-center gap-2 border-x-0 border-t-0 px-2.5 sm:h-14 sm:gap-3 sm:px-4">
      {/* Brand */}
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="bn whitespace-nowrap text-[17px] font-bold leading-none text-mist-1 sm:text-lg">
          কালপাথর
        </span>
        <span className="hidden font-mono text-[8.5px] uppercase tracking-[0.28em] text-mist-3 md:block">
          Kalopathor
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent text-accent" />
          <span className="whitespace-nowrap font-mono text-[8.5px] font-semibold uppercase tracking-widest text-accent">
            {t('ops.status.livePilot')}
          </span>
        </span>
      </div>

      {/* Event + freshness — desktop inline, mobile in the More sheet */}
      <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
        <span className="min-w-0 truncate font-mono text-[10px] text-mist-3" title={eventName}>
          {eventName}
        </span>
        <span className="h-3.5 w-px shrink-0 bg-line-strong" />
        <FreshnessStat label={t('ops.status.sarPass')} value={stats.sar} />
        <FreshnessStat label={t('ops.status.ffwcAge')} value={stats.ffwc} />
        <FreshnessStat label={t('ops.status.forecastAge')} value={stats.fcst} />
        <FreshnessStat label={t('ops.status.nextPass')} value={stats.next} />
      </div>
      <div className="flex-1 lg:hidden" />

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          onClick={onGfmToggle}
          aria-pressed={gfmVisible}
          title={t('layers.gfm')}
          className={`hidden items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[9.5px] uppercase tracking-widest transition-colors sm:flex ${
            gfmVisible
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'border-line text-mist-3 hover:border-line-strong hover:text-mist-1'
          }`}
        >
          <Droplets size={12} aria-hidden />
          GFM
        </button>
        <Link
          href={locale === 'bn' ? '/en' : '/bn'}
          className="rounded-md border border-line px-2 py-1 font-mono text-[9.5px] tracking-widest text-accent2 transition-colors hover:border-accent2/50 hover:bg-accent2/10"
        >
          {locale === 'bn' ? 'EN' : 'বাংলা'}
        </Link>
        <span
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-widest ${
            live ? 'border-accent/40 text-accent' : 'border-warn/40 text-est'
          }`}
          title={live ? t('ops.status.liveHealth') : t('ops.freshness.seededBannerTitle')}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-accent' : 'bg-est'} ${live ? 'pulse-dot text-accent' : ''}`}
          />
          {live ? t('ops.status.healthLive') : t('ops.status.healthDemo')}
        </span>
        {showMenu && (
          <button
            onClick={onOpenMenu}
            aria-label={t('nav.more')}
            className="rounded-md border border-line p-1.5 text-mist-2 transition-colors hover:border-line-strong hover:text-mist-1"
          >
            <Menu size={16} aria-hidden />
          </button>
        )}
      </div>
    </header>
  );
}

function FreshnessStat({label, value}: {label: string; value: string}) {
  return (
    <span className="flex items-baseline gap-1 whitespace-nowrap font-mono text-[10px]">
      <span className="text-mist-3">{label}</span>
      <span className="text-mist-1">{value}</span>
    </span>
  );
}
