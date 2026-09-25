'use client';

import {useTranslations} from 'next-intl';
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

  return (
    <header className="relative z-30 flex h-12 shrink-0 items-center gap-2 border-b border-white/10 bg-black px-2.5 text-white sm:h-14 sm:gap-3 sm:px-4">
      {/* Brand */}
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="font-telegraf text-[15px] font-bold tracking-[0.25em] text-white uppercase sm:text-[17px]">
          KALOPATHOR®
        </span>
      </div>

      {/* Event + freshness — condensed from tablet (md) up, full set at lg */}
      <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
        <span className="hidden min-w-0 truncate font-mono text-[10px] text-white/50 lg:block" title={eventName}>
          {eventName}
        </span>
        <span className="hidden h-3.5 w-px shrink-0 bg-white/15 lg:block" />
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
          className={`hidden min-h-[36px] items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors sm:flex ${
            gfmVisible
              ? 'border-white bg-white text-black font-bold'
              : 'border-white/20 text-white/70 hover:border-white/50 hover:text-white'
          }`}
        >
          <Droplets size={12} aria-hidden />
          GFM
        </button>

        {showMenu && (
          <button
            onClick={onOpenMenu}
            aria-label={t('nav.more')}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md border border-white/20 p-1.5 text-white/70 transition-colors hover:border-white hover:text-white"
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
      <span className="text-white/40">{label}</span>
      <span className="text-white/80">{value}</span>
    </span>
  );
}
