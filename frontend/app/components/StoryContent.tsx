'use client';

import {useTranslations} from 'next-intl';
import Link from 'next/link';
import {motion, useReducedMotion} from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Eye,
  Radio,
  Route as RouteIcon,
  ShieldCheck,
  Target,
  Users,
  Waypoints,
  GitBranch
} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import HeroMap from './HeroMap';

const STAGES = [
  {icon: Radio, title: 'stage1Title', desc: 'stage1Desc'},
  {icon: Eye, title: 'stage2Title', desc: 'stage2Desc'},
  {icon: Waypoints, title: 'stage3Title', desc: 'stage3Desc'},
  {icon: Users, title: 'stage4Title', desc: 'stage4Desc'},
  {icon: RouteIcon, title: 'stage5Title', desc: 'stage5Desc'},
  {icon: Bell, title: 'stage6Title', desc: 'stage6Desc'}
];

const INTEGRITY = [
  {title: 'integrity1Title', desc: 'integrity1Desc', color: '#fbbf24'},
  {title: 'integrity2Title', desc: 'integrity2Desc', color: '#2dd4bf'},
  {title: 'integrity3Title', desc: 'integrity3Desc', color: '#818cf8'}
];

export default function StoryContent() {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const [meta, setMeta] = useState<{polygon_count: number; total_affected: number; total_area_km2: number; gauge_count: number} | null>(null);

  useEffect(() => {
    fetch('/data/ops_meta.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((m: {sar: {polygon_count: number; total_affected: number; total_area_km2: number; gauge_count: number}} | null) => {
        if (m) setMeta(m.sar);
      })
      .catch(() => undefined);
  }, []);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <main className="relative min-h-dvh w-full overflow-x-clip bg-ink-0">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5">
        {/* fallback texture (visible until/without satellite tiles) */}
        <div
          aria-hidden
          className="drift absolute inset-0 bg-cover bg-center opacity-30"
          style={{backgroundImage: "url('/data/earth-dark.jpg')"}}
        />
        <HeroMap />
        {/* vignettes to seat the type */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(7,11,18,0.72)_100%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-0" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-t from-transparent to-ink-0/80" />

        <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
          <motion.span
            initial={reduced ? false : {opacity: 0, y: 14}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.15}}
            className="glass mb-7 flex items-center gap-2 rounded-full px-3.5 py-1.5"
          >
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mist-2">
              {t('landing.heroBadge')}
            </span>
          </motion.span>

          <motion.h1
            initial={reduced ? false : {opacity: 0, y: 24}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.7, delay: 0.25}}
            className="bn text-[64px] font-black leading-[1.15] tracking-tight text-mist-1 sm:text-[88px]"
          >
            কালপাথর
          </motion.h1>
          <motion.p
            initial={reduced ? false : {opacity: 0, y: 18}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.4}}
            className="mt-1 font-mono text-[12px] uppercase tracking-[0.5em] text-accent2"
          >
            Kalopathor
          </motion.p>

          <motion.div
            initial={reduced ? false : {opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.55}}
            className="mt-7 max-w-xl"
          >
            <p className="bn text-[17px] leading-relaxed text-mist-1/90">{t('landing.heroSubBn')}</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-mist-3">{t('landing.heroSubEn')}</p>
          </motion.div>

          <motion.div
            initial={reduced ? false : {opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.7}}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href="/operations"
              className="group flex items-center gap-2 rounded-lg border border-accent/60 bg-accent/10 px-6 py-3 text-[14px] font-semibold text-accent transition-all hover:bg-accent hover:text-ink-0"
            >
              {t('landing.ctaConsole')}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/operations?view=data_quality"
              className="flex items-center gap-2 rounded-lg border border-line px-6 py-3 text-[14px] font-medium text-mist-2 transition-colors hover:border-line-strong hover:text-mist-1"
            >
              <ShieldCheck size={15} aria-hidden />
              {t('landing.ctaQuality')}
            </Link>
          </motion.div>

          <motion.p
            initial={reduced ? false : {opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.8, delay: 1}}
            className="mt-8 font-mono text-[10px] tracking-[0.18em] text-mist-3/80"
          >
            {t('landing.heroNote')}
          </motion.p>
        </div>

        {/* scroll cue */}
        <motion.div
          aria-hidden
          animate={reduced ? undefined : {y: [0, 6, 0]}}
          transition={{duration: 2.2, repeat: Infinity, ease: 'easeInOut'}}
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-mist-3"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </section>

      {/* ----------------------------------------------------- pipeline */}
      <section className="relative border-t border-line px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Pipeline</p>
          <h2 className="mt-3 max-w-md text-balance text-[28px] font-bold leading-tight tracking-tight text-mist-1 sm:text-[34px]">
            {t('landing.pipelineTitle')}
          </h2>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-mist-3">{t('landing.pipelineSub')}</p>

          <ol className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map(({icon: Icon, title, desc}, i) => (
              <li
                key={title}
                className="group relative overflow-hidden rounded-xl border border-line bg-ink-1/60 p-4 transition-colors hover:border-line-strong"
              >
                <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-ink-2 text-accent">
                    <Icon size={16} aria-hidden />
                  </span>
                  <span className="font-mono text-[9.5px] tracking-[0.2em] text-mist-3">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-[14.5px] font-semibold text-mist-1">{t(`landing.${title}`)}</h3>
                <p className="mt-1 font-mono text-[10.5px] leading-relaxed text-mist-3">{t(`landing.${desc}`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------- KPIs */}
      <section className="border-y border-line bg-ink-1/40 px-5 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mist-3">{t('landing.kpisTitle')}</p>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
            <Kpi value={meta ? meta.polygon_count : 0} format={fmt} label={t('landing.kpiPolygons')} tone="#f43f5e" />
            <Kpi value={meta ? meta.total_area_km2 : 0} format={(n) => `${fmt(n)} km²`} label={t('landing.kpiArea')} tone="#f59e0b" />
            <Kpi value={meta ? Math.round(meta.total_affected / 1e5) : 0} format={(n) => `${(n / 10).toFixed(1)}M`} label={t('landing.kpiPeople')} tone="#2dd4bf" />
            <Kpi value={meta ? meta.gauge_count : 0} format={fmt} label={t('landing.kpiGauges')} tone="#818cf8" />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- integrity */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-est">{t('landing.integritySub')}</p>
          <h2 className="mt-3 text-[28px] font-bold tracking-tight text-mist-1 sm:text-[34px]">
            {t('landing.integrityTitle')}
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3">
            {INTEGRITY.map(({title, desc, color}) => (
              <div
                key={title}
                className="rounded-xl border border-line bg-ink-1/60 p-5"
                style={{boxShadow: `inset 0 1px 0 ${color}22`} as React.CSSProperties}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{background: color, boxShadow: `0 0 8px ${color}88`}} />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{color}}>
                    {t(`landing.${title}`)}
                  </span>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-mist-2">{t(`landing.${desc}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- footer */}
      <footer className="border-t border-line px-5 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="bn text-[15px] font-bold text-mist-1">কালপাথর</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-mist-3">
              {t('landing.credits')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/operations" className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-accent2 hover:underline">
              <GitBranch size={11} aria-hidden />
              {t('nav.operations')}
            </Link>
            <a
              href="https://github.com/realsamiul/Kalopathor-public"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] uppercase tracking-widest text-mist-3 hover:text-mist-1 hover:underline"
            >
              GitHub
            </a>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-mist-3">
              <Target size={11} aria-hidden />
              {t('ops.utc')}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Kpi({
  value,
  format,
  label,
  tone
}: {
  value: number;
  format: (n: number) => string;
  label: string;
  tone: string;
}) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (value === 0) return;
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        if (reduced) {
          setShown(value);
          return;
        }
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      {threshold: 0.4}
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="bg-ink-1 px-5 py-6">
      <div className="font-mono text-[26px] font-bold leading-none tracking-tight sm:text-[30px]" style={{color: tone}}>
        {format(shown)}
      </div>
      <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-mist-3">{label}</div>
    </div>
  );
}
