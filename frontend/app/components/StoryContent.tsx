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
  GitBranch,
  Layers,
  Cpu,
  Database,
  AlertTriangle,
  Server,
  CheckCircle2,
  Droplets,
  ExternalLink
} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import HeroMap from './HeroMap';

const STAGES = [
  {icon: Radio, title: 'stage1Title', desc: 'stage1Desc', sub: 'Sentinel-1 IW GRD · Dual-Pol (VV/VH) · 30m'},
  {icon: Eye, title: 'stage2Title', desc: 'stage2Desc', sub: 'd3v4.2 U-Net · 6ch · 6.3M params · τ=0.5'},
  {icon: Waypoints, title: 'stage3Title', desc: 'stage3Desc', sub: 'LightGBM F5 + GloFAS + Open-Meteo'},
  {icon: Users, title: 'stage4Title', desc: 'stage4Desc', sub: 'Meta / CIESIN HRSL 30m Settlement Overlay'},
  {icon: RouteIcon, title: 'stage5Title', desc: 'stage5Desc', sub: 'EVE Dijkstra Network · Road Breaches & Shelters'},
  {icon: Bell, title: 'stage6Title', desc: 'stage6Desc', sub: 'OASIS CAP 1.2 Bilingual XML/JSON Protocol'}
];

