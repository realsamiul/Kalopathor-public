'use client';

import React, {useState, useEffect, useRef} from 'react';
import dynamic from 'next/dynamic';
import {useTranslations} from 'next-intl';
import Link from 'next/link';
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
  CheckCircle2,
  Droplets,
  ExternalLink,
  Sparkles
} from 'lucide-react';

// Dynamic import with SSR false for Three.js 3D Globe as per skill guidelines
const InteractiveGlobe = dynamic(() => import('./InteractiveGlobe'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink-0">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-mist-3">
          Initializing 3D Orbital Matrix...
        </span>
      </div>
    </div>
  )
});

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
    <main className="relative min-h-dvh w-full overflow-x-clip bg-ink-0 text-mist-1 font-sweetsans selection:bg-accent/30 selection:text-mist-1">
      {/* ---------------------------------------------------------- Ambient Background Glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.08),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(129,140,248,0.05),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.04),transparent_45%)]"
      />

      {/* ---------------------------------------------------------- HERO: 3D INTERACTIVE SWIVEL GLOBE */}
      <section className="relative z-10 flex min-h-dvh flex-col justify-between overflow-hidden px-5 pt-8 pb-14 sm:px-8 sm:pt-10">
        {/* Top Header Row (CYBERMIND / SPACESIS style inspired by IMG_4965 & IMG_4966) */}
        <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-telegraf text-[15px] font-bold tracking-[0.25em] text-mist-1 uppercase">
              KALOPATHOR®
            </span>
            <span className="hidden h-4 w-px bg-line-strong sm:block" />
            <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.2em] text-accent sm:block">
              SATELLITE-GRADE RADAR INTELLIGENCE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-mist-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              S1 C-BAND PASS: SEEDED
            </span>
          </div>
        </div>

        {/* 3D Interactive Swivel Globe in Center (Matches IMG_4967 & IMG_4965) */}
        <div className="relative z-10 my-auto flex h-[58vh] min-h-[420px] w-full items-center justify-center sm:h-[64vh]">
          <InteractiveGlobe />
        </div>

        {/* Bottom Hero Narrative & Big Typographic Headline */}
        <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
              <Sparkles size={13} />
              <span>Monsoonal Early Warning System</span>
            </div>
            <h1 className="bn mt-2 text-[48px] font-black leading-[1.08] tracking-tight text-mist-1 sm:text-[72px]">
              কালপাথর
            </h1>
            <p className="font-editorial text-[22px] italic text-mist-2 sm:text-[28px]">
              &ldquo;In the monsoon of Bangladesh, radar cuts through the clouds.&rdquo;
            </p>
            <p className="mt-2 font-sweetsans text-[14px] leading-relaxed text-mist-3">
              Microwave radar detection at 30m resolution — sense, forecast, route, and alert before the waters rise.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/operations"
              className="glass group flex items-center justify-center gap-2 rounded-xl border-accent/50 bg-accent/15 px-7 py-4 font-telegraf text-[14px] font-bold uppercase tracking-wider text-accent transition-all hover:bg-accent hover:text-ink-0 hover:shadow-[0_0_28px_rgba(45,212,191,0.4)]"
            >
              <span>Launch Operations Console</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#layers"
              className="glass flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-mono text-[12px] uppercase tracking-wider text-mist-2 transition-all hover:text-mist-1 hover:border-line-strong"
            >
              <Layers size={14} className="text-accent2" />
              <span>Explore Layers</span>
            </a>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- LARGE STATS STRIP (IMG_4966 STYLE: 186 p/s, 25,457) */}
      <section className="relative z-10 border-y border-line/80 bg-ink-1/80 px-5 py-14 backdrop-blur-xl sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-2 border-b border-line/60 pb-5 sm:flex-row sm:items-center">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
                EVENT TELEMETRY · 12 AUGUST 2024
              </span>
              <h2 className="font-telegraf text-[20px] font-bold text-mist-1">
                National Inundation Footprint
              </h2>
            </div>
            <div className="font-mono text-[11px] text-mist-3">
              HOLD-OUT BENCHMARK: FENI TRIPWIRE IoU 0.5338 (d3v4.2)
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
            <BigStatCard
              number={meta ? meta.polygon_count : 1199}
              unit="polygons"
              label="Detected Flood Extents"
              sub="Raw Sigmoid τ=0.5 Threshold"
              tone="#f43f5e"
              format={fmt}
            />
            <BigStatCard
              number={meta ? meta.total_area_km2 : 21954}
              unit="km²"
              label="Submerged Terrain"
              sub="Sentinel-1 Dual-Pol (VV/VH)"
              tone="#f59e0b"
              format={fmt}
            />
            <BigStatCard
              number={meta ? Math.round(meta.total_affected / 1e5) : 205}
              unit="Million"
              label="Exposed Population"
              sub="HRSL 30m Settlement Overlay"
              tone="#2dd4bf"
              format={(n) => `${(n / 10).toFixed(1)}`}
            />
            <BigStatCard
              number={meta ? meta.gauge_count : 115}
              unit="stations"
              label="FFWC Telemetry Gauges"
              sub="Real-Time River Danger Levels"
              tone="#818cf8"
              format={fmt}
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- 6-STAGE PIPELINE CARDS */}
      <section className="relative z-10 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
              Operational Pipeline
            </span>
            <h2 className="font-telegraf mt-2 text-[32px] font-bold leading-tight text-mist-1 sm:text-[44px]">
              Six Pinned Verification Stages
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-mist-3">
              Every stage is deterministic, versioned, and bound by the Honesty Doctrine.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map(({icon: Icon, title, desc, sub}, i) => (
              <div
                key={title}
                className="glass group relative flex flex-col justify-between overflow-hidden rounded-2xl p-7 transition-all hover:border-accent/50 hover:bg-ink-1/90"
              >
                <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-ink-2 text-accent">
                      <Icon size={22} />
                    </span>
                    <span className="font-mono text-[11px] font-bold tracking-[0.25em] text-mist-3">
                      STAGE 0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-telegraf mt-5 text-[18px] font-bold text-mist-1">{t(`landing.${title}`)}</h3>
                  <p className="mt-1.5 font-mono text-[12px] text-accent2">{t(`landing.${desc}`)}</p>
                </div>
                <div className="mt-6 border-t border-line/60 pt-4 font-mono text-[11px] text-mist-3">
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- 10-LAYER OPERATIONAL DIRECTORY */}
      <section id="layers" className="relative z-10 border-t border-line/80 bg-ink-1/40 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
                System Catalog
              </span>
              <h2 className="font-telegraf mt-2 text-[32px] font-bold text-mist-1 sm:text-[44px]">
                Complete 10-Layer Geospatial Directory
              </h2>
              <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-mist-3">
                All physical sensors, optical basemaps, radar algorithms, and humanitarian exposure models in the console.
              </p>
            </div>

            {/* Inspo-style Tabs */}
            <div className="glass flex flex-wrap gap-1 rounded-xl p-1.5">
              {(
                [
                  {id: 'all', label: 'All Products (10)'},
                  {id: 'optical', label: 'Optical'},
                  {id: 'radar', label: 'Radar Inundation'},
                  {id: 'hydrology', label: 'Hydrology'},
                  {id: 'exposure', label: 'Exposure & Routing'}
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`rounded-lg px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
                    activeCategory === tab.id
                      ? 'bg-accent text-ink-0 font-bold'
                      : 'text-mist-3 hover:text-mist-1'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            {filteredLayers.map((layer) => (
              <div
                key={layer.id}
                className="glass-card relative flex flex-col justify-between rounded-2xl p-7 transition-all hover:border-line-strong"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-line bg-ink-2 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                      LAYER {layer.id} · {layer.categoryName}
                    </span>
                    <span className="font-mono text-[11px] text-mist-3">{layer.resolution}</span>
                  </div>

                  <h3 className="font-telegraf mt-4 text-[21px] font-bold text-mist-1">{layer.title}</h3>
                  <p className="font-mono text-[11.5px] text-accent2">{layer.nativeTerm}</p>

                  <p className="font-editorial mt-4 text-[14.5px] italic leading-relaxed text-mist-2">
                    &ldquo;{layer.quote}&rdquo;
                  </p>

                  <div className="mt-4 space-y-2 text-[13px] leading-relaxed text-mist-3">
                    <p>
                      <strong className="text-mist-2">Physical Basis:</strong> {layer.physicalBasis}
                    </p>
                    <p>
                      <strong className="text-mist-2">Technical Implementation:</strong> {layer.specs}
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-line/60 pt-4">
                  <span className="font-mono text-[11px] text-mist-3">Sensor: {layer.sensor}</span>
                  <Link
                    href="/operations"
                    className="flex items-center gap-1.5 font-mono text-[11.5px] font-semibold text-accent hover:underline"
                  >
                    View in Console <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- BACKEND ARCHITECTURE & ZERO-COST STORAGE */}
      <section id="backend" className="relative z-10 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-est">
              Cloud Infrastructure
            </span>
            <h2 className="font-telegraf mt-2 text-[32px] font-bold text-mist-1 sm:text-[44px]">
              Backend Status, Storage & Upgrades
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-mist-3">
              Zero static secrets, permanent Google Cloud ADC OAuth token refresh at $0.00/mo, and automated gating transparency.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Storage Card */}
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Database size={22} />
                </span>
                <div>
                  <h3 className="font-telegraf text-[18px] font-bold text-mist-1">Permanent ADC OAuth Storage ($0.00/mo)</h3>
                  <p className="font-mono text-[11px] text-mist-3">project-300d4e0e-5c73-49bf-b8a</p>
                </div>
              </div>

              <p className="mt-5 text-[14px] leading-relaxed text-mist-2">
                Google Cloud organization policy enforces <code className="rounded bg-ink-2 px-1.5 py-0.5 font-mono text-[12px] text-mist-1">disableServiceAccountKeyCreation</code>. The pipeline authenticates through a verified ADC token refresh loop:
              </p>

              <div className="mt-5 space-y-2.5 rounded-xl border border-line bg-ink-2/60 p-4 font-mono text-[11px]">
                <div className="flex justify-between text-mist-2">
                  <span>ADC Identity:</span>
                  <span className="text-mist-1">monarqlabs@gmail.com</span>
                </div>
                <div className="flex justify-between text-mist-2">
                  <span>Token Cycle:</span>
                  <span className="text-accent">Auto-refreshing short-lived bearer</span>
                </div>
                <div className="flex justify-between text-mist-2">
                  <span>GCS Bucket:</span>
                  <span className="text-mist-1">gs://monarqlabs-gemini-workspace/kalopathor/</span>
                </div>
                <div className="flex justify-between text-mist-2">
                  <span>Compute Cost:</span>
                  <span className="font-bold text-accent">$0.00 / month</span>
                </div>
              </div>
            </div>

            {/* Why Live Loop was Paused */}
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warn/15 text-warn">
                  <AlertTriangle size={22} />
                </span>
                <div>
                  <h3 className="font-telegraf text-[18px] font-bold text-mist-1">Why Live Sentinel-1 Loop (B) Was Paused</h3>
                  <p className="font-mono text-[11px] text-warn">Strict Honesty Gating Standby</p>
                </div>
              </div>

              <div className="mt-5 space-y-3.5 text-[13.5px] leading-relaxed text-mist-2">
                <div className="rounded-lg border border-line/70 bg-ink-2/40 p-4">
                  <strong className="text-mist-1">1. Broken Conformal Calibration (A1 Gate):</strong>
                  <p className="mt-1 text-mist-3">
                    One-sided lower quantile regression on binary masks produced a tautological coverage (0/10 publishable deciles). Under the Honesty Doctrine, automated advisories with uncalibrated percentages are blocked.
                  </p>
                </div>
                <div className="rounded-lg border border-line/70 bg-ink-2/40 p-4">
                  <strong className="text-mist-1">2. Channel 5 Dry-Reference Soil Moisture Shift:</strong>
                  <p className="mt-1 text-mist-3">
                    Automated dry-season mosaics raised Negative Control False Positive Rate from 0.335 to 0.611. Live triggers were safely paused until the index upgrade.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Low/Zero Compute Upgrades */}
          <div className="mt-10">
            <h3 className="font-mono text-[12px] uppercase tracking-[0.25em] text-accent">
              Immediate Low/Zero-Compute Upgrades
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
                  <h4 className="font-telegraf mt-4 text-[17px] font-bold text-mist-1">{u.title}</h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-mist-3">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- HONESTY DOCTRINE MATRIX */}
      <section className="relative z-10 border-t border-line/80 bg-ink-1/60 px-5 py-24 sm:px-8 sm:py-32 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-est">
              {t('landing.integritySub')}
            </span>
            <h2 className="font-telegraf mt-2 text-[32px] font-bold text-mist-1 sm:text-[44px]">
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
                className="glass rounded-2xl p-7 transition-all"
                style={{boxShadow: `inset 0 1px 0 ${color}22`}}
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{background: color, boxShadow: `0 0 12px ${color}aa`}} />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{color}}>
                    {t(`landing.${title}`)}
                  </span>
                </div>
                <p className="mt-4 text-[14px] leading-relaxed text-mist-2">{t(`landing.${desc}`)}</p>
              </div>
            ))}
          </div>

          {/* Detailed Commitments */}
          <div className="glass mt-6 overflow-hidden rounded-2xl border border-line p-7">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-mist-3">
              Ethical Gating Matrix
            </h3>
            <div className="mt-5 grid grid-cols-1 gap-5 text-[13.5px] sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-l-2 border-est pl-3.5">
                <strong className="text-mist-1">No Ghost Data</strong>
                <p className="mt-1 text-mist-3">Replay data labeled SEEDED DATA in amber; never silent green.</p>
              </div>
              <div className="border-l-2 border-accent pl-3.5">
                <strong className="text-mist-1">No False Guarantees</strong>
                <p className="mt-1 text-mist-3">Timestamps carry &quot;estimate · pending recalibration&quot;.</p>
              </div>
              <div className="border-l-2 border-accent2 pl-3.5">
                <strong className="text-mist-1">Independent Auditing</strong>
                <p className="mt-1 text-mist-3">Every advisory links to raw satellite pass timestamps & model version.</p>
              </div>
              <div className="border-l-2 border-danger pl-3.5">
                <strong className="text-mist-1">Depth Over Breadth</strong>
                <p className="mt-1 text-mist-3">Feni pilot fully real before scaling national breadth.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- FOOTER */}
      <footer className="relative z-10 border-t border-line/80 px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="bn text-[20px] font-bold text-mist-1">কালপাথর</span>
              <span className="font-telegraf text-[13px] font-bold tracking-[0.25em] text-accent uppercase">
                Kalopathor
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-mist-3">
              {t('landing.credits')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/operations"
              className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent hover:underline"
            >
              <GitBranch size={13} />
              {t('nav.operations')}
            </Link>
            <Link
              href="/approval"
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-mist-2 hover:text-mist-1 hover:underline"
            >
              <ShieldCheck size={13} />
              CAP Review
            </Link>
            <a
              href="https://github.com/realsamiul/Kalopathor-public"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-mist-2 hover:text-mist-1 hover:underline"
            >
              <ExternalLink size={13} />
              GitHub
            </a>
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-mist-3">
              <Target size={13} />
              {t('ops.utc')}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function BigStatCard({
  number,
  unit,
  label,
  sub,
  tone,
  format
}: {
  number: number;
  unit: string;
  label: string;
  sub: string;
  tone: string;
  format: (n: number) => string;
}) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (number === 0) return;
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        if (reduced) {
          setShown(number);
          return;
        }
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          setShown(Math.round(number * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      {threshold: 0.3}
    );
    io.observe(el);
    return () => io.disconnect();
  }, [number]);

  return (
    <div ref={ref} className="glass rounded-2xl p-6 transition-all hover:border-line-strong">
      <div className="flex items-baseline gap-2">
        <span
          className="font-mono text-[36px] font-black leading-none tracking-tight sm:text-[44px]"
          style={{color: tone}}
        >
          {format(shown)}
        </span>
        <span className="font-mono text-[13px] uppercase text-mist-3">{unit}</span>
      </div>
      <div className="font-telegraf mt-3 text-[14px] font-bold text-mist-1">{label}</div>
      <div className="mt-1 font-mono text-[10.5px] text-mist-3">{sub}</div>
    </div>
  );
}
