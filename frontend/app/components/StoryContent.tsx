'use client';

import React, {useEffect, useRef, useState, useCallback} from 'react';
import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  ChevronDown,
  Cpu,
  Orbit,
  Terminal,
  ExternalLink
} from 'lucide-react';
import ThreePlatformScene, {STAGE_CONFIGS} from './ThreePlatformScene';

// ---------------------------------------------------------------------------
// Real Data Fodder from FINAL_COMPREHENSIVE_REPORT_2026-09-18.md
// ---------------------------------------------------------------------------

const CHANNELS_DATA = [
  {
    ch: 0,
    id: 'vv',
    name: 'VV Backscatter',
    band: 'C-band (5.405 GHz)',
    type: 'Co-polarization radar (flood pass)',
    role: 'Primary open water segmentation',
    rationale:
      'Smooth, specular open floodwater reflects microwave radar energy away from the satellite antenna, resulting in pronounced dark signatures (backscatter drop of -6 dB to -14 dB).',
    color: '#38bdf8',
    stats: 'Threshold: -12.4 dB · Co-pol pass'
  },
  {
    ch: 1,
    id: 'vh',
    name: 'VH Polarimetry',
    band: 'C-band Cross-pol',
    type: 'Cross-polarization radar (flood pass)',
    role: 'Vegetation & urban depolarization',
    rationale:
      'Depolarization ratio isolates volume scattering from emergent crop canopy and flooded vegetation where VV alone suffers from double-bounce false negatives.',
    color: '#818cf8',
    stats: 'Cross-pol ratio · Canopy penetration'
  },
  {
    ch: 2,
    id: 'dem',
    name: 'Copernicus DEM 90m',
    band: 'Global Elevation Model',
    type: 'Topographic surface elevation',
    role: 'Basin slope & elevation boundary',
    rationale:
      'Eliminates radar shadows in elevated hilly terrain (Chittagong Hill Tracts, Meghalaya border) and provides gravitational flow boundary conditions.',
    color: '#10b981',
    stats: '90m spatial grid · Copernicus EEA'
  },
  {
    ch: 3,
    id: 'hand',
    name: 'HAND Hydrology',
    band: 'Relative Drainage Topography',
    type: 'Height Above Nearest Drainage',
    role: 'Hydrologic relative flood potential',
    rationale:
      'Normalizes terrain elevation relative to the local drainage network. Pixels with HAND < 2m represent physical low-lying floodplains regardless of absolute elevation.',
    color: '#2dd4bf',
    stats: 'Hydrologic drainage potential · < 2.0m'
  },
  {
    ch: 4,
    id: 'jrc',
    name: 'JRC Global Water Mask',
    band: '38-Year Surface Water History',
    type: 'Seasonal & permanent water baseline',
    role: 'Excludes permanent rivers & lakes',
    rationale:
      'Derived from 38 years of Landsat observations (threshold 0.9). Distinguishes genuine catastrophic flood inundation from permanent perennial waterbodies.',
    color: '#3b82f6',
    stats: 'Threshold 0.90 · 38-yr occurrence'
  },
  {
    ch: 5,
    id: 'change',
    name: 'Differential CHANGE',
    band: 'Temporal SAR Delta Vector',
    type: 'VV(flood) − VV(dry reference)',
    role: 'Monsoon dynamic change isolation',
    rationale:
      'Computed as pixel-wise difference between flood-pass VV and dry-season reference. Isolates rapid water appearance while filtering out static radar artifacts.',
    color: '#f43f5e',
    stats: 'VV(flood) - VV(dry) · d3v4.2 baseline'
  }
];

const MODEL_LEDGER_DATA = [
  {
    version: 'd3v3',
    keyChange: '4-channel baseline (VV, VH, DEM, GSW)',
    feniTripwire: '—',
    valIoU: '0.518',
    negCtrlFPR: '—',
    status: 'Retired',
    statusColor: 'text-white/60',
    notes: 'Established baseline. Lacked relative hydrology (HAND) and temporal change.'
  },
  {
    version: 'd3v4.1',
    keyChange: '6-channel + HAND + MONSOON + CHANGE v1',
    feniTripwire: '0.4703',
    valIoU: '0.5433',
    negCtrlFPR: '—',
    status: 'Rollback only',
    statusColor: 'text-warn',
    notes: 'Marginal validation gain. Feni holdout dropped due to uniform chip weighting.'
  },
  {
    version: 'd3v4.2',
    keyChange: 'Strong-label ×2 weighting on Feni UNOSAT chips',
    feniTripwire: '0.5338',
    valIoU: '0.5432',
    negCtrlFPR: '0.335',
    status: 'OPS MODEL',
    statusColor: 'text-accent font-bold',
    notes: 'The breakthrough (+0.064 Feni IoU). UNOSAT labels signal anchor. Promoted to ops.'
  },
  {
    version: 'd3v5',
    keyChange: 'Identical chips6 recipe (reproducibility check)',
    feniTripwire: '0.5338',
    valIoU: '0.5432',
    negCtrlFPR: '0.335',
    status: 'Tied v4.2',
    statusColor: 'text-white/80',
    notes: 'Exact match with v4.2. Confirmed reproducibility, kept v4.2 in ops.'
  },
  {
    version: 'd3v5true',
    keyChange: 'CHANGE v2 dry-season composite (Nov–Mar median)',
    feniTripwire: '0.5382',
    valIoU: '0.5429',
    negCtrlFPR: '0.611',
    status: 'Gate FAIL',
    statusColor: 'text-danger font-bold',
    notes: 'Catastrophic FPR regression. Nov–Mar median contaminated by boro rice irrigation.'
  },
  {
    version: 'd3v6',
    keyChange: 'CHANGE v3 Feb-only 10th-percentile composite',
    feniTripwire: '0.5026',
    valIoU: '0.5433',
    negCtrlFPR: '0.591',
    status: 'Gate FAIL',
    statusColor: 'text-danger font-bold',
    notes: 'All gates failed. Dark Feb reference amplified false change signal everywhere.'
  }
];

const DIVISIONS_DATA = [
  {division: 'Khulna', polygons: 237, areaKm2: '4,812 km²', risk: 'High', color: '#f43f5e'},
  {division: 'Rajshahi', polygons: 230, areaKm2: '4,450 km²', risk: 'High', color: '#f43f5e'},
  {division: 'Sylhet', polygons: 222, areaKm2: '4,280 km²', risk: 'Critical', color: '#f43f5e'},
  {division: 'Rangpur', polygons: 190, areaKm2: '3,310 km²', risk: 'Moderate', color: '#fbbf24'},
  {division: 'Mymensingh', polygons: 129, areaKm2: '2,420 km²', risk: 'High', color: '#f43f5e'},
  {division: 'Dhaka', polygons: 88, areaKm2: '1,490 km²', risk: 'Moderate', color: '#fbbf24'},
  {division: 'Chittagong', polygons: 85, areaKm2: '1,012 km²', risk: 'Severe (Feni)', color: '#f43f5e'},
  {division: 'Barisal', polygons: 18, areaKm2: '180 km²', risk: 'Low', color: '#34d399'}
];

const TOP_POLYGONS = [
  {id: 217, district: 'Sunamganj', area: 792.4, people: 162451, conf: 'Observed · Medium', badge: 'Monitoring'},
  {id: 210, district: 'Kishoreganj', area: 766.4, people: 98163, conf: 'Observed · Medium', badge: 'Monitoring'},
  {id: 220, district: 'Sunamganj', area: 752.9, people: 136323, conf: 'Observed · Medium', badge: 'Monitoring'},
  {id: 212, district: 'Netrakona', area: 735.1, people: 83914, conf: 'Observed · Medium', badge: 'Monitoring'},
  {id: 207, district: 'Netrakona', area: 723.2, people: 532956, conf: 'Observed · Medium', badge: 'Critical'},
  {id: 202, district: 'Mymensingh', area: 704.9, people: 641523, conf: 'Observed · Medium', badge: 'Critical'},
  {id: 158, district: 'Joypurhat', area: 643.0, people: 153496, conf: 'Observed · Medium', badge: 'Monitoring'},
  {id: 502, district: 'Habiganj', area: 640.9, people: 64215, conf: 'Observed · Medium', badge: 'Monitoring'},
  {id: 205, district: 'Mymensingh', area: 625.8, people: 629847, conf: 'Observed · Medium', badge: 'Critical'},
  {id: 3, district: 'Thakurgaon', area: 622.8, people: 336811, conf: 'Observed · Medium', badge: 'Monitoring'},
  {id: 340, district: 'Nawabganj', area: 498.0, people: 727687, conf: 'Observed · Medium', badge: 'Critical'},
  {id: 423, district: 'Bogra', area: 484.3, people: 115270, conf: 'Observed · Medium', badge: 'Monitoring'}
];