const LAYERS = [
  {
    id: '01',
    category: 'optical',
    categoryName: 'Satellite Optical',
    title: 'NASA VIIRS TrueColor (375m)',
    nativeTerm: 'NASA GIBS VIIRS SNPP Corrected Reflectance (EPSG:3857)',
    sensor: 'Suomi NPP / VIIRS (Visible Spectrum)',
    resolution: '375m · Daily Refresh (~13:30 LT)',
    physicalBasis: 'Natural visual-spectrum composite capturing natural surface coloration, cloud dynamics, and river sedimentation plumes in the Bay of Bengal.',
    quote: 'The sky as the eye would see it from 824 kilometers above. Daily sun-synchronous passes frame the macro geography of the Ganges-Brahmaputra-Meghna delta.',
    specs: 'Native EPSG:3857 WebMercator Level 9 tile matrix (256×256px), dynamic date query.'
  },
  {
    id: '02',
    category: 'radar',
    categoryName: 'Radar & Flood',
    title: 'Detected Flooding (Sentinel-1 SAR)',
    nativeTerm: 'Sentinel-1 C-Band SAR (IW Mode, VV + VH, 30m)',
    sensor: 'Sentinel-1A/1B C-Band Synthetic Aperture Radar',
    resolution: '30m · 6–12 Day Orbit Revisit',
    physicalBasis: 'Active microwave pulses penetrate monsoonal cloud decks. Smooth standing water acts as a specular reflector, bouncing radar energy away from the antenna (dark signature).',
    quote: 'When torrential rain obscures the delta for weeks, radar sees in the dark, mapping flooded paddies and submerged homesteads at 30-meter precision.',
    specs: 'd3v4.2 U-Net (EfficientNet-B0, 6ch, τ=0.5). 1,199 polygons across 21,954 km² (Feni benchmark IoU 0.5338).'
  },
  {
    id: '03',
    category: 'radar',
    categoryName: 'Radar & Flood',
    title: 'Copernicus GFM Live Flood',
    nativeTerm: 'Copernicus Emergency Management Service GFM WMS-T',
    sensor: 'Sentinel-1 Multi-Algorithm Ensemble',
    resolution: '20m · Near Real-Time Overpass',
    physicalBasis: 'Harmonized ensemble of three independent SAR flood algorithms (TU Wien, DLR, LIST) executing on all global Sentinel-1 downlinks.',
    quote: 'An independent European orbital witness providing multi-model cross-validation against national detection inferences.',
    specs: 'OGC WMS-T streaming layer with ISO 8601 temporal querying.'
  },
  {
    id: '04',
    category: 'optical',
    categoryName: 'Satellite Optical',
    title: 'NASA MCDWD 2-Day Flood Composite',
    nativeTerm: 'NASA LANCE Near Real-Time MCDWD (MODIS Composite)',
    sensor: 'Terra + Aqua MODIS (NDWI / MNDWI Indices)',
    resolution: '250m · 2-Day Rolling Window',
    physicalBasis: 'Multi-spectral water indices across optical and thermal infrared bands identifying surface water anomalies during cloud breaks.',
    quote: 'A rapid macro-catchment sensor. Grey denotes dry ground; bright red indicates flood water; cyan denotes sensor shadow.',
    specs: 'NASA GIBS TileMatrixSet with daily compositing.'
  },
  {
    id: '05',
    category: 'hydrology',
    categoryName: 'Hydrology & Terrain',
    title: 'River Erosion & Bankline Migration',
    nativeTerm: 'Centroid Transect Vector Migration (2016–2021)',
    sensor: 'Multi-Temporal Landsat & Sentinel-2 Archives',
    resolution: 'Vector Transects · Meters/Year Migration',
    physicalBasis: 'Morphological contour tracking across dynamic braided river systems (Jamuna, Padma, Lower Meghna) measuring structural bank collapse.',
    quote: 'Bangladesh is living land that breathes and carves. The Jamuna and Padma shift entire kilometers in a single flood season.',
    specs: 'Shoreline vector polygons, erosion hazard zones, and longitudinal rate transects.'
  },
  {
    id: '06',
    category: 'hydrology',
    categoryName: 'Hydrology & Terrain',
    title: 'Water Level Telemetry Gauges',
    nativeTerm: 'Flood Forecasting and Warning Centre (FFWC) Network',
    sensor: '115 Automated & Observer River Gauges',
    resolution: 'Point Telemetry · 3-Hour Update Cycle',
    physicalBasis: 'Physical water level gauges measuring river stage height relative to Public Works Datum (PWD) and historical Danger Levels.',
    quote: 'The ground-truth pulse of the rivers anchoring satellite inferences with observed stage hydrographs.',
    specs: 'Interactive hydrographs displaying observed stage, 24h tendency, and danger threshold margins.'
  },
  {
    id: '07',
    category: 'exposure',
    categoryName: 'Terrestrial & Exposure',
    title: 'Population Exposure (HRSL 30m)',
    nativeTerm: 'Meta / Columbia CIESIN High Resolution Settlement Layer',
    sensor: 'Building Footprint CV + National Census Microdata',
    resolution: '30m Spatial Grid · National Extent',
    physicalBasis: 'Spatial intersection of SAR inundation polygons with high-resolution population density rasters aggregated to Union Parishad administrative units.',
    quote: 'Flood polygons are geographical data; people are the human reality. Computes affected population down to individual unions.',
    specs: '20.5M total national exposure estimate (Feni basin: 184,615 directly exposed).'
  },
  {
    id: '08',
    category: 'exposure',
    categoryName: 'Terrestrial & Exposure',
    title: 'Forecast Risk Horizon (T+1 to T+7)',
    nativeTerm: 'LightGBM F5 Two-Branch Spatio-Temporal Model',
    sensor: 'GloFAS Runoff + Open-Meteo + Antecedent S1 Saturation',
    resolution: 'T+1, T+3, T+5, T+7 Lead Days',
    physicalBasis: 'Hydrological wave propagation estimating downstream inundation expansion from upstream Meghalaya/Assam hill runoff.',
    quote: 'Water that has fallen in the transboundary hills today arrives in the haor basin in 48 hours. Forecasts the wave before it crests.',
    specs: 'Probability rasters stamped with explicit honest uncertainty bounds.'
  },
  {
    id: '09',
    category: 'exposure',
    categoryName: 'Terrestrial & Exposure',
    title: 'Evacuation Routing & Shelters (EVE)',
    nativeTerm: 'EVE (Evacuation Vector Engine) Depth-Cost Dijkstra Graph',
    sensor: 'OpenStreetMap Road Topology + LGED Shelter Inventory',
    resolution: 'Segment-Level Road Passability',
    physicalBasis: 'Depth-cost graph traversal routing stranded communities along elevated dry ridges to designated concrete flood and cyclone shelters.',
    quote: 'Knowing where the water is is only half the battle; knowing where to run is life-saving.',
    specs: 'Honest fallback: If roads are severed, triggers shelter-in-place boat rescue guidance.'
  },
  {
    id: '10',
    category: 'exposure',
    categoryName: 'Terrestrial & Exposure',
    title: 'CAP 1.2 Bilingual Alerting',
    nativeTerm: 'OASIS Common Alerting Protocol v1.2 (Bilingual EN/BN)',
    sensor: 'Automated 4-Gate Alert Verification Engine',
    resolution: 'Digital Warning Payload (SMS/Broadcast/Web)',
    physicalBasis: 'Structured digital emergency payload requiring 4 verification gates (schema validity, exposure threshold, multi-sensor corroboration, human sign-off).',
    quote: 'Converts complex radar and demographic intelligence into unambiguous, actionable public warnings.',
    specs: 'Bilingual Bengali and English advisories with time-bounded go-before instructions.'
  }
];

