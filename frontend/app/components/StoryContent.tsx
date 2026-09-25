'use client';

import React, {useState, useEffect, useRef} from 'react';
import dynamic from 'next/dynamic';
import {useTranslations} from 'next-intl';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Columns,
  Cpu,
  Droplets,
  ExternalLink,
  Eye,
  Radio,
  Route as RouteIcon,
  Share2,
  ShieldCheck,
  Users,
  Waypoints
} from 'lucide-react';

const InteractiveGlobe = dynamic(() => import('./InteractiveGlobe'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
    </div>
  )
});

const STAGES = [
  {icon: Radio, title: 'stage1Title', desc: 'stage1Desc', sub: 'Sentinel-1 IW GRD · Dual-Pol (VV/VH) · 30m resolution'},
  {icon: Eye, title: 'stage2Title', desc: 'stage2Desc', sub: 'd3v4.2 U-Net · 6.3M parameters · τ=0.5 sigmoid threshold'},
  {icon: Waypoints, title: 'stage3Title', desc: 'stage3Desc', sub: 'LightGBM F5 Spatio-Temporal Model + GloFAS runoff integration'},
  {icon: Users, title: 'stage4Title', desc: 'stage4Desc', sub: 'Meta / Columbia CIESIN High Resolution Settlement Layer (30m)'},
  {icon: RouteIcon, title: 'stage5Title', desc: 'stage5Desc', sub: 'EVE Dijkstra Network · Road breaches & concrete shelter graph'},
  {icon: Bell, title: 'stage6Title', desc: 'stage6Desc', sub: 'OASIS CAP 1.2 Digital Emergency Payload · Bilingual EN/BN'}
];

