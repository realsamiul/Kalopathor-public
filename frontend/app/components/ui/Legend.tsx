'use client';

import {useTranslations} from 'next-intl';
import {ChevronDown, ChevronUp, MapPinned} from 'lucide-react';
import {useState} from 'react';

function Swatch({kind, tone}: {kind: 'fill' | 'line' | 'dash' | 'dots' | 'grad'; tone: string}) {
  const base = 'h-2.5 w-4 shrink-0 rounded-[3px]';
  switch (kind) {
    case 'fill':
      return <span className={base} style={{background: tone, opacity: 0.75}} />;
    case 'line':
      return <span className={`${base} h-[2px] rounded-full`} style={{background: tone}} />;
    case 'dash':
      return (
        <span
          className={`${base} h-[2px] rounded-full`}
          style={{
            background: `repeating-linear-gradient(90deg, ${tone} 0 3px, transparent 3px 6px)`
          }}
        />
      );
    case 'grad':
      return <span className={base} style={{background: `linear-gradient(90deg, ${tone})`}} />;
    case 'dots':
      return (
        <span className="flex w-4 items-center gap-0.5">
          {tone.split('|').map((c, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full" style={{background: c}} />
          ))}
        </span>
      );
  }
}

const ITEMS = [
  {key: 'flood', kind: 'fill' as const, tone: '#ef4444'},
  {key: 'forecast', kind: 'fill' as const, tone: '#f59e0b'},
  {key: 'exposure', kind: 'grad' as const, tone: 'rgba(45,212,191,.5), rgba(245,158,11,.6), rgba(244,63,94,.7)'},
  {key: 'river', kind: 'line' as const, tone: '#60a5fa'},
  {key: 'erosion', kind: 'dash' as const, tone: '#00e5ff'},
  {key: 'gauges', kind: 'dots' as const, tone: '#2dd4bf|#f59e0b|#f43f5e'},
  {key: 'shelter', kind: 'dots' as const, tone: '#a78bfa'},
  {key: 'route', kind: 'dash' as const, tone: '#2dd4bf'}
];

export default function Legend({collapsed: initialCollapsed = false}: {collapsed?: boolean}) {
  const t = useTranslations();
  const [open, setOpen] = useState(!initialCollapsed);
  return (
    <div className="glass w-auto min-w-40 max-w-56 overflow-hidden rounded-lg shadow-panel">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-mist-2">
          <MapPinned size={12} className="text-accent" aria-hidden />
          {t('legend.title')}
        </span>
        {open ? (
          <ChevronUp size={12} className="text-mist-3" aria-hidden />
        ) : (
          <ChevronDown size={12} className="text-mist-3" aria-hidden />
        )}
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-1 border-t border-line px-2.5 pb-2 pt-1.5">
          {ITEMS.map((it) => (
            <div key={it.key} className="flex items-center gap-2">
              <Swatch kind={it.kind} tone={it.tone} />
              <span className="text-[11px] leading-tight text-mist-2">{t(`legend.${it.key}`)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