const UPGRADES = [
  {
    badge: 'Upgrade A · Compute: 0 GPUh',
    title: 'CONSEMA Morphological Margin Bands',
    desc: 'Replaces the broken parametric conformal band with deterministic 2D Euclidean morphological distance transforms (scipy.ndimage.distance_transform_edt). Computes core inundation via erosion and uncertainty margins bounded by HAND gradients in <400ms on CPU.',
    icon: CheckCircle2,
    color: '#2dd4bf'
  },
  {
    badge: 'Upgrade B · Storage: Zero Dependency',
    title: 'Channel 5 Swap to SDWI (Dual-Pol Index)',
    desc: 'Eliminates the external Google Earth Engine 80GB dry-reference requirement using SDWI = ln(10 · VV · VH) - 8. Cancels seasonal soil dielectric moisture shifts and isolates specular open water without false positive spikes.',
    icon: Droplets,
    color: '#818cf8'
  },
  {
    badge: 'Upgrade C · Latency: ~280ms/tile',
    title: 'Sub-Second CPU ONNX Export',
    desc: 'Converts the 6.3M parameter PyTorch checkpoint (d3v4.2_best.pt) into an optimized ONNX runtime graph. Cuts memory footprint from 4.2GB (PyTorch+CUDA) to <350MB on standard lightweight CPU workers.',
    icon: Cpu,
    color: '#fbbf24'
  }
];

const INTEGRITY = [
  {title: 'integrity1Title', desc: 'integrity1Desc', color: '#fbbf24'},
  {title: 'integrity2Title', desc: 'integrity2Desc', color: '#2dd4bf'},
  {title: 'integrity3Title', desc: 'integrity3Desc', color: '#818cf8'}
];

