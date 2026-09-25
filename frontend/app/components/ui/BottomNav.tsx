'use client';

import {useTranslations} from 'next-intl';
import {
  Gauge,
  Info,
  Waves
} from 'lucide-react';
import type {WorkflowItemId} from '@/lib/workflow';

const TABS: {id: WorkflowItemId; Icon: typeof Waves}[] = [
  {id: 'now_flooding', Icon: Waves},
  {id: 'gauges', Icon: Gauge},
  {id: 'data_quality', Icon: Info}
];

export default function BottomNav({
  active,
  onSelect
}: {
  active: WorkflowItemId;
  onSelect: (id: WorkflowItemId) => void;
  onMore?: () => void;
}) {
  const t = useTranslations();
  return (
    <nav
      aria-label={t('ops.rail.title')}
      className="pb-safe relative z-30 grid shrink-0 grid-cols-3 border-t border-white/10 bg-black text-white"
    >
      {TABS.map(({id, Icon}) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex min-h-[52px] flex-col items-center justify-center gap-1 px-0.5 transition-colors ${
              isActive ? 'text-white' : 'text-white/40 hover:text-white/80'
            }`}
          >
            <span
              className={`absolute top-0 h-0.5 w-8 rounded-full transition-all ${
                isActive ? 'bg-white opacity-100' : 'opacity-0'
              }`}
            />
            <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden />
            <span className="max-w-full truncate font-mono text-[10px] leading-none tracking-wide uppercase">
              {t(`ops.rail.${id}`)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
