'use client';

import {useTranslations} from 'next-intl';
import Link from 'next/link';
import {motion} from 'framer-motion';

export default function StoryContent() {
  const t = useTranslations();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0e17] px-6">
      <motion.div
        initial={{opacity: 0, y: 40}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.6, ease: 'easeOut'}}
        className="relative z-10 flex max-w-3xl flex-col items-center text-center"
      >
        <span className="bn text-6xl font-bold text-[#e5e7eb]">কালপাথর</span>
        <h1 className="mt-4 text-sm font-light uppercase tracking-[0.35em] text-[#818cf8]">
          Kalopathor
        </h1>
        <p className="bn mt-8 max-w-xl text-lg text-[#9ca3af]">
          Bangladesh flood intelligence — sense, predict, alert, validate.
        </p>
        <p className="mt-3 max-w-xl text-sm text-[#9ca3af]/70">
          Real-time flood forecasting from SAR, weather and river gauges.
        </p>
        <Link
          href="/operations"
          className="mt-10 rounded border border-[#818cf8]/60 px-6 py-2.5 text-sm text-[#818cf8] transition-all hover:bg-[#818cf8]/10"
        >
          {t('nav.operations')} →
        </Link>
      </motion.div>

      <footer className="absolute bottom-4 left-0 right-0 text-center font-mono text-[10px] tracking-widest text-[#9ca3af]/40">
        KALOPATHOR · {t('ops.utc')}
      </footer>
    </main>
  );
}