export default function StoryContent() {
  const t = useTranslations();
  const locale = useLocale();

  // Scroll tracking for Three.js 3D platform experience
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState(0);
  const [expandedGateDetails, setExpandedGateDetails] = useState(false);

  // Scroll listener for sticky 3D presentation
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollSectionRef.current) return;
      const rect = scrollSectionRef.current.getBoundingClientRect();
      const totalH = scrollSectionRef.current.offsetHeight - window.innerHeight;
      if (totalH <= 0) return;

      const progress = Math.max(0, Math.min(1, -rect.top / totalH));
      setScrollProgress(progress);

      // 6 stages: 0 to 5
      const stageIdx = Math.min(5, Math.floor(progress * 6));
      setActiveStage(stageIdx);
    };

    window.addEventListener('scroll', handleScroll, {passive: true});
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStageSelect = useCallback((idx: number) => {
    if (!scrollSectionRef.current) return;
    const top = scrollSectionRef.current.offsetTop;
    const totalH = scrollSectionRef.current.offsetHeight - window.innerHeight;
    const targetScroll = top + (idx / 5.95) * totalH;
    window.scrollTo({top: targetScroll, behavior: 'smooth'});
    setActiveStage(idx);
  }, []);

  const currentStage = STAGE_CONFIGS[activeStage] || STAGE_CONFIGS[0];

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-ink-0 text-white selection:bg-accent/30 selection:text-white">
      {/* -------------------------------------------------------------
          Fixed Floating Top Bar (iOS Ultra-Sleek Frosted Glass Pill)
      -------------------------------------------------------------- */}
      <header className="fixed top-4 inset-x-0 z-50 mx-auto w-[94%] max-w-6xl">
        <div className="glass-strong flex h-14 items-center justify-between rounded-full border border-white/10 px-4 shadow-2xl sm:px-6">
          {/* Brand */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 transition-transform hover:scale-105">
            <span className="bn text-xl font-black tracking-tight text-white sm:text-2xl">
              কালপাথর
            </span>
            <span className="hidden font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-white/90 sm:inline">
              Kalopathor
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white">
                d3v4.2 OPS
              </span>
            </span>
          </Link>

          {/* Nav Anchors */}
          <nav className="hidden items-center gap-6 lg:flex">
            <button
              onClick={() => handleStageSelect(0)}
              className="font-mono text-[11px] font-medium uppercase tracking-wider text-white/90 transition-colors hover:text-white"
            >
              3D Platform
            </button>
            <a
              href="#channels"
              className="font-mono text-[11px] font-medium uppercase tracking-wider text-white/90 transition-colors hover:text-white"
            >
              6-Channel Radar
            </a>
            <a
              href="#ledger"
              className="font-mono text-[11px] font-medium uppercase tracking-wider text-white/90 transition-colors hover:text-white"
            >
              Model Ledger
            </a>
            <a
              href="#exposure"
              className="font-mono text-[11px] font-medium uppercase tracking-wider text-white/90 transition-colors hover:text-white"
            >
              Exposure
            </a>
            <a
              href="#cap-dispatch"
              className="font-mono text-[11px] font-medium uppercase tracking-wider text-white/90 transition-colors hover:text-white"
            >
              CAP 1.2
            </a>
            <a
              href="#honesty"
              className="font-mono text-[11px] font-medium uppercase tracking-wider text-white/90 transition-colors hover:text-white"
            >
              Honesty
            </a>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3">
            <Link
              href={locale === 'bn' ? '/en' : '/bn'}
              className="flex h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 font-mono text-[10px] font-bold tracking-widest text-white transition-colors hover:border-white/30 hover:bg-white/10"
            >
              {locale === 'bn' ? 'ENGLISH' : 'বাংলা'}
            </Link>

            <Link
              href="/operations"
              className="group flex h-9 items-center gap-1.5 rounded-full border border-accent/60 bg-accent/20 px-4 font-mono text-[11px] font-bold tracking-wider text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all hover:bg-accent hover:text-ink-0 hover:shadow-[0_0_25px_rgba(56,189,248,0.6)]"
            >
              <span>{t('landing.ctaConsole')}</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          Section 1: Cinematic Hero Section (iOS Dark Canvas)
      -------------------------------------------------------------- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-16">
        {/* Subtle radial glows for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/4 left-1/2 h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[130px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-1/3 left-1/3 h-[400px] w-[400px] rounded-full bg-accent2/10 blur-[120px]"
        />

        <div className="relative z-10 flex max-w-4xl flex-col items-center text-center">
          {/* Status Badge */}
          <div className="glass mb-6 flex items-center gap-2.5 rounded-full border border-white/15 px-4 py-1.5 shadow-lg">
            <span className="pulse-dot h-2 w-2 rounded-full bg-accent" />
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.25em] text-white">
              {t('landing.heroBadge')}
            </span>
          </div>

          {/* Bilingual Primary Headings */}
          <h1 className="bn text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.15)] sm:text-8xl md:text-9xl">
            কালপাথর
          </h1>
          <p className="mt-2 font-mono text-[14px] font-extrabold uppercase tracking-[0.55em] text-white/95 sm:text-[16px]">
            KALOPATHOR
          </p>

          {/* Subtitles from Work Report */}
          <div className="mt-6 max-w-2xl">
            <p className="bn text-xl font-bold leading-relaxed text-white drop-shadow sm:text-2xl">
              {t('landing.heroSubBn')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/90 sm:text-base">
              {t('landing.heroSubEn')}
            </p>
            <p className="mt-3 font-mono text-xs text-white/80">
              From 700km Polar Orbit to 30m Ground Truth: Sensing, Modeling, and Predicting Flood Inundation Across All 8 Divisions.
            </p>
          </div>

          {/* Hero CTAs */}
          <div className="mt-9 flex flex-col items-center gap-3.5 sm:flex-row">
            <Link
              href="/operations"
              className="group flex h-12 items-center gap-2.5 rounded-xl border border-accent bg-accent/25 px-7 font-sans text-sm font-bold text-white shadow-[0_0_30px_rgba(56,189,248,0.35)] transition-all hover:bg-accent hover:text-ink-0"
            >
              <span>{t('landing.ctaConsole')}</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>

            <button
              onClick={() => handleStageSelect(0)}
              className="flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 font-sans text-sm font-semibold text-white backdrop-blur-xl transition-all hover:border-white/40 hover:bg-white/10"
            >
              <Orbit size={16} className="text-accent" />
              <span>{t('landing.cta3D')}</span>
            </button>

            <a
              href="#ledger"
              className="flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 font-sans text-sm font-semibold text-white/90 transition-all hover:border-white/30 hover:bg-white/10"
            >
              <FileText size={15} className="text-white/80" />
              <span>{t('landing.ctaLedger')}</span>
            </a>
          </div>

          {/* Operational KPIs Ticker Ribbon */}
          <div className="mt-14 w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-1/60 shadow-2xl backdrop-blur-2xl">
            <div className="grid grid-cols-2 divide-x divide-y divide-white/10 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
              <KpiStat label="Active Polygons" value="1,199" unit="τ=0.5 threshold" accent="#38bdf8" />
              <KpiStat label="Flooded Surface" value="21,954" unit="km² mapped" accent="#38bdf8" />
              <KpiStat label="Population at Risk" value="20.5M" unit="citizens exposed" accent="#f43f5e" />
              <KpiStat label="River Gauges" value="115" unit="FFWC telemetry" accent="#818cf8" />
              <KpiStat label="Neural Model" value="6.3M" unit="params U-Net" accent="#34d399" />
              <KpiStat label="SAR Spatial Grid" value="30m" unit="Sentinel-1 radar" accent="#fbbf24" />
            </div>
          </div>
        </div>

        {/* Scroll Cue Indicator */}
        <div className="mt-10 flex flex-col items-center gap-2 text-white/70 animate-bounce">
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/80">Scroll to Explore 3D Platform</span>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 2: Centerpiece — Three.js Scroll-Triggered 3D Platform
          (Inspired by hut8.com/our-platform)
      -------------------------------------------------------------- */}
      <section
        id="platform-3d"
        ref={scrollSectionRef}
        className="relative h-[600vh] w-full border-t border-white/10 bg-ink-0"
      >
        {/* Sticky 3D Viewport pinned for the entire 600vh scroll duration */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Three.js Interactive WebGL Scene */}
          <ThreePlatformScene
            activeStage={activeStage}
            scrollProgress={scrollProgress}
            onStageSelect={handleStageSelect}
            className="absolute inset-0 z-0"
          />

          {/* Vignette gradients to seat the typography */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(3,7,18,0.75)_100%)] z-10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-0 to-transparent z-10"
          />

          {/* Overlay Stage Info HUD Card (Desktop left, Mobile bottom) */}
          <div className="pointer-events-none absolute inset-x-4 top-20 z-20 mx-auto max-w-6xl md:top-24">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              {/* Active Stage Card */}
              <div className="glass-card pointer-events-auto max-w-lg rounded-2xl border border-white/15 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
                {/* Stage Header & Tags */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/40 bg-accent/20 font-mono text-xs font-bold text-accent">
                      {currentStage.num}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white">
                      PHASE {currentStage.num} OF 06
                    </span>
                  </div>
                  <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-white">
                    {currentStage.tag}
                  </span>
                </div>

                {/* Stage Titles */}
                <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {currentStage.titleEn}
                </h2>
                <p className="bn mt-1 text-lg font-bold text-white/90">
                  {currentStage.titleBn}
                </p>

                {/* Stage Descriptions from Work Report */}
                <p className="mt-3 text-sm leading-relaxed text-white">
                  {currentStage.descEn}
                </p>
                <p className="bn mt-2 text-xs leading-relaxed text-white/85">
                  {currentStage.descBn}
                </p>

                {/* Dynamic Telemetry Specs per Stage */}
                <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3.5">
                  {activeStage === 0 && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Wavelength:</span>
                        <div className="font-mono font-bold text-white">5.405 GHz (C-band)</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Polar Orbit:</span>
                        <div className="font-mono font-bold text-white">693 km · Orbit 114</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Polarimetry:</span>
                        <div className="font-mono font-bold text-white">VV + VH Dual-pol</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">All-Weather:</span>
                        <div className="font-mono font-bold text-accent">Cloud & Rain Immune</div>
                      </div>
                    </div>
                  )}

                  {activeStage === 1 && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Input Tensor:</span>
                        <div className="font-mono font-bold text-white">6 Channels · 512×512px</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Architecture:</span>
                        <div className="font-mono font-bold text-white">EfficientNet-B0 U-Net</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Parameters:</span>
                        <div className="font-mono font-bold text-white">6,300,000 Weights</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Training Chips:</span>
                        <div className="font-mono font-bold text-accent">5,340 Multi-Year Chips</div>
                      </div>
                    </div>
                  )}

                  {activeStage === 2 && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Decision Threshold:</span>
                        <div className="font-mono font-bold text-white">τ = 0.50 (Sigmoid)</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Polygons Served:</span>
                        <div className="font-mono font-bold text-white">1,199 Discrete Vectors</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Total Inundation:</span>
                        <div className="font-mono font-bold text-white">21,954 km² National</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Storage / CDN:</span>
                        <div className="font-mono font-bold text-accent">5MB PMTiles (GCS CDN)</div>
                      </div>
                    </div>
                  )}

                  {activeStage === 3 && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Population Baseline:</span>
                        <div className="font-mono font-bold text-white">WorldPop 2024 100m</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Total Exposed:</span>
                        <div className="font-mono font-bold text-danger">20,491,387 Citizens</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Administrative:</span>
                        <div className="font-mono font-bold text-white">64 Districts · 8 Divs</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Feni Holdout:</span>
                        <div className="font-mono font-bold text-accent">IoU 0.5338 (Tripwire)</div>
                      </div>
                    </div>
                  )}

                  {activeStage === 4 && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Network Size:</span>
                        <div className="font-mono font-bold text-white">115 FFWC River Gauges</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Hydro Forecast:</span>
                        <div className="font-mono font-bold text-white">GloFAS 10-day River</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Peak Stations:</span>
                        <div className="font-mono font-bold text-warn">Above Danger Monitored</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Sensor Fusion:</span>
                        <div className="font-mono font-bold text-accent">Ground Truth Verified</div>
                      </div>
                    </div>
                  )}

                  {activeStage === 5 && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Protocol Standard:</span>
                        <div className="font-mono font-bold text-white">OASIS CAP 1.2 XML</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Corroboration:</span>
                        <div className="font-mono font-bold text-accent">G3 Multi-Sensor Gate</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Languages:</span>
                        <div className="font-mono font-bold text-white">Bilingual (বাংলা + EN)</div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-white/70">Safety Protocol:</span>
                        <div className="font-mono font-bold text-warn">review_required Locked</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Operations Link */}
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <Link
                    href="/operations"
                    className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-accent hover:underline"
                  >
                    <span>View Live Telemetry in Console</span>
                    <ArrowRight size={13} />
                  </Link>
                  <span className="font-mono text-[10px] text-white/70">
                    Scroll down for Next Phase
                  </span>
                </div>
              </div>

              {/* Floating iOS Stage Quick Navigation Dock */}
              <div className="glass pointer-events-auto hidden rounded-2xl border border-white/15 p-2 shadow-2xl backdrop-blur-2xl md:flex md:flex-col md:gap-1.5">
                <span className="px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-white/60">
                  Stages
                </span>
                {STAGE_CONFIGS.map((stg, i) => (
                  <button
                    key={stg.id}
                    onClick={() => handleStageSelect(i)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                      activeStage === i
                        ? 'border border-accent/40 bg-accent/20 text-white shadow-lg'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md font-mono text-[10px] font-bold ${
                        activeStage === i ? 'bg-accent text-ink-0' : 'bg-white/10 text-white'
                      }`}
                    >
                      {stg.num}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold leading-tight text-white">{stg.titleEn}</span>
                      <span className="bn text-[10px] text-white/80">{stg.titleBn}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Scrubber Bar at Viewport Bottom */}
          <div className="pointer-events-none absolute bottom-0 inset-x-0 z-30 h-1 bg-white/10">
            <div
              className="h-full bg-accent shadow-[0_0_12px_#38bdf8] transition-all duration-150"
              style={{width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%`}}
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 3: 6-Channel Neural Decomposition Matrix (Deep Dive)
      -------------------------------------------------------------- */}
      <section id="channels" className="relative border-t border-white/10 bg-ink-1 px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-accent">
                Feature Engineering · Part 2.1
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {t('landing.channelsTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
                {t('landing.channelsSub')}
              </p>
            </div>
            <div className="glass rounded-xl border border-white/10 px-4 py-2">
              <span className="font-mono text-xs text-white">Input: 6 Channels @ 30m Grid</span>
            </div>
          </div>

          {/* Interactive Channel Selector Grid */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHANNELS_DATA.map((ch, idx) => (
              <div
                key={ch.id}
                onClick={() => setSelectedChannel(idx)}
                className={`glass-card cursor-pointer rounded-2xl border p-6 transition-all ${
                  selectedChannel === idx
                    ? 'border-accent bg-accent/10 shadow-[0_0_25px_rgba(56,189,248,0.2)]'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold"
                    style={{backgroundColor: `${ch.color}25`, color: ch.color, border: `1px solid ${ch.color}50`}}
                  >
                    0{ch.ch}
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-white/80">
                    {ch.band}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-white">{ch.name}</h3>
                <div className="mt-1 font-mono text-xs font-medium text-white/85">{ch.type}</div>

                <p className="mt-3 text-xs leading-relaxed text-white">
                  {ch.rationale}
                </p>

                <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between font-mono text-[10px] text-white/80">
                  <span>{ch.role}</span>
                  <span className="font-semibold text-accent">{ch.stats}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Note on Strong-label Weighting */}
          <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 p-6 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
                <Cpu size={22} />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Strong-Label ×2 Anchor Weighting (d3v4.2 Breakthrough)
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-white/95">
                  The compiled training set comprises 5,340 chips (22GB) from Sylhet 2020, Jamalpur 2020, and Sylhet Haor 2022 (weak labels), plus 107 chips from the catastrophic 2024 Feni event with verified UNOSAT human-validated strong labels. Weighting Feni chips ×2 during training anchored the loss gradients, unlocking a +0.064 jump on the unseen 20-chip Feni holdout (rows 63–64).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 4: Model Benchmark Ledger & Validation Gates
      -------------------------------------------------------------- */}
      <section id="ledger" className="relative border-t border-white/10 bg-ink-0 px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-accent">
                Validation & Gate Decisions · Part 2.3 & 2.4
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {t('landing.ledgerTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
                {t('landing.ledgerSub')}
              </p>
            </div>
            <button
              onClick={() => setExpandedGateDetails(!expandedGateDetails)}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-mono text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              <ShieldCheck size={14} className="text-accent" />
              <span>{expandedGateDetails ? 'Hide Gate Details' : 'View 3-Part Promotion Gate'}</span>
            </button>
          </div>

          {/* 3-Part Promotion Gate Drawer */}
          {expandedGateDetails && (
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="glass rounded-2xl border border-white/15 p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/20 font-mono text-xs font-bold text-accent">1</span>
                  <h4 className="text-sm font-bold text-white">Feni Tripwire Holdout</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white">
                  Must achieve holdout IoU ≥ 0.5338 − 0.030 tolerance on 20 spatially-contiguous chips (rows 63–64) never exposed during training.
                </p>
                <div className="mt-3 font-mono text-[10px] text-accent font-semibold">Requirement: IoU ≥ 0.5038</div>
              </div>

              <div className="glass rounded-2xl border border-white/15 p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/20 font-mono text-xs font-bold text-accent">2</span>
                  <h4 className="text-sm font-bold text-white">Negative-Control FPR Gate</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white">
                  chars/river_edge FPR must equal 0.000; dry_inland and mixed false positives must not worsen; overall negative-control FPR ≤ 0.335.
                </p>
                <div className="mt-3 font-mono text-[10px] text-warn font-semibold">Failed by d3v5true (0.611) & d3v6 (0.591)</div>
              </div>

              <div className="glass rounded-2xl border border-white/15 p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/20 font-mono text-xs font-bold text-accent">3</span>
                  <h4 className="text-sm font-bold text-white">Buffer Ablation</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white">
                  Interior-16 crop gain must survive tiling edge effects to ensure seamless spatial continuity across adjacent 512×512 tiles.
                </p>
                <div className="mt-3 font-mono text-[10px] text-ok font-semibold">Survives in d3v4.2 ops model</div>
              </div>
            </div>
          )}

          {/* Model Progression Ledger Table */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-ink-1/60 shadow-2xl backdrop-blur-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white">
                <thead className="border-b border-white/10 bg-white/5 font-mono text-[10px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="py-4 px-6">Model Version</th>
                    <th className="py-4 px-6">Key Engineering Change</th>
                    <th className="py-4 px-6 text-right">Feni Holdout</th>
                    <th className="py-4 px-6 text-right">Val IoU</th>
                    <th className="py-4 px-6 text-right">Neg-Ctrl FPR</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MODEL_LEDGER_DATA.map((row) => (
                    <tr
                      key={row.version}
                      className={`transition-colors hover:bg-white/5 ${
                        row.version === 'd3v4.2' ? 'bg-accent/10' : ''
                      }`}
                    >
                      <td className="py-4 px-6 font-mono font-bold text-white">
                        <div className="flex items-center gap-2">
                          {row.version === 'd3v4.2' && (
                            <span className="pulse-dot h-2 w-2 rounded-full bg-accent" />
                          )}
                          <span>{row.version}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white">
                        <div>{row.keyChange}</div>
                        <div className="mt-0.5 text-[10px] text-white/70">{row.notes}</div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-white">
                        {row.feniTripwire}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-white">
                        {row.valIoU}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-white">
                        {row.negCtrlFPR}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block rounded-full border px-3 py-1 font-mono text-[10px] font-bold tracking-wider ${
                            row.version === 'd3v4.2'
                              ? 'border-accent bg-accent/20 text-accent shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                              : row.status === 'Gate FAIL'
                              ? 'border-danger/50 bg-danger/10 text-danger'
                              : 'border-white/20 bg-white/5 text-white/80'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scientific Finding: Why v5true and v6 Failed */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h4 className="text-base font-bold text-white">
              Scientific Finding: Why Reference Swaps Failed (Falsification of Hypothesis)
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-white">
              Both <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-white">d3v5true</code> (Nov–Mar median) and <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-white">d3v6</code> (Feb 10th-percentile) were trained to test whether a cleaner dry-season reference image could reduce false positive rates on river edges and sand chars. In both cases, the gate failed catastrophically (FPR jumped from 0.335 to 0.611 and 0.591). Root cause analysis proved that the Feb 10th-percentile reference is −14.5 dB vs the −8.4 dB baseline: a darker reference amplifies the apparent &quot;change&quot; delta everywhere, causing false alarms on chars and urban areas. The definitive lesson is that training data composition (adding negative-control dry chips with flood=0) is the correct path forward, not further reference swapping.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 5: National Inundation Exposure by Division
      -------------------------------------------------------------- */}
      <section id="exposure" className="relative border-t border-white/10 bg-ink-1 px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-accent">
                Spatial Impact · Part 2.7
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {t('landing.exposureTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
                {t('landing.exposureSub')}
              </p>
            </div>
            <div className="glass flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2">
              <span className="pulse-dot h-2 w-2 rounded-full bg-danger" />
              <span className="font-mono text-xs font-bold text-white">
                20,491,387 Citizens Exposed
              </span>
            </div>
          </div>

          {/* Division Exposure Cards */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {DIVISIONS_DATA.map((d) => (
              <div
                key={d.division}
                className="glass rounded-xl border border-white/10 p-3 text-center transition-all hover:border-white/30"
              >
                <div className="font-mono text-lg font-bold text-white">{d.polygons}</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-white/70">polygons</div>
                <div className="mt-2 text-xs font-bold text-white">{d.division}</div>
                <div className="font-mono text-[10px] text-accent">{d.areaKm2}</div>
              </div>
            ))}
          </div>

          {/* Top 12 Largest Flood Inundation Polygons Table */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-ink-0/60 shadow-2xl backdrop-blur-2xl">
            <div className="border-b border-white/10 bg-white/5 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Top 12 Monitored Inundation Polygons</h3>
                <p className="mt-0.5 text-xs text-white/80">Extracted from Sentinel-1 SAR pass (d3v4.2 ops model)</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                Updated: 2026-09-18
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white">
                <thead className="border-b border-white/10 font-mono text-[10px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="py-3 px-6">Polygon ID</th>
                    <th className="py-3 px-6">District</th>
                    <th className="py-3 px-6 text-right">Inundated Area</th>
                    <th className="py-3 px-6 text-right">Affected People</th>
                    <th className="py-3 px-6 text-center">Confidence Class</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {TOP_POLYGONS.map((poly) => (
                    <tr key={poly.id} className="transition-colors hover:bg-white/5">
                      <td className="py-3 px-6 font-mono font-bold text-white">#{poly.id}</td>
                      <td className="py-3 px-6 font-bold text-white">{poly.district}</td>
                      <td className="py-3 px-6 text-right font-mono font-bold text-white">
                        {poly.area.toFixed(1)} km²
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-bold text-danger">
                        {poly.people.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] text-white">
                          {poly.conf}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <Link
                          href={`/operations?selected_polygon=${poly.id}`}
                          className="font-mono text-[10px] font-bold text-accent hover:underline"
                        >
                          Inspect →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 6: Automated CAP 1.2 Dispatch & G3 Gate
      -------------------------------------------------------------- */}
      <section id="cap-dispatch" className="relative border-t border-white/10 bg-ink-0 px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-accent">
                Early-Warning Protocol · Part 2.8
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {t('landing.capTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
                {t('landing.capSub')}
              </p>
            </div>
            <Link
              href="/approval"
              className="flex items-center gap-2 rounded-xl border border-accent/50 bg-accent/15 px-4 py-2 font-mono text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-ink-0"
            >
              <FileText size={14} />
              <span>Open CAP Approval Surface</span>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* CAP XML Generator Engine Details */}
            <div className="glass rounded-2xl border border-white/15 p-6 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-accent" />
                  <h3 className="text-base font-bold text-white">CAP 1.2 OASIS Standard Engine</h3>
                </div>
                <span className="rounded-full border border-ok/40 bg-ok/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-ok">
                  9/9 Tests Passing
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs leading-relaxed text-white">
                <p>
                  Built with <code className="rounded bg-white/10 px-1 py-0.5 font-mono">xsdata</code> and validated against the official OASIS CAP 1.2 XML schema. Every advisory goes through a strict 5-stage pipeline before emission:
                </p>

                <ol className="list-decimal space-y-2 pl-4 text-white/95">
                  <li>
                    <strong>Schema Validation:</strong> Full XML syntax check against CAP v1.2 specification.
                  </li>
                  <li>
                    <strong>Exposure Gate:</strong> WorldPop population threshold query (&gt; 5,000 citizens).
                  </li>
                  <li>
                    <strong>G3 Multi-Sensor Corroboration:</strong> Cross-checks Sentinel-1 SAR with NASA IMERG rainfall, Copernicus GFM, and FFWC river gauges.
                  </li>
                  <li>
                    <strong>Confidence Classification:</strong> Freezes broken numeric bands; classifies into <code className="text-warn">review_required</code> or <code className="text-accent">observed_high</code>.
                  </li>
                  <li>
                    <strong>Bilingual Template Fork:</strong> Produces synchronized Bangla and English alert strings with verified evacuation route status.
                  </li>
                </ol>
              </div>

              {/* Sample CAP Payload Snippet */}
              <div className="mt-5 rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-[11px] text-white/90">
                <div className="text-white/60">&lt;!-- feni_draft.cap.xml (OASIS CAP 1.2) --&gt;</div>
                <div className="text-accent">&lt;alert xmlns=&quot;urn:oasis:names:tc:emergency:cap:1.2&quot;&gt;</div>
                <div className="pl-4 text-white">&lt;identifier&gt;KALOPATHOR-2024-FENI-001&lt;/identifier&gt;</div>
                <div className="pl-4 text-warn">&lt;status&gt;Actual&lt;/status&gt;</div>
                <div className="pl-4 text-accent2">&lt;msgType&gt;Alert&lt;/msgType&gt;</div>
                <div className="pl-4 text-white">&lt;scope&gt;Public&lt;/scope&gt;</div>
                <div className="pl-4 text-white">&lt;info&gt;</div>
                <div className="pl-8 text-white">&lt;language&gt;bn-BD&lt;/language&gt;</div>
                <div className="pl-8 text-accent">&lt;headline&gt;ফেনী মুহুরী নদী অববাহিকা প্লাবন সতর্কতা&lt;/headline&gt;</div>
                <div className="pl-8 text-white">&lt;severity&gt;Severe&lt;/severity&gt;</div>
                <div className="pl-8 text-danger">&lt;certainty&gt;Observed&lt;/certainty&gt;</div>
                <div className="pl-4 text-white">&lt;/info&gt;</div>
                <div className="text-accent">&lt;/alert&gt;</div>
              </div>
            </div>

            {/* FLOMPY Corroboration & Safety Gate */}
            <div className="glass rounded-2xl border border-white/15 p-6 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-warn" />
                  <h3 className="text-base font-bold text-white">FLOMPY Corroboration & Safety Gate</h3>
                </div>
                <span className="rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-warn">
                  Safety Gate Working
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs leading-relaxed text-white">
                <p>
                  To prevent autonomous hallucination, the system tested cross-corroboration between Kalopathor U-Net and FLOMPY (an independent SAR flood algorithm) on the August 2024 Feni flood peak:
                </p>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Orbit 114 (Peak Day, Aug 21):</span>
                    <span className="font-mono font-bold text-danger">IoU = 0.086</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Spatial Extent Disagreement:</span>
                    <span className="font-mono font-bold text-danger">86% Discrepancy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Corroboration Result:</span>
                    <span className="font-mono font-bold text-warn">NO_CORROBORATION</span>
                  </div>
                </div>

                <p className="mt-3">
                  This confirmed that independent SAR algorithms disagree sharply on edge boundaries. Rather than emitting an unverified automated evacuation order, the system honestly kept the advisory in <code className="rounded bg-warn/20 px-1 py-0.5 font-mono font-bold text-warn">review_required</code>.
                </p>

                <p className="border-t border-white/10 pt-3 text-[11px] text-white/80">
                  This is the system working exactly as designed: safety through human-in-the-loop triage when multi-sensor agreement fails.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 7: The Honesty Doctrine & 0/10 Conformal Band Vacuity
      -------------------------------------------------------------- */}
      <section id="honesty" className="relative border-t border-white/10 bg-ink-1 px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-accent">
                Scientific Integrity · Part 2.5
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {t('landing.honestyTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
                {t('landing.honestySub')}
              </p>
            </div>
            <div className="glass rounded-xl border border-white/10 px-4 py-2">
              <span className="font-mono text-xs font-bold text-white">Full Transparency</span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="glass rounded-2xl border border-white/15 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-warn shadow-[0_0_8px_#fbbf24]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-warn">
                  SEEDED / DEMO DATA
                </h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white">
                Replay data is clearly flagged amber everywhere it appears — never a silent green. When data is seeded from the August 2024 national event, the UI explicitly identifies the acquisition date and prohibits false live claims.
              </p>
            </div>

            <div className="glass rounded-2xl border border-white/15 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_8px_#38bdf8]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent">
                  0/10 VACUITY DISCLOSURE
                </h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white">
                A mathematical audit confirmed that one-sided lower conformal bounds on binary flood targets are vacuous (<code className="font-mono text-[10px]">coverage ≡ flood_rate</code>) due to 93.4% row clipping. We publicly declared 0/10 publishable bands rather than misrepresenting model confidence.
              </p>
            </div>

            <div className="glass rounded-2xl border border-white/15 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent2 shadow-[0_0_8px_#818cf8]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent2">
                  CONSEMA MARGIN RESEARCH
                </h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white">
                Instead of invalid pixel probabilities, the system is developing CONSEMA morphological margin boundary calibration (DEEL/MICCAI 2025) to provide rigorous spatial erode/dilate uncertainty bands around inundation perimeters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 8: Operations Call to Action
      -------------------------------------------------------------- */}
      <section className="relative border-t border-white/10 bg-ink-0 px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="glass inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-4 py-1.5 font-mono text-[10.5px] font-bold uppercase tracking-widest text-white shadow-lg">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
            OPERATIONAL GRADE
          </span>

          <h2 className="bn mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
            লাইভ অপারেশনাল কনসোল পরিদর্শন করুন
          </h2>
          <p className="mt-2 text-base font-semibold text-white/95">
            Launch the Full-Bleed MapLibre Operations Console
          </p>

          <p className="mt-4 text-xs leading-relaxed text-white/80">
            Interactive MapLibre satellite basemap, FFWC 115 hydrographs, 1,199 PMTiles flood polygons, NASA IMERG precipitation, and real-time CAP advisory previews.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/operations"
              className="flex h-12 items-center gap-2.5 rounded-xl border border-accent bg-accent px-8 font-sans text-sm font-bold text-ink-0 shadow-[0_0_35px_rgba(56,189,248,0.45)] transition-all hover:scale-105 hover:bg-white"
            >
              <span>{t('landing.ctaConsole')}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 9: iOS Frosted Glass Footer (White Fonts Always)
      -------------------------------------------------------------- */}
      <footer className="border-t border-white/10 bg-ink-1 px-4 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <div className="flex items-center gap-2.5">
              <span className="bn text-lg font-black text-white">কালপাথর</span>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-white/90">
                Kalopathor
              </span>
            </div>
            <p className="text-[11px] text-white/80">
              National Synthetic Aperture Radar Early-Warning System for Bangladesh
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] text-white">
            <Link href="/operations" className="hover:text-accent hover:underline">
              Operations Console
            </Link>
            <Link href="/approval" className="hover:text-accent hover:underline">
              CAP Advisory Flow
            </Link>
            <Link href="/operations?view=data_quality" className="hover:text-accent hover:underline">
              Data Quality
            </Link>
            <a
              href="https://github.com/realsamiul/Kalopathor-public"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-white hover:text-accent hover:underline"
            >
              <span>GitHub</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="font-mono text-[10px] text-white/70">
            NASA GIBS · Copernicus GFM · FFWC · HRSL · WorldPop 2024
          </div>
        </div>
      </footer>
    </main>
  );
}

function KpiStat({
  label,
  value,
  unit,
  accent
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <div className="p-4 text-center sm:p-5">
      <div
        className="font-mono text-2xl font-black tracking-tight sm:text-3xl"
        style={{color: accent, textShadow: `0 0 20px ${accent}40`}}
      >
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
        {label}
      </div>
      <div className="mt-0.5 text-[10px] text-white/75">{unit}</div>
    </div>
  );
}