export default function StoryContent() {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<'all' | 'optical' | 'radar' | 'hydrology' | 'exposure'>('all');
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

  const filteredLayers = activeCategory === 'all' 
    ? LAYERS 
    : LAYERS.filter((l) => l.category === activeCategory);

  return (
    <main className="relative min-h-dvh w-full overflow-x-clip bg-ink-0 text-mist-1">
      {/* ---------------------------------------------------------- Ambient Background Glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.06),transparent_50%),radial-gradient(circle_at_80%_40%,rgba(129,140,248,0.04),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.03),transparent_40%)]"
      />

      {/* ---------------------------------------------------------- HERO SECTION */}
      <section className="relative z-10 flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-24">
        {/* fallback texture */}
        <div
          aria-hidden
          className="drift absolute inset-0 bg-cover bg-center opacity-25"
          style={{backgroundImage: "url('/data/earth-dark.jpg')"}}
        />
        <HeroMap />

        {/* Charcoal Vignettes */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(16,18,22,0.85)_100%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-ink-0" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-t from-transparent to-ink-0" />

        <div className="relative z-10 flex max-w-4xl flex-col items-center text-center">
          {/* Status Badge */}
          <motion.div
            initial={reduced ? false : {opacity: 0, y: 14}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.15}}
            className="glass mb-8 flex flex-wrap items-center justify-center gap-2.5 rounded-full px-4 py-2"
          >
            <span className="pulse-dot h-2 w-2 rounded-full bg-accent" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-mist-2">
              LIVE MOSAIC: NASA VIIRS TRUECOLOR · SENTINEL-1 SAR PASS SEEDED (FENI REPLAY)
            </span>
          </motion.div>

          {/* Bengali Headline */}
          <motion.h1
            initial={reduced ? false : {opacity: 0, y: 24}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.7, delay: 0.25}}
            className="bn text-[68px] font-black leading-[1.1] tracking-tight text-mist-1 sm:text-[96px]"
          >
            কালপাথর
          </motion.h1>

          {/* Sub-Title */}
          <motion.p
            initial={reduced ? false : {opacity: 0, y: 18}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.4}}
            className="mt-2 font-mono text-[13px] uppercase tracking-[0.45em] text-accent"
          >
            KALOPATHOR · RADAR-SIGHT OVER WATER AND SILT
          </motion.p>

          {/* Mission Quote */}
          <motion.div
            initial={reduced ? false : {opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.55}}
            className="glass-card mt-8 max-w-2xl rounded-2xl p-6 text-center"
          >
            <p className="text-[15px] italic leading-relaxed text-mist-1/95">
              &ldquo;In the monsoon of Bangladesh, clouds blind optical cameras for months at a time.
              Kalopathor cuts through the atmosphere using microwave radar, reading the pulse of rivers,
              inundation, and silt in near-real-time.&rdquo;
            </p>
            <p className="bn mt-3 text-[14px] leading-relaxed text-mist-2">
              {t('landing.heroSubBn')}
            </p>
          </motion.div>

          {/* CTA Group */}
          <motion.div
            initial={reduced ? false : {opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.7}}
            className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row"
          >
            <Link
              href="/operations"
              className="glass group flex items-center gap-2.5 rounded-xl border-accent/40 bg-accent/15 px-7 py-3.5 text-[14.5px] font-semibold text-accent transition-all hover:bg-accent hover:text-ink-0 hover:shadow-[0_0_24px_rgba(45,212,191,0.35)]"
            >
              {t('landing.ctaConsole')}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <a
              href="#layers"
              className="glass flex items-center gap-2 rounded-xl px-6 py-3.5 text-[14px] font-medium text-mist-2 transition-all hover:border-line-strong hover:text-mist-1"
            >
              <Layers size={16} className="text-accent2" aria-hidden />
              Operational Layers
            </a>
            <a
              href="#backend"
              className="glass flex items-center gap-2 rounded-xl px-6 py-3.5 text-[14px] font-medium text-mist-2 transition-all hover:border-line-strong hover:text-mist-1"
            >
              <Server size={16} className="text-est" aria-hidden />
              Backend Architecture
            </a>
          </motion.div>

          <motion.p
            initial={reduced ? false : {opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.8, delay: 1}}
            className="mt-7 font-mono text-[10.5px] tracking-[0.2em] text-mist-3"
          >
            {t('landing.heroNote')} · τ=0.5 SIGMOID GATE · HRSL 30M
          </motion.p>
        </div>
      </section>

      {/* ---------------------------------------------------------- NATIONAL EVENT KPIS */}
      <section className="relative z-10 border-y border-line/80 bg-ink-1/60 px-5 py-12 backdrop-blur-md">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-mist-3">
              Measured Event Extent · 12 August 2024 National Monsoonal Pass
            </p>
            <span className="rounded-full border border-line bg-ink-2 px-3 py-1 font-mono text-[10px] uppercase text-accent">
              Holdout Gate: Feni IoU 0.5338
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              value={meta ? meta.polygon_count : 1199}
              format={fmt}
              label="Detected Flood Polygons"
              detail="Raw Sigmoid τ=0.5 Cutoff"
              tone="#f43f5e"
            />
            <KpiCard
              value={meta ? meta.total_area_km2 : 21954}
              format={(n) => `${fmt(n)} km²`}
              label="Total Inundation Area"
              detail="S1 Dual-Pol Synthetic Aperture"
              tone="#f59e0b"
            />
            <KpiCard
              value={meta ? Math.round(meta.total_affected / 1e5) : 205}
              format={(n) => `${(n / 10).toFixed(1)}M`}
              label="Exposed Population"
              detail="HRSL 30m Microdata Overlay"
              tone="#2dd4bf"
            />
            <KpiCard
              value={meta ? meta.gauge_count : 115}
              format={fmt}
              label="FFWC Telemetry Gauges"
              detail="Real-Time Danger Thresholds"
              tone="#818cf8"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- 6-STAGE PIPELINE */}
      <section className="relative z-10 px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
              End-to-End Decision Architecture
            </span>
            <h2 className="mt-3 text-balance text-[32px] font-bold leading-tight tracking-tight text-mist-1 sm:text-[40px]">
              From Raw Microwave Reflection to Life-Safety Action
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-mist-3">
              Six pinned stages — every step versioned, every spatial transform audited, every claim measurable.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map(({icon: Icon, title, desc, sub}, i) => (
              <div
                key={title}
                className="glass group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all hover:border-accent/40 hover:bg-ink-1/90"
              >
                <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-ink-2 text-accent">
                      <Icon size={20} aria-hidden />
                    </span>
                    <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-mist-3">
                      STAGE 0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[16.5px] font-semibold text-mist-1">{t(`landing.${title}`)}</h3>
                  <p className="mt-1 text-[13px] font-medium text-accent2">{t(`landing.${desc}`)}</p>
                </div>
                <div className="mt-4 border-t border-line/60 pt-3 font-mono text-[10.5px] text-mist-3">
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- 10-LAYER OPERATIONAL DIRECTORY */}
      <section id="layers" className="relative z-10 border-t border-line/80 bg-ink-1/40 px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
                System Catalog
              </span>
              <h2 className="mt-2 text-[32px] font-bold tracking-tight text-mist-1 sm:text-[40px]">
                Complete 10-Layer Operational Directory
              </h2>
              <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-mist-3">
                Each layer accessible in the operations console is detailed with its physical sensor basis, spatial resolution, and tactical usage.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="glass flex flex-wrap gap-1 rounded-xl p-1">
              {(
                [
                  {id: 'all', label: 'All Layers (10)'},
                  {id: 'optical', label: 'Optical'},
                  {id: 'radar', label: 'Radar & Flood'},
                  {id: 'hydrology', label: 'Hydrology'},
                  {id: 'exposure', label: 'Exposure & Routing'}
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`rounded-lg px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
                    activeCategory === tab.id
                      ? 'bg-accent text-ink-0 font-bold'
                      : 'text-mist-2 hover:text-mist-1'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Layer Cards Grid */}
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            {filteredLayers.map((layer) => (
              <div
                key={layer.id}
                className="glass-card relative flex flex-col justify-between rounded-2xl p-6 transition-all hover:border-line-strong"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-line bg-ink-2 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                      LAYER {layer.id} · {layer.categoryName}
                    </span>
                    <span className="font-mono text-[11px] text-mist-3">{layer.resolution}</span>
                  </div>

                  <h3 className="mt-4 text-[19px] font-bold text-mist-1">{layer.title}</h3>
                  <p className="font-mono text-[11px] text-accent2">{layer.nativeTerm}</p>

                  <p className="mt-3.5 text-[13.5px] italic leading-relaxed text-mist-2/95">
                    &ldquo;{layer.quote}&rdquo;
                  </p>

                  <div className="mt-4 space-y-2 text-[12.5px] leading-relaxed text-mist-3">
                    <p>
                      <strong className="text-mist-2">Physical Basis:</strong> {layer.physicalBasis}
                    </p>
                    <p>
                      <strong className="text-mist-2">Implementation:</strong> {layer.specs}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-3.5">
                  <span className="font-mono text-[10.5px] text-mist-3">Sensor: {layer.sensor}</span>
                  <Link
                    href="/operations"
                    className="flex items-center gap-1 font-mono text-[11px] font-medium text-accent hover:underline"
                  >
                    View on Map <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- BACKEND ROADMAP & INFRASTRUCTURE */}
      <section id="backend" className="relative z-10 px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-est">
              Cloud Infrastructure & Automated Gating
            </span>
            <h2 className="mt-2 text-[32px] font-bold tracking-tight text-mist-1 sm:text-[40px]">
              Backend Status, Storage & Zero-Cost Upgrades
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-mist-3">
              Full transparency on cloud credentials, gating constraints, and upcoming machine learning upgrades.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Storage & ADC Section */}
            <div className="glass rounded-2xl p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Database size={20} />
                </span>
                <div>
                  <h3 className="text-[17px] font-bold text-mist-1">GCS Authentication & Storage ($0.00/mo)</h3>
                  <p className="font-mono text-[11px] text-mist-3">project-300d4e0e-5c73-49bf-b8a</p>
                </div>
              </div>

              <p className="mt-4 text-[13.5px] leading-relaxed text-mist-2">
                Google Cloud organization policy enforces <code className="rounded bg-ink-2 px-1.5 py-0.5 font-mono text-[11.5px] text-mist-1">disableServiceAccountKeyCreation</code> to prohibit static private keys. The pipeline operates via a permanent Google Cloud ADC configuration with a valid, non-expiring OAuth refresh token.
              </p>

              <div className="mt-5 space-y-2.5 rounded-xl border border-line bg-ink-2/60 p-4 font-mono text-[11px]">
                <div className="flex justify-between text-mist-2">
                  <span>ADC Account:</span>
                  <span className="text-mist-1">monarqlabs@gmail.com</span>
                </div>
                <div className="flex justify-between text-mist-2">
                  <span>Auth Mechanism:</span>
                  <span className="text-accent">Auto-exchanging 1h short-lived tokens</span>
                </div>
                <div className="flex justify-between text-mist-2">
                  <span>CDN Output:</span>
                  <span className="text-mist-1">gs://monarqlabs-gemini-workspace/kalopathor/</span>
                </div>
                <div className="flex justify-between text-mist-2">
                  <span>Monthly Cost:</span>
                  <span className="font-bold text-accent">$0.00 / month</span>
                </div>
              </div>
            </div>

            {/* Why Live Loop was paused */}
            <div className="glass rounded-2xl p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warn/15 text-warn">
                  <AlertTriangle size={20} />
                </span>
                <div>
                  <h3 className="text-[17px] font-bold text-mist-1">Why Live Sentinel-1 Loop (B) Was Paused</h3>
                  <p className="font-mono text-[11px] text-warn">Strict Honesty Gating Standby</p>
                </div>
              </div>

              <div className="mt-4 space-y-3.5 text-[13px] leading-relaxed text-mist-2">
                <div className="rounded-lg border border-line/70 bg-ink-2/40 p-3.5">
                  <strong className="text-mist-1">1. Broken Conformal Calibration (A1 Gate):</strong>
                  <p className="mt-1 text-mist-3">
                    One-sided lower quantile regression on binary masks produced a tautological coverage (0/10 publishable deciles). Under the Honesty Doctrine, automated advisories with uncalibrated percentages are blocked.
                  </p>
                </div>
                <div className="rounded-lg border border-line/70 bg-ink-2/40 p-3.5">
                  <strong className="text-mist-1">2. Channel 5 Dry-Reference Soil Moisture Shift:</strong>
                  <p className="mt-1 text-mist-3">
                    Automated dry-season mosaics raised Negative Control False Positive Rate from 0.335 to 0.611. Live triggers were safely paused until the index upgrade.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Low/Zero-Compute Upgrades */}
          <div className="mt-8">
            <h3 className="font-mono text-[12px] uppercase tracking-[0.25em] text-accent">
              Ready-to-Deploy Upgrades (Zero GPU Compute)
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {UPGRADES.map((u) => (
                <div key={u.title} className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
                      style={{background: `${u.color}15`, color: u.color, border: `1px solid ${u.color}35`}}
                    >
                      {u.badge}
                    </span>
                    <u.icon size={18} style={{color: u.color}} />
                  </div>
                  <h4 className="mt-4 text-[16px] font-bold text-mist-1">{u.title}</h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-mist-3">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- HONESTY DOCTRINE MATRIX */}
      <section className="relative z-10 border-t border-line/80 bg-ink-1/50 px-5 py-24 sm:py-32 backdrop-blur-md">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-est">
              {t('landing.integritySub')}
            </span>
            <h2 className="mt-2 text-[32px] font-bold tracking-tight text-mist-1 sm:text-[40px]">
              {t('landing.integrityTitle')}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-mist-3">
              In life-safety systems, transparency is non-negotiable.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {INTEGRITY.map(({title, desc, color}) => (
              <div
                key={title}
                className="glass rounded-2xl p-6 transition-all"
                style={{boxShadow: `inset 0 1px 0 ${color}22`}}
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{background: color, boxShadow: `0 0 10px ${color}99`}} />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{color}}>
                    {t(`landing.${title}`)}
                  </span>
                </div>
                <p className="mt-3.5 text-[13.5px] leading-relaxed text-mist-2">{t(`landing.${desc}`)}</p>
              </div>
            ))}
          </div>

          {/* Detailed Doctrine Commitments */}
          <div className="glass mt-6 overflow-hidden rounded-2xl border border-line p-6">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-mist-3">
              Ethical Gating Matrix
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-l-2 border-est pl-3">
                <strong className="text-mist-1">No Ghost Data</strong>
                <p className="mt-1 text-mist-3">Replay data labeled SEEDED DATA in amber; never silent green.</p>
              </div>
              <div className="border-l-2 border-accent pl-3">
                <strong className="text-mist-1">No False Guarantees</strong>
                <p className="mt-1 text-mist-3">Timestamps carry &quot;estimate · pending recalibration&quot;.</p>
              </div>
              <div className="border-l-2 border-accent2 pl-3">
                <strong className="text-mist-1">Independent Auditing</strong>
                <p className="mt-1 text-mist-3">Every advisory links to raw satellite pass timestamps & model version.</p>
              </div>
              <div className="border-l-2 border-danger pl-3">
                <strong className="text-mist-1">Depth Over Breadth</strong>
                <p className="mt-1 text-mist-3">Feni pilot fully real before scaling national breadth.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- FOOTER */}
      <footer className="relative z-10 border-t border-line/80 px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="bn text-[18px] font-bold text-mist-1">কালপাথর</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
                Kalopathor
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-mist-3">
              {t('landing.credits')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/operations"
              className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent hover:underline"
            >
              <GitBranch size={13} aria-hidden />
              {t('nav.operations')}
            </Link>
            <Link
              href="/approval"
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-mist-2 hover:text-mist-1 hover:underline"
            >
              <ShieldCheck size={13} aria-hidden />
              CAP Review
            </Link>
            <a
              href="https://github.com/realsamiul/Kalopathor-public"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-mist-2 hover:text-mist-1 hover:underline"
            >
              <ExternalLink size={13} aria-hidden />
              GitHub
            </a>
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-mist-3">
              <Target size={13} aria-hidden />
              {t('ops.utc')}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function KpiCard({
  value,
  format,
  label,
  detail,
  tone
}: {
  value: number;
  format: (n: number) => string;
  label: string;
  detail: string;
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
    <div ref={ref} className="glass rounded-xl p-5">
      <div className="font-mono text-[28px] font-bold leading-none tracking-tight sm:text-[32px]" style={{color: tone}}>
        {format(shown)}
      </div>
      <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-mist-1">{label}</div>
      <div className="mt-1 font-mono text-[10px] text-mist-3">{detail}</div>
    </div>
  );
}
