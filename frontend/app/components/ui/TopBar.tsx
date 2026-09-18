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
          কালোপাথর
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-mist-3 md:block">
          Kalopathor
        </span>
        <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${
          live ? 'border-accent/35 bg-accent/10' : 'border-warn/35 bg-est/10'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${live ? 'pulse-dot bg-accent text-accent' : 'bg-est'}`} />
          <span className={`whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-widest ${live ? 'text-accent' : 'text-est'}`}>
            {t('ops.status.livePilot')}
          </span>
        </span>
      </div>

      {/* Event + freshness — condensed from tablet (md) up, full set at lg */}
      <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
        <span className="hidden min-w-0 truncate font-mono text-[10px] text-mist-3 lg:block" title={eventName}>
          {eventName}
        </span>
        <span className="hidden h-3.5 w-px shrink-0 bg-line-strong lg:block" />
        <FreshnessStat label={t('ops.status.sarPass')} value={stats.sar} />
        <FreshnessStat label={t('ops.status.ffwcAge')} value={stats.ffwc} className="hidden lg:flex" />
        <FreshnessStat label={t('ops.status.forecastAge')} value={stats.fcst} className="hidden lg:flex" />
        <FreshnessStat label={t('ops.status.nextPass')} value={stats.next} />
      </div>
      <div className="flex-1 md:hidden" />

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          onClick={onGfmToggle}
          aria-pressed={gfmVisible}
          title={t('layers.gfm')}
          className={`hidden min-h-[36px] items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors sm:flex ${
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
          className="flex min-h-[36px] items-center rounded-md border border-line px-2 py-1 font-mono text-[10px] tracking-widest text-accent2 transition-colors hover:border-accent2/50 hover:bg-accent2/10"
        >
          {locale === 'bn' ? 'EN' : 'বাংলা'}
        </Link>
        <span
          className={`flex min-h-[36px] items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${
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
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md border border-line p-1.5 text-mist-2 transition-colors hover:border-line-strong hover:text-mist-1"
          >
            <Menu size={16} aria-hidden />
          </button>
        )}
      </div>
    </header>
  );
}

function FreshnessStat({label, value, className}: {label: string; value: string; className?: string}) {
  return (
    <span className={`flex items-baseline gap-1 whitespace-nowrap font-mono text-[10px] ${className ?? ''}`}>
      <span className="text-mist-3">{label}</span>
      <span className="text-mist-1">{value}</span>
    </span>
  );
}
