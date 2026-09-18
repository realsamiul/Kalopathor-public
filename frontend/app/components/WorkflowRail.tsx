'use client';

import {useTranslations} from 'next-intl';
import {
  Bell,
  CalendarClock,
  ChevronDown,
  Gauge,
  Layers,
  Map as MapIcon,
  ShieldCheck,
  Users,
  Waves
} from 'lucide-react';
import type {ReactNode} from 'react';
import {WORKFLOW_ITEMS, type WorkflowItemId} from '@/lib/workflow';

const ICONS: Record<WorkflowItemId, typeof Waves> = {
  now_flooding: Waves,
  next_72h: CalendarClock,
  people_at_risk: Users,
  routes_shelters: MapIcon,
  gauges: Gauge,
  alerts: Bell,
  data_quality: ShieldCheck
};

export default function WorkflowRail({
  active,
  onSelect,
  compact,
  layersOpen,
  onToggleLayers,
  layersToggle
}: {
  active: WorkflowItemId;
  onSelect: (id: WorkflowItemId) => void;
  /** tablet: icon-only rail */
  compact?: boolean;
  layersOpen: boolean;
  onToggleLayers: () => void;
  layersToggle: ReactNode;
}) {
  const t = useTranslations();
  return (
    <div
      className={`glass-strong flex h-full shrink-0 flex-col overflow-hidden border-x-0 border-b-0 ${
        compact ? 'w-14' : 'w-60'
      }`}
    >
      <div
        className={`shrink-0 border-b border-line px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.22em] text-mist-3 ${
          compact ? 'flex justify-center px-0' : ''
        }`}
      >
        {compact ? <Waves size={14} aria-hidden /> : t('ops.rail.title')}
      </div>

      <div className={`flex shrink-0 flex-col gap-0.5 p-1.5 ${compact ? 'items-center' : ''}`}>
        {WORKFLOW_ITEMS.map(({id}, i) => {
          const Icon = ICONS[id];
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={t(`ops.rail.${id}`)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                compact ? 'flex-1 justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-accent/12 text-accent'
                  : 'text-mist-2 hover:bg-ink-3 hover:text-mist-1'
              }`}
            >
              {isActive && !compact && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
              )}
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden />
              {!compact && (
                <>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium leading-tight">
                    {t(`ops.rail.${id}`)}
                  </span>
                  <span className="font-mono text-[9px] text-mist-3 opacity-0 transition-opacity group-hover:opacity-100">
                    {i + 1}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1" />

      {!compact && (
        <div className="shrink-0 border-t border-line">
          <button
            onClick={onToggleLayers}
            aria-expanded={layersOpen}
            className="flex w-full items-center justify-between px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.22em] text-mist-3 transition-colors hover:text-mist-1"
          >
            <span className="flex items-center gap-1.5">
              <Layers size={12} aria-hidden />
              {t('ops.rail.layers')}
            </span>
            <ChevronDown
              size={13}
              className={`transition-transform ${layersOpen ? 'rotate-180 text-accent' : ''}`}
              aria-hidden
            />
          </button>
          {layersOpen && (
            <div className="max-h-[42vh] overflow-y-auto border-t border-line px-3 py-2.5">
              {layersToggle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
