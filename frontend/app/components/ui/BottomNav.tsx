'use client';

import {useTranslations} from 'next-intl';
import {
  CalendarClock,
  Gauge,
  Map as MapIcon,
  SlidersHorizontal,
  Users,
  Waves
} from 'lucide-react';
import type {WorkflowItemId} from '@/lib/workflow';

const PRIMARY: {id: WorkflowItemId; Icon: typeof Waves}[] = [
  {id: 'now_flooding', Icon: Waves},
  {id: 'next_72h', Icon: CalendarClock},
  {id: 'people_at_risk', Icon: Users},
  {id: 'routes_shelters', Icon: MapIcon},
  {id: 'gauges', Icon: Gauge}
];

export default function BottomNav({
  active,
  onSelect,
  onMore
}: {
  active: WorkflowItemId;
  onSelect: (id: WorkflowItemId) => void;
  onMore: () => void;
}) {
  const t = useTranslations();
  return (
    <nav
      aria-label={t('ops.rail.title')}
      className="pb-safe glass-strong relative z-30 grid shrink-0 grid-cols-6 border-x-0 border-b-0"
    >
      {PRIMARY.map(({id, Icon}) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex min-h-[52px] flex-col items-center justify-center gap-1 px-0.5 transition-colors ${
              isActive ? 'text-accent' : 'text-mist-3 hover:text-mist-2'
            }`}
          >
            <span
              className={`absolute top-0 h-0.5 w-8 rounded-full transition-all ${
                isActive ? 'bg-accent opacity-100' : 'opacity-0'
              }`}
            />
            <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden />
            <span className="max-w-full truncate text-[10px] leading-none tracking-wide">
              {t(`ops.rail.${id}`)}
            </span>
          </button>
        );
      })}
      <button
        onClick={onMore}
        aria-current={active === 'data_quality' || active === 'alerts' ? 'page' : undefined}
        className={`group relative flex min-h-[52px] flex-col items-center justify-center gap-1 px-0.5 transition-colors ${
          active === 'alerts' || active === 'data_quality'
            ? 'text-accent'
            : 'text-mist-3 hover:text-mist-2'
        }`}
      >
        <span
          className={`absolute top-0 h-0.5 w-8 rounded-full transition-all ${
            active === 'alerts' || active === 'data_quality' ? 'bg-accent opacity-100' : 'opacity-0'
          }`}
        />
        <SlidersHorizontal size={19} strokeWidth={1.8} aria-hidden />
        <span className="text-[10px] leading-none tracking-wide">{t('nav.more')}</span>
      </button>
    </nav>
  );
}
