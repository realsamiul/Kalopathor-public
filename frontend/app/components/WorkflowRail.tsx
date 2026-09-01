'use client';

import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useState} from 'react';
import type {ReactNode} from 'react';
import {WORKFLOW_ITEMS, type WorkflowItemId} from '@/lib/workflow';

export default function WorkflowRail({
  active,
  onSelect,
  layersToggle
}: {
  active: WorkflowItemId;
  onSelect: (id: WorkflowItemId) => void;
  layersToggle: ReactNode;
}) {
  const t = useTranslations();
  const [layersOpen, setLayersOpen] = useState(false);

  return (
    <motion.div
      initial={{x: -24, opacity: 0}}
      animate={{x: 0, opacity: 1}}
      transition={{delay: 0.15}}
      className="absolute left-3 top-12 z-20 w-48 rounded-lg border border-[#1f2937] bg-[#111827]/85 p-3 backdrop-blur"
    >
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
        {t('ops.rail.title')}
      </div>
      <div className="flex flex-col gap-1">
        {WORKFLOW_ITEMS.map(({id}) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`rounded px-2 py-1.5 text-left text-[12px] transition-colors ${
              active === id
                ? 'bg-[#818cf8]/20 text-[#c7d2fe]'
                : 'text-[#9ca3af] hover:bg-[#1f2937] hover:text-[#e5e7eb]'
            }`}
          >
            {t(`ops.rail.${id}`)}
          </button>
        ))}
      </div>

      <div className="mt-2 border-t border-[#1f2937] pt-2">
        <button
          onClick={() => setLayersOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded px-2 py-1 text-left font-mono text-[10px] uppercase tracking-widest text-[#9ca3af] transition-colors hover:text-[#e5e7eb]"
        >
          <span>{t('ops.rail.layers')}</span>
          <span className="text-[#818cf8]">{layersOpen ? '−' : '+'}</span>
        </button>
        {layersOpen && (
          <motion.div
            initial={{height: 0, opacity: 0}}
            animate={{height: 'auto', opacity: 1}}
            className="overflow-hidden"
          >
            <div className="pt-2">{layersToggle}</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}