const LAYERS = [
  {
    id: '01',
    category: 'optical',
    categoryName: 'Optical Reflectance',
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
    specs: 'd3v4.2 U-Net (EfficientNet-B0, 6ch, τ=0.5). 1,199 polygons across 21,954 km² with interactive Split-Curtain swipe against NASA VIIRS optical baseline.'
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
    categoryName: 'Optical Reflectance',
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
    specs: 'Interactive SVG hydrographs with 24h rising/falling rate, danger thresholds, and real-time pointer crosshair tracking across 115 national stations.'
  },
  {
    id: '07',
    category: 'exposure',
    categoryName: 'Exposure & Routing',
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
    categoryName: 'Exposure & Routing',
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
    categoryName: 'Exposure & Routing',
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
    categoryName: 'Exposure & Routing',
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
    badge: 'UPGRADE A · ZERO GPU COMPUTE',
    title: 'CONSEMA Morphological Margin Bands',
    desc: 'Replaces the broken parametric conformal band with deterministic 2D Euclidean morphological distance transforms (scipy.ndimage.distance_transform_edt). Computes core inundation via erosion and uncertainty margins bounded by HAND gradients in <400ms on CPU.',
    icon: CheckCircle2
  },
  {
    badge: 'UPGRADE B · ZERO DEPENDENCY',
    title: 'Channel 5 Swap to SDWI (Dual-Pol Index)',
    desc: 'Eliminates the external Google Earth Engine 80GB dry-reference requirement using SDWI = ln(10 · VV · VH) - 8. Cancels seasonal soil dielectric moisture shifts and isolates specular open water without false positive spikes.',
    icon: Droplets
  },
  {
    badge: 'UPGRADE C · ~280ms/TILE LATENCY',
    title: 'Sub-Second CPU ONNX Export',
    desc: 'Converts the 6.3M parameter PyTorch checkpoint (d3v4.2_best.pt) into an optimized ONNX runtime graph. Cuts memory footprint from 4.2GB (PyTorch+CUDA) to <350MB on standard lightweight CPU workers.',
    icon: Cpu
  }
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
    <main className="w-full bg-black font-sweetsans antialiased">

      {/* =========================================================================
          SECTION 1: HERO VIEWPORT (100VH · BRAND TOP LEFT · CENTER GLOBE · 1-LINE SUB)
          ========================================================================= */}
      <section className="relative h-screen min-h-[620px] w-full overflow-hidden bg-black text-white">
        {/* Fullscreen 3D Starry Globe */}
        <div className="absolute inset-0 z-0 h-full w-full">
          <InteractiveGlobe />
        </div>

        {/* Top Left Brand Name */}
        <div className="pointer-events-none relative z-20 flex w-full items-center justify-between px-6 pt-8 sm:px-12 sm:pt-10">
          <div className="pointer-events-auto flex items-center gap-3">
            <span className="font-telegraf text-[17px] font-bold tracking-[0.25em] text-white uppercase sm:text-[20px]">
              KALOPATHOR®
            </span>
          </div>

          <div className="pointer-events-auto flex items-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
              S1 C-BAND · 360° SWIVEL
            </span>
          </div>
        </div>

        {/* Bottom Center: EXACT ONE-LINE TAGLINE */}
        <div className="pointer-events-none relative z-20 flex h-[calc(100vh-120px)] w-full flex-col justify-end px-6 pb-10 text-center sm:px-12 sm:pb-12">
          <p className="mx-auto max-w-5xl font-sweetsans text-[13px] leading-relaxed tracking-wide text-white/70 sm:text-[15px]">
            Monsoonal Early Warning System · Microwave radar detection at 30m resolution — sense, forecast, route, and alert before the waters rise.
          </p>
        </div>
      </section>


      {/* =========================================================================
          SECTION 2: LAUNCH CONSOLE & NATIONAL FOOTPRINT (CONTINUED STARRY BLACK)
          ========================================================================= */}
      <section className="relative z-10 w-full border-t border-white/10 bg-black px-6 py-28 text-white sm:px-12 sm:py-36">
        <div className="mx-auto max-w-7xl">
          {/* Launch Console Banner Row */}
          <div className="flex flex-col items-start justify-between gap-8 border-b border-white/15 pb-16 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/50">
                LIVE MISSION OPERATIONAL CONSOLE
              </span>
              <h2 className="font-telegraf mt-3 text-[38px] font-bold tracking-tight text-white sm:text-[54px] lg:text-[64px]">
                Spaceborne Radar Command
              </h2>
              <p className="mt-3 font-sweetsans text-[15px] leading-relaxed text-white/70 sm:text-[17px]">
                Access the full-resolution spatial intelligence interface, interactive MapLibre GL radar overlays, flood risk telemetry, and automated CAP 1.2 bilingual alerting.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <Link
                href="/operations"
                className="flex items-center gap-3 bg-white px-8 py-4.5 font-telegraf text-[13.5px] font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-white/90"
              >
                <span>Launch Operations Console</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* National Footprint Numbers */}
          <div className="mt-20">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
                  EVENT TELEMETRY · 12 AUGUST 2024
                </span>
                <h3 className="font-telegraf mt-2 text-[26px] font-bold text-white sm:text-[32px]">
                  National Inundation Footprint
                </h3>
              </div>
              <div className="font-mono text-[11px] text-white/50">
                FENI TRIPWIRE IoU 0.5338 · OPS MODEL d3v4.2
              </div>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
              <BigEditorialStatDark
                number={meta ? meta.polygon_count : 1199}
                unit="polygons"
                label="Detected Flood Extents"
                sub="Raw Sigmoid τ=0.5 Threshold"
                format={fmt}
              />
              <BigEditorialStatDark
                number={meta ? meta.total_area_km2 : 21954}
                unit="km²"
                label="Submerged Terrain"
                sub="Sentinel-1 Dual-Pol (VV/VH)"
                format={fmt}
              />
              <BigEditorialStatDark
                number={meta ? Math.round(meta.total_affected / 1e5) : 205}
                unit="Million"
                label="Exposed Population"
                sub="HRSL 30m Settlement Overlay"
                format={(n) => `${(n / 10).toFixed(1)}`}
              />
              <BigEditorialStatDark
                number={meta ? meta.gauge_count : 115}
                unit="stations"
                label="FFWC River Telemetry"
                sub="Real-Time Stage & Danger Levels"
                format={fmt}
              />
            </div>
          </div>

          {/* Console Capabilities Showcase */}
          <div className="mt-28 border-t border-white/15 pt-16">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent">
                SPATIAL INTELLIGENCE & TELEMETRY
              </span>
              <h3 className="font-telegraf mt-2 text-[28px] font-bold text-white sm:text-[36px]">
                Operations Console Capabilities
              </h3>
              <p className="mt-3 max-w-3xl font-sweetsans text-[14.5px] leading-relaxed text-white/70 sm:text-[16px]">
                Engineered for disaster management operators, hydrologists, and emergency dispatchers requiring sub-kilometer precision and honest uncertainty disclosure.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
              <div className="border-t border-white/20 pt-6">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                  <Columns size={13} />
                  <span>SWIPE COMPARISON</span>
                </div>
                <h4 className="font-telegraf mt-3 text-[19px] font-bold text-white">
                  Split-Curtain Optical vs Radar Wipe
                </h4>
                <p className="mt-3 font-sweetsans text-[13.5px] leading-relaxed text-white/70">
                  Compare NASA VIIRS 375m TrueColor pre-flood optical imagery directly against Sentinel-1 30m microwave SAR flood detection. Drag the curtain divider anywhere on the canvas to distinguish turbid rivers from flash-inundated agricultural fields.
                </p>
              </div>

              <div className="border-t border-white/20 pt-6">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                  <Activity size={13} />
                  <span>RIVER TELEMETRY</span>
                </div>
                <h4 className="font-telegraf mt-3 text-[19px] font-bold text-white">
                  115 FFWC Telemetry Hydrographs
                </h4>
                <p className="mt-3 font-sweetsans text-[13.5px] leading-relaxed text-white/70">
                  Hover over any gauging station on the Jamuna, Meghna, Padma, or Surma rivers to inspect 24-hour rate of rise (<span className="text-accent font-mono">▲ Rising</span> / <span className="text-white/60 font-mono">▼ Falling</span>), peak crest records, and Danger Level margins.
                </p>
              </div>

              <div className="border-t border-white/20 pt-6">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                  <ShieldCheck size={13} />
                  <span>ACTIONABLE IMPACT</span>
                </div>
                <h4 className="font-telegraf mt-3 text-[19px] font-bold text-white">
                  Multi-Hazard Peril Scorecards
                </h4>
                <p className="mt-3 font-sweetsans text-[13.5px] leading-relaxed text-white/70">
                  Every detected flood polygon features a unified severity badge (Critical Lvl 5 to Moderate Lvl 2), exposed union demographics, severed transport infrastructure, and verified shelter routing.
                </p>
              </div>

              <div className="border-t border-white/20 pt-6">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                  <Share2 size={13} />
                  <span>COORDINATION</span>
                </div>
                <h4 className="font-telegraf mt-3 text-[19px] font-bold text-white">
                  URL Deep-Linking & Real-Time Sync
                </h4>
                <p className="mt-3 font-sweetsans text-[13.5px] leading-relaxed text-white/70">
                  Synchronize viewports, layer configurations, and active polygons directly into shareable URLs to coordinate emergency response personnel with zero ambiguity.
                </p>
              </div>
            </div>
          </div>

          {/* The Operator Playbook */}
          <div className="mt-28 border-t border-white/15 pt-16">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/50">
                  MISSION WORKFLOW
                </span>
                <h3 className="font-telegraf mt-2 text-[28px] font-bold text-white sm:text-[36px]">
                  How to Use the Operations Console
                </h3>
              </div>
              <div className="font-mono text-[11px] text-white/50">
                5-STEP RAPID SITUATIONAL ASSESSMENT
              </div>
            </div>

            <div className="mt-12 divide-y divide-white/15">
              <div className="grid grid-cols-1 items-baseline gap-4 py-8 sm:grid-cols-12 sm:gap-8">
                <div className="sm:col-span-2">
                  <span className="font-mono text-[11px] font-bold tracking-[0.3em] text-accent">
                    STEP 01
                  </span>
                </div>
                <div className="sm:col-span-4">
                  <h4 className="font-telegraf text-[20px] font-bold text-white">
                    Inspect Inundation Extents
                  </h4>
                </div>
                <div className="sm:col-span-6 font-sweetsans text-[13.5px] leading-relaxed text-white/75">
                  Pan and zoom across Bangladesh on the MapLibre GL radar map. Click any red flood polygon or choose from the top affected regions list in the rail to open the Action Card showing exposed population and model provenance.
                </div>
              </div>

              <div className="grid grid-cols-1 items-baseline gap-4 py-8 sm:grid-cols-12 sm:gap-8">
                <div className="sm:col-span-2">
                  <span className="font-mono text-[11px] font-bold tracking-[0.3em] text-accent">
                    STEP 02
                  </span>
                </div>
                <div className="sm:col-span-4">
                  <h4 className="font-telegraf text-[20px] font-bold text-white">
                    Engage Split-Curtain Swipe
                  </h4>
                </div>
                <div className="sm:col-span-6 font-sweetsans text-[13.5px] leading-relaxed text-white/75">
                  Click the <strong className="text-white font-mono text-[12px]">Swipe Split</strong> button in the top navigation bar. Drag the interactive divider bar across the map to compare the NASA VIIRS TrueColor optical ground truth on the left against the Sentinel-1 SAR microwave radar layer on the right.
                </div>
              </div>

              <div className="grid grid-cols-1 items-baseline gap-4 py-8 sm:grid-cols-12 sm:gap-8">
                <div className="sm:col-span-2">
                  <span className="font-mono text-[11px] font-bold tracking-[0.3em] text-accent">
                    STEP 03
                  </span>
                </div>
                <div className="sm:col-span-4">
                  <h4 className="font-telegraf text-[20px] font-bold text-white">
                    Interrogate River Gauges
                  </h4>
                </div>
                <div className="sm:col-span-6 font-sweetsans text-[13.5px] leading-relaxed text-white/75">
                  Select <strong className="text-white font-mono text-[12px]">Gauges</strong> in the left workflow rail. Click any of the 115 national telemetry stations (red = danger, amber = warning, teal = normal) to inspect responsive SVG hydrographs with 24-hour rate of rise and flood crest telemetry.
                </div>
              </div>

              <div className="grid grid-cols-1 items-baseline gap-4 py-8 sm:grid-cols-12 sm:gap-8">
                <div className="sm:col-span-2">
                  <span className="font-mono text-[11px] font-bold tracking-[0.3em] text-accent">
                    STEP 04
                  </span>
                </div>
                <div className="sm:col-span-4">
                  <h4 className="font-telegraf text-[20px] font-bold text-white">
                    Plan Evacuation & Shelters
                  </h4>
                </div>
                <div className="sm:col-span-6 font-sweetsans text-[13.5px] leading-relaxed text-white/75">
                  When viewing an active flood incident, the console calculates Dijkstra depth-cost evacuation routes to designated elevated concrete shelters, warning operators if primary arterial roads are severed by standing water.
                </div>
              </div>

              <div className="grid grid-cols-1 items-baseline gap-4 py-8 sm:grid-cols-12 sm:gap-8">
                <div className="sm:col-span-2">
                  <span className="font-mono text-[11px] font-bold tracking-[0.3em] text-accent">
                    STEP 05
                  </span>
                </div>
                <div className="sm:col-span-4">
                  <h4 className="font-telegraf text-[20px] font-bold text-white">
                    Review Alerts & Share View
                  </h4>
                </div>
                <div className="sm:col-span-6 font-sweetsans text-[13.5px] leading-relaxed text-white/75">
                  Review bilingual OASIS CAP 1.2 digital emergency alerts gated by multi-sensor verification. Click <strong className="text-white font-mono text-[12px]">Share</strong> in the top bar to copy a precision deep link with exact coordinates and layers for inter-agency coordination.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 3: SIX PINNED VERIFICATION STAGES (STARK WHITE)
          ========================================================================= */}
      <section className="relative z-10 w-full bg-white px-6 py-28 text-black sm:px-12 sm:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-black/50">
              Verification Engine
            </span>
            <h2 className="font-telegraf mt-2 text-[38px] font-bold tracking-tight text-black sm:text-[54px] lg:text-[64px]">
              Six Pinned Verification Stages
            </h2>
            <p className="mt-4 font-sweetsans text-[15px] leading-relaxed text-black/60 sm:text-[17px]">
              Every operational stage is deterministic, versioned, and bound by the Honesty Doctrine.
            </p>
          </div>

          <div className="mt-20 divide-y divide-black/15">
            {STAGES.map(({title, desc, sub}, i) => (
              <div
                key={title}
                className="grid grid-cols-1 items-baseline gap-4 py-10 transition-colors hover:bg-black/[0.02] sm:grid-cols-12 sm:gap-8"
              >
                <div className="sm:col-span-2">
                  <span className="font-mono text-[12px] font-bold tracking-[0.3em] text-black/40">
                    STAGE 0{i + 1}
                  </span>
                </div>

                <div className="sm:col-span-5">
                  <h3 className="font-telegraf text-[22px] font-bold text-black sm:text-[26px]">
                    {t(`landing.${title}`)}
                  </h3>
                  <p className="mt-1 font-mono text-[12px] uppercase tracking-wider text-black/50">
                    {t(`landing.${desc}`)}
                  </p>
                </div>

                <div className="sm:col-span-5">
                  <p className="font-sweetsans text-[13.5px] leading-relaxed text-black/70">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 4: COMPLETE 10-LAYER SYSTEM CATALOG (PURE BLACK)
          ========================================================================= */}
      <section id="layers" className="relative z-10 w-full bg-black px-6 py-28 text-white sm:px-12 sm:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-6 border-b border-white/15 pb-10 lg:flex-row lg:items-end">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
                System Catalog
              </span>
              <h2 className="font-telegraf mt-2 text-[38px] font-bold tracking-tight text-white sm:text-[54px] lg:text-[64px]">
                Complete 10-Layer Geospatial Directory
              </h2>
              <p className="mt-3 max-w-2xl font-sweetsans text-[15px] leading-relaxed text-white/60 sm:text-[17px]">
                All physical sensors, optical basemaps, radar algorithms, and humanitarian exposure models in the console.
              </p>
            </div>

            {/* Editorial Tab Switcher */}
            <div className="flex flex-wrap gap-5 border-b border-white/15 pb-2 font-mono text-[11px] uppercase tracking-wider">
              {(
                [
                  {id: 'all', label: 'All (10)'},
                  {id: 'optical', label: 'Optical'},
                  {id: 'radar', label: 'Radar'},
                  {id: 'hydrology', label: 'Hydrology'},
                  {id: 'exposure', label: 'Exposure'}
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`pb-1 transition-all ${
                    activeCategory === tab.id
                      ? 'border-b-2 border-white font-bold text-white'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Editorial List */}
          <div className="mt-16 divide-y divide-white/15">
            {filteredLayers.map((layer) => (
              <div key={layer.id} className="grid grid-cols-1 gap-8 py-14 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-3">
                  <div className="font-mono text-[11px] font-bold tracking-[0.25em] text-white/40">
                    LAYER {layer.id}
                  </div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-white/60">
                    {layer.categoryName}
                  </div>
                  <div className="mt-4 font-mono text-[11px] text-white/50">
                    {layer.resolution}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-white/50">
                    Sensor: {layer.sensor}
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <h3 className="font-telegraf text-[26px] font-bold text-white sm:text-[30px]">
                    {layer.title}
                  </h3>
                  <p className="mt-1 font-mono text-[12px] text-white/60">
                    {layer.nativeTerm}
                  </p>
                  <p className="font-editorial mt-5 text-[17px] italic leading-relaxed text-white/85">
                    &ldquo;{layer.quote}&rdquo;
                  </p>
                </div>

                <div className="space-y-4 lg:col-span-4 font-sweetsans text-[13.5px] leading-relaxed text-white/70">
                  <div>
                    <strong className="text-white block font-telegraf text-[12px] uppercase tracking-wider">
                      Physical Basis
                    </strong>
                    <p className="mt-1">{layer.physicalBasis}</p>
                  </div>
                  <div>
                    <strong className="text-white block font-telegraf text-[12px] uppercase tracking-wider">
                      Technical Spec
                    </strong>
                    <p className="mt-1">{layer.specs}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 5: CLOUD INFRASTRUCTURE & UPGRADES (STARK WHITE)
          ========================================================================= */}
      <section id="backend" className="relative z-10 w-full bg-white px-6 py-28 text-black sm:px-12 sm:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-black/50">
              Cloud Infrastructure
            </span>
            <h2 className="font-telegraf mt-2 text-[38px] font-bold tracking-tight text-black sm:text-[54px] lg:text-[64px]">
              Backend Status, Storage & Upgrades
            </h2>
            <p className="mt-4 font-sweetsans text-[15px] leading-relaxed text-black/60 sm:text-[17px]">
              Zero static secrets, permanent Google Cloud ADC OAuth token refresh at $0.00/mo, and automated gating transparency.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-14 border-t border-black/15 pt-12 lg:grid-cols-2">
            {/* Storage Column */}
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-black/50">
                INFRASTRUCTURE 01
              </div>
              <h3 className="font-telegraf mt-2 text-[26px] font-bold text-black">
                Permanent ADC OAuth Storage ($0.00/mo)
              </h3>
              <p className="mt-1 font-mono text-[11.5px] text-black/60">
                GCP Project: project-300d4e0e-5c73-49bf-b8a
              </p>

              <p className="mt-6 font-sweetsans text-[14.5px] leading-relaxed text-black/75">
                Google Cloud organization policy enforces <code className="bg-black/10 px-1.5 py-0.5 font-mono text-[12px] text-black">disableServiceAccountKeyCreation</code>. The pipeline authenticates through a verified ADC token refresh loop:
              </p>

              <div className="mt-8 space-y-3 border-t border-black/15 pt-6 font-mono text-[12px]">
                <div className="flex justify-between text-black/60">
                  <span>ADC Identity:</span>
                  <span className="text-black">monarqlabs@gmail.com</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>Token Cycle:</span>
                  <span className="text-black">Auto-refreshing short-lived bearer</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>GCS Bucket:</span>
                  <span className="text-black">gs://monarqlabs-gemini-workspace/kalopathor/</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>Compute Cost:</span>
                  <span className="font-bold text-black">$0.00 / month</span>
                </div>
              </div>
            </div>

            {/* Why Live Loop was Paused */}
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-black/50">
                HONESTY GATING 02
              </div>
              <h3 className="font-telegraf mt-2 text-[26px] font-bold text-black">
                Why Live Sentinel-1 Loop Was Paused
              </h3>
              <p className="mt-1 font-mono text-[11.5px] text-black/60">
                Operational Safety & Calibration Gate
              </p>

              <div className="mt-6 space-y-6 font-sweetsans text-[14.5px] leading-relaxed text-black/75">
                <div>
                  <strong className="text-black block font-telegraf text-[15px]">
                    1. Broken Conformal Calibration (A1 Gate):
                  </strong>
                  <p className="mt-1.5 text-black/60">
                    One-sided lower quantile regression on binary masks produced a tautological coverage (0/10 publishable deciles). Under the Honesty Doctrine, automated advisories with uncalibrated percentages are blocked.
                  </p>
                </div>
                <div>
                  <strong className="text-black block font-telegraf text-[15px]">
                    2. Channel 5 Dry-Reference Soil Moisture Shift:
                  </strong>
                  <p className="mt-1.5 text-black/60">
                    Automated dry-season mosaics raised Negative Control False Positive Rate from 0.335 to 0.611. Live triggers were safely paused until the index upgrade.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrades */}
          <div className="mt-24 border-t border-black/15 pt-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-black/50">
              Immediate Upgrades
            </span>
            <h3 className="font-telegraf mt-2 text-[28px] font-bold text-black sm:text-[34px]">
              Three Ready-to-Deploy Zero-Compute Upgrades
            </h3>

            <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
              {UPGRADES.map((u) => (
                <div key={u.title} className="border-t border-black/20 pt-6">
                  <div className="font-mono text-[10px] font-bold tracking-[0.25em] text-black/50 uppercase">
                    {u.badge}
                  </div>
                  <h4 className="font-telegraf mt-3 text-[19px] font-bold text-black">
                    {u.title}
                  </h4>
                  <p className="mt-3 font-sweetsans text-[13.5px] leading-relaxed text-black/70">
                    {u.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 6: THE HONESTY DOCTRINE (PURE BLACK)
          ========================================================================= */}
      <section className="relative z-10 w-full bg-black px-6 py-28 text-white sm:px-12 sm:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
              {t('landing.integritySub')}
            </span>
            <h2 className="font-telegraf mt-2 text-[38px] font-bold tracking-tight text-white sm:text-[54px] lg:text-[64px]">
              {t('landing.integrityTitle')}
            </h2>
            <p className="mt-3 font-sweetsans text-[15px] leading-relaxed text-white/60 sm:text-[17px]">
              In life-safety systems, transparency is non-negotiable.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-12 border-t border-white/15 pt-12 md:grid-cols-3">
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[0.25em] text-white uppercase">
                {t('landing.integrity1Title')}
              </div>
              <p className="mt-4 font-sweetsans text-[14.5px] leading-relaxed text-white/75">
                {t('landing.integrity1Desc')}
              </p>
            </div>
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[0.25em] text-white uppercase">
                {t('landing.integrity2Title')}
              </div>
              <p className="mt-4 font-sweetsans text-[14.5px] leading-relaxed text-white/75">
                {t('landing.integrity2Desc')}
              </p>
            </div>
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[0.25em] text-white uppercase">
                {t('landing.integrity3Title')}
              </div>
              <p className="mt-4 font-sweetsans text-[14.5px] leading-relaxed text-white/75">
                {t('landing.integrity3Desc')}
              </p>
            </div>
          </div>

          <div className="mt-20 border-t border-white/15 pt-10">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
              Operational Commitments
            </span>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <strong className="font-telegraf text-[15px] font-bold text-white block">No Ghost Data</strong>
                <p className="mt-1 font-sweetsans text-[13px] text-white/70">Replay data labeled SEEDED DATA; never disguised as live telemetry.</p>
              </div>
              <div>
                <strong className="font-telegraf text-[15px] font-bold text-white block">No False Guarantees</strong>
                <p className="mt-1 font-sweetsans text-[13px] text-white/70">Timestamps carry &quot;estimate · pending recalibration&quot;.</p>
              </div>
              <div>
                <strong className="font-telegraf text-[15px] font-bold text-white block">Independent Auditing</strong>
                <p className="mt-1 font-sweetsans text-[13px] text-white/70">Every advisory links directly to raw satellite pass timestamps & model version.</p>
              </div>
              <div>
                <strong className="font-telegraf text-[15px] font-bold text-white block">Depth Over Breadth</strong>
                <p className="mt-1 font-sweetsans text-[13px] text-white/70">Feni benchmark validated before expanding to national breadth.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 7: FOOTER (PURE BLACK)
          ========================================================================= */}
      <footer className="relative z-10 w-full border-t border-white/15 bg-black px-6 py-16 text-white sm:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-telegraf text-[17px] font-bold tracking-[0.25em] text-white uppercase sm:text-[19px]">
                KALOPATHOR®
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-white/50">
              {t('landing.credits')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-8 font-mono text-[11px] uppercase tracking-widest text-white/70">
            <Link href="/operations" className="transition-colors hover:text-white">
              {t('nav.operations')}
            </Link>
            <Link href="/approval" className="transition-colors hover:text-white">
              CAP Review
            </Link>
            <a
              href="https://github.com/realsamiul/Kalopathor-public"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-white"
            >
              <span>GitHub</span>
              <ExternalLink size={11} />
            </a>
            <span className="text-white/40">
              {t('ops.utc')}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function BigEditorialStatDark({
  number,
  unit,
  label,
  sub,
  format
}: {
  number: number;
  unit: string;
  label: string;
  sub: string;
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
    <div ref={ref} className="border-t border-white/20 pt-6">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[52px] font-black leading-none tracking-tight text-white sm:text-[64px] lg:text-[76px]">
          {format(shown)}
        </span>
        <span className="font-mono text-[13px] uppercase text-white/50">{unit}</span>
      </div>
      <div className="font-telegraf mt-3 text-[16px] font-bold text-white">{label}</div>
      <div className="mt-1 font-mono text-[11px] text-white/50">{sub}</div>
    </div>
  );
}
