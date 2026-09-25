# Kalopathor — Frontend Architecture Analysis & Expanded Spatial Research
*Comprehensive Synthesis of `Frontend.md` Analysis, Production GIS Benchmarks & Modern WebGL Architecture*
*Date: September 25, 2026 · Target Platform: Kalopathor Flood Intelligence Console*

---

## Table of Contents
1. [Executive Summary & Core Philosophy](#1-executive-summary--core-philosophy)
2. [Analysis of Frontend.md](#2-analysis-of-frontendmd)
   - 2.1 The Three Spatial UI Failure Modes
   - 2.2 The Progressive Disclosure Architecture
   - 2.3 World-Class Benchmark Platforms Audited
   - 2.4 Low-Friction, High-Impact Features Identified for Immediate Implementation
3. [Expanded State-of-the-Art Research & Repositories](#3-expanded-state-of-the-art-research--repositories)
   - 3.1 Earth Observation & Science Dashboards (NASA VEDA, STAC Browser, Fused)
   - 3.2 GPU Fragment Shaders & Client-Side Raster Decoders (CarbonPlan Zarr/COG)
   - 3.3 Emergency Operations & Humanitarian Cockpits (IFRC GO)
   - 3.4 Modern MapLibre GL Plugins & Extensions
   - 3.5 React & Next.js Headless UI Primitives (`nuqs`, `vaul`, `react-resizable-panels`, `visx`)
4. [Master Architectural Patterns for Multi-Hazard Cockpits](#4-master-architectural-patterns-for-multi-hazard-cockpits)
   - 4.1 URL as the Single Source of Truth (`nuqs`)
   - 4.2 Split-Curtain Comparison Engine (`maplibre-gl-compare`)
   - 4.3 Zero-Lag Bi-Directional Feature Hover Bus (`map.setFeatureState`)
   - 4.4 Decoupled Three-Column Workspace Shell
5. [Implementation Roadmap for Kalopathor](#5-implementation-roadmap-for-kalopathor)

---

## 1. Executive Summary & Core Philosophy

An advanced geospatial flood intelligence platform is not merely a "website with a map"—it is a **distributed, multi-threaded graphics application**. 

When a platform must juggle divergent physical datasets (fluvial/flash flood inundation, river erosion transects, optical reflectance, radar backscatter, demographic vulnerability, and gauge hydrographs), it must resolve the tension between **analytical depth** and **cognitive overload**.

The solution is a **Progressive Disclosure Architecture** (Level 1 Clean Canvas $\rightarrow$ Level 2 Docked Layer Drawer $\rightarrow$ Level 3 Deep Inspection Sheet) paired with a **Decoupled Graphics Engine** (isolating 60 FPS GPU/WebGL canvas events from low-frequency DOM state).

---

## 2. Analysis of `Frontend.md`

### 2.1 The Three Spatial UI Failure Modes
Most mapping applications collapse into one of three distinct traps:
1. **The Eye-Candy Trap** (e.g. *NASA Eyes*): Visually cinematic 3D globes that collapse into glorified tech demos when an operator attempts to query multi-variable rasters, temporal anomalies, or localized risk statistics.
2. **The Legacy GIS / Archaic Desktop Trap** (e.g. *GeoServer*, default *ArcGIS Web AppBuilder*): Operationally capable, but choked with early-2000s desktop paradigms—dense un-nested dropdown menus, rigid popup modals that occlude the map, slow raster rendering, and non-existent visual hierarchy.
3. **The Oversimplified Consumer Trap** (e.g. *Google Flood Hub*): Stripping away spatial and multi-hazard depth to the point where technical users cannot inspect the underlying physical variables driving the prediction.

---

### 2.2 The Progressive Disclosure Architecture

```
+---------------------------------------------------------------------------------------+
|  TOP APP BAR: Search Location | Active Hazard Selector (Tabs) | Temporal Range | Share|
+---------------------+---------------------------------------------------+--------------+
|                     |                                                   |              |
|  LEFT SLIDE DRAWER  |              MAIN INTERACTIVE CANVAS              | RIGHT SHEET  |
|  (Product & Layer   |                                                   | (Analytics   |
|   Configuration)    |  - MapLibre / Deck.gl Tile Rendering              |  Inspection) |
|                     |  - Visualizes Selected Hazard Raster              |              |
|  * Peril Selector   |  - Vector Transect / Station Overlays             |  * Timeseries|
|    [Flood v]        |                                                   |  * Radar Risk|
|    - Fluvial / Rain |  +---------------------------------------------+  |    Chart     |
|    - Coastal Surge  |  | FLOATING ACTION DOCK:                       |  |  * Exposure  |
|  * Vulnerability    |  | [Opacity] [Curtain Swipe] [Draw AOI] [Export|  |    Metrics   |
|    - Salinity Grid  |  +---------------------------------------------+  |  * Confidence|
|    - Erosion Trans. |                                                   |    Intervals |
|  * Scenario Stepper |  +---------------------------------------------+  |              |
|    [SSP2-4.5 v]     |  | BOTTOM SCRUBBER: Month / Year / Return Per. |  |              |
|                     |  +---------------------------------------------+  |              |
+---------------------+---------------------------------------------------+--------------+
```

* **Level 1 (Map Canvas):** Keep it clean. Show only the dominant hazard or composite score using a tuned cartographic basemap (e.g., Carto Dark / MapLibre Dark).
* **Level 2 (Docked Drawer):** Houses secondary variables, scenario pickers, and band toggles (opacity sliders, colormaps). Uses custom pills and segment controls instead of default browser select boxes.
* **Level 3 (Inspection Sheets / Modals):** Triggered when the user clicks an Area of Interest (AOI), river gauge, or flood polygon. Slides out from the right or bottom without blocking the primary map canvas.

---

### 2.3 World-Class Benchmark Platforms Audited

| Platform | Agencies / Studios | Key Products Juggled | UX Architecture Solved |
|---|---|---|---|
| **CoCliCo** (`coclico.eu`) | **Vizzuality**, Deltares, BRGM | Coastal Flood Inundation (1:10 to 1:1000yr), Coastal Erosion, Sea-Level Rise (IPCC AR6), Salinity Intrusion | **Dual-Rail Workspace:** Left drawer controls climate scenarios (SSP/year); Right sheet expands multi-hazard damage curves without breaking map context. |
| **WRI Aqueduct 4.0** (`wri.org`) | **Vizzuality** & WRI | 13 Hydrological Indicators (Water Stress, Flood Risk, Groundwater Decline, Eutrophication) | **Nested Tree Drawer + Bottom Sheet:** Category tree filters 13 indicators; clicking basins pops up bottom sparklines. |
| **Global Fishing Watch** (`globalfishingwatch.org`) | GFW, SkyTruth, Oceana | AIS vessel tracks, SAR vessel detections, VIIRS night lights, Sea Surface Salinity/Temp | **Photoshop-Style Layer Compositor:** Drag-and-drop layer precedence, opacity blending, synchronized 4D temporal tray. |
| **NASA VEDA** (`earth.gov/ghgcenter`) | NASA IMPACT & **Development Seed** | GHG fluxes (OCO-2, EMIT), SMAP soil moisture, Sentinel-1 flood extents, active wildfires | **Scrollytelling Handshake & Split-Curtain:** Story scroller hands off camera to cockpit; split divider compares baseline vs. hazard. |
| **Planetary Computer Explorer** (`planetarycomputer.microsoft.com`) | Microsoft AI for Good & **Development Seed** | Sentinel-1/2, Landsat, Copernicus DEM, ERA5 reanalysis | **Domain Silos & In-Browser Band Math:** Water/Land/Climate silos with real-time NDVI/NDWI dynamic stretch. |
| **Deltares ShorelineMonitor** (`shorelinemonitor.earth`) | **Deltares** & TU Delft | 11+ million coastal transects (1984–present), accretion vs. retreat | **Vector-to-Raster Transition:** Macro color-ramps transition to micro time-series scatterplots on transect click. |
| **First Street (Risk Factor)** (`riskfactor.com`) | First Street Foundation | Flooding, Wildfire, Extreme Wind, Extreme Heat, Air Quality down to 3m property resolution | **Unified Risk Index (1–10):** Normalizes gallons of flood depth and wind knots into intuitive peril scorecards with a 30-year mortgage stepper. |

---

### 2.4 Low-Friction, High-Impact Features Identified for Immediate Implementation

1. **Split-Curtain Swipe Mode (`maplibre-gl-compare`):** Eliminates muddy 50% opacity overlays by allowing operators to wipe between Pre-Flood optical (NASA VIIRS) and Post-Flood SAR (`d3v4.2`).
2. **Bi-Directional Hover Bus (`setFeatureState`):** Hovering gauge cards or flood polygons updates map stroke/glow instantly with zero React DOM re-renders.
3. **Categorized Layer Drawer with Per-Layer Opacity:** Groups layers into 4 clean domains (*Optical, Radar Flood, Hydrology, Exposure*) with dedicated micro-opacity sliders.
4. **Scrollytelling Onboarding:** Seamlessly steers the camera across Bangladesh's core basins (*Feni Basin, Meghna Estuary, Jamuna River*) before handing off to the console.
5. **Peril / Risk Tier Badges:** Compact 1–5 or Low/Med/High/Critical scorecards in action cards.

---

## 3. Expanded State-of-the-Art Research & Repositories

### 3.1 Earth Observation & Science Dashboards

```
                   ┌──────────────────────────────────────────────┐
                   │           APPLICATION SHELL ROOT             │
                   │   (Next.js / Vite + react-resizable-panels)  │
                   └───────┬──────────────────────────────┬───────┘
                           │                              │
          ┌────────────────┴──────────────┐      ┌────────┴─────────────────────┐
          ▼                               ▼      ▼                              ▼
 ┌──────────────────┐           ┌──────────────────┐                  ┌──────────────────┐
 │   LEFT DRAWER    │           │   MAP CANVAS     │                  │   RIGHT DRAWER   │
 │ (Layer Stacker & │           │ (MapLibre GL JS  │                  │ (Inspection &    │
 │  Scenario Tree)  │           │   + Deck.gl)     │                  │  Analytics)      │
 ├──────────────────┤           ├──────────────────┤                  ├──────────────────┤
 │ Vizzuality       │           │ NASA VEDA UI     │                  │ Vaul / Radix     │
 │ Layer-Manager    │◄─────────►│ Split-Curtain    │◄────────────────►│ Tremor /         │
 │ Shadcn Accordion │           │ Temporal Overlay │                  │ visx Hydrographs │
 └──────────────────┘           └────────┬─────────┘                  └──────────────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │ BOTTOM SCRUBBER  │
                                │ Time-Series      │
                                │ Range Calipers   │
                                └──────────────────┘
```

* **[NASA-IMPACT/veda-ui](https://github.com/NASA-IMPACT/veda-ui)** (NASA Earth.gov / GHG Center)
  * **Core Stack:** React, MapLibre GL, TiTiler, STAC APIs.
  * **Key Innovations:**
    * Native synchronized split-screen comparison curtains.
    * Dynamic STAC & Cloud-Optimized GeoTIFF (COG) integration via serverless TiTiler endpoints.
    * Zonal statistics modals generating dynamic raster histograms over user-defined AOIs.
* **[radiantearth/stac-browser](https://github.com/radiantearth/stac-browser)** (421★)
  * **Role:** Production SpatioTemporal Asset Catalog visualizer.
  * **Key Innovations:** Client-side STAC footprint bounding, multi-sensor asset inspectors, and fast tile previews.
* **[fusedio/udfs](https://github.com/fusedio/udfs)** (263★) & **[developmentseed/lonboard](https://github.com/developmentseed/lonboard)** (964★)
  * **Role:** Sub-second serverless geospatial Python UDFs delivering GeoArrow memory buffers directly to Deck.gl/MapLibre.

---

### 3.2 GPU Fragment Shaders & Client-Side Raster Decoders

* **[carbonplan/maps](https://github.com/carbonplan/maps)** (244★) & **[carbonplan/zarr-layer](https://github.com/carbonplan/zarr-layer)** (111★)
  * **The Gold Standard in Scientific Aesthetics:** Bypasses sluggish backend tile servers by streaming chunked **Zarr pyramids** directly over HTTP and running **GLSL fragment shaders on the client GPU**.
  * **Key Innovations:**
    * Instantaneous client-side color-scale remapping and thresholding ($\tau = 0.5 \to 0.7$) with zero network refetches.
    * Real-time band arithmetic (e.g. $\text{SDWI} = \ln(10 \cdot \text{VV} \cdot \text{VH}) - 8$) executed in GPU fragment shaders at a constant 60 FPS.
* **[carbonplan/colormaps](https://github.com/carbonplan/colormaps)**
  * Perceptually uniform, scientific color-ramps designed specifically for dark-mode cartography.

---

### 3.3 Emergency Operations & Humanitarian Cockpits

* **[IFRCGo/go-frontend](https://github.com/IFRCGo/go-frontend)** (IFRC Red Cross Global Emergency Operations)
  * **Role:** International disaster risk platform for flood, cyclone, and epidemic response.
  * **Key Innovations:**
    * **Early Action Protocols (EAPs):** Connects river gauge trigger thresholds directly to automated action cards.
    * **Population Exposure Density:** Integrates settlement layers with flood inundation boundaries to provide aggregated demographic impact tables.
* **[EOX-A/EOxElements](https://github.com/EOX-A/EOxElements)** (Copernicus Sentinel Hub Components)
  * Production Web Components for orbital pass timelines, cloud cover sliders, and multi-spectral band compositors.

---

### 3.4 Modern MapLibre GL Plugins & Extensions

| Package | Stars | Tactical Value for Kalopathor |
|---|---|---|
| **[maplibre/maplibre-gl-compare](https://github.com/maplibre/maplibre-gl-compare)** | 55★ | **Split-Screen Swipe:** Provides interactive split swipe between **Pre-flood optical baseline (NASA VIIRS)** and **Post-flood SAR radar inundation (`d3v4.2`)** without opacity muddiness. |
| **[mug-jp/maplibre-gl-opacity](https://github.com/mug-jp/maplibre-gl-opacity)** | 42★ | **Multi-Layer Opacity Controller:** Simple UI component to adjust raster/vector transparency per active layer. |
| **[onthegomap/maplibre-contour](https://github.com/onthegomap/maplibre-contour)** | 288★ | **Client-Side Contours:** Dynamically computes elevation contour lines from DEM tiles directly inside MapLibre. |
| **[protomaps/PMTiles](https://github.com/protomaps/PMTiles)** | 3,061★ | **Zero-Server Vector/Raster Archiving:** Serverless single-file archives for flood polygons, hazard zones, and terrain hillshades. |

---

### 3.5 React & Next.js Headless UI Primitives

| Primitive | Stars | Purpose in Cockpit Architecture |
|---|---|---|
| **[47ng/nuqs](https://github.com/47ng/nuqs)** | 10,856★ | **Type-Safe URL State Manager:** Stores map viewport (`lat`, `lon`, `zoom`), selected polygon ID, active layers, and scrubber date in the URL query string—enabling instant link sharing and bookmarking without state desynchronization. |
| **[emilkowalski/vaul](https://github.com/emilkowalski/vaul)** | 8,625★ | **Physics-Based Mobile/Desktop Drawer:** Smooth, draggable bottom and side inspection sheets for hydrographs and CAP alert reviews. |
| **[bvaughn/react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)** | 5,375★ | **Resizable 3-Pane GIS Shell:** Collapsible Left Layer Catalog $\leftrightarrow$ Central Map Canvas $\leftrightarrow$ Right Analytics Inspector with persistent split ratios. |
| **[airbnb/visx](https://github.com/airbnb/visx)** | 21,060★ | **Composable D3 + React Charting:** Lightweight SVG hydrographs and exposure distribution sparklines with smooth animations and minimal bundle footprint. |

---

## 4. Master Architectural Patterns for Multi-Hazard Cockpits

### Pattern A: Decoupled Multi-Slice State Machine (Zustand + nuqs)

```typescript
// store/useSpatialStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface LayerConfig {
  id: string;
  hazardType: 'flood' | 'erosion' | 'salinity' | 'optical';
  opacity: number;
  splitSide: 'left' | 'right' | 'both';
  temporalRange: [string, string]; // ISO8601
  threshold: number;
}

interface SpatialState {
  // 1. High-frequency Viewport State
  viewport: { latitude: number; longitude: number; zoom: number; pitch: number };
  setViewport: (vp: Partial<SpatialState['viewport']>) => void;

  // 2. Multi-Hazard Layer Stacker
  activeLayers: Record<string, LayerConfig>;
  setLayerConfig: (id: string, config: Partial<LayerConfig>) => void;

  // 3. Temporal Playhead
  activeTimestamp: string;
  isPlaying: boolean;
  setTimeline: (timestamp: string) => void;

  // 4. Progressive Disclosure (Drawers & Modals)
  inspectionSheet: {
    isOpen: boolean;
    activeFeatureId: string | null;
    analyticTab: 'hydrograph' | 'demographics' | 'eve_routes';
  };
  openInspector: (featureId: string) => void;
  closeInspector: () => void;
}

export const useSpatialStore = create<SpatialState>()(
  subscribeWithSelector((set) => ({
    viewport: { latitude: 23.01, longitude: 91.39, zoom: 9, pitch: 0 },
    setViewport: (vp) => set((s) => ({ viewport: { ...s.viewport, ...vp } })),

    activeLayers: {
      'sentinel1-flood': {
        id: 'sentinel1-flood',
        hazardType: 'flood',
        opacity: 0.85,
        splitSide: 'right',
        temporalRange: ['2024-08-01', '2024-08-25'],
        threshold: 0.50,
      },
      'viirs-optical': {
        id: 'viirs-optical',
        hazardType: 'optical',
        opacity: 1.0,
        splitSide: 'left',
        temporalRange: ['2024-08-01', '2024-08-25'],
        threshold: 0.0,
      }
    },
    setLayerConfig: (id, config) =>
      set((s) => ({
        activeLayers: {
          ...s.activeLayers,
          [id]: { ...s.activeLayers[id], ...config },
        },
      })),

    activeTimestamp: '2024-08-21T00:00:00Z',
    isPlaying: false,
    setTimeline: (activeTimestamp) => set({ activeTimestamp }),

    inspectionSheet: {
      isOpen: false,
      activeFeatureId: null,
      analyticTab: 'hydrograph',
    },
    openInspector: (featureId) =>
      set({
        inspectionSheet: { isOpen: true, activeFeatureId: featureId, analyticTab: 'hydrograph' }
      }),
    closeInspector: () =>
      set((s) => ({
        inspectionSheet: { ...s.inspectionSheet, isOpen: false, activeFeatureId: null }
      })),
  }))
);
```

---

### Pattern B: Zero-Lag Feature-State Hover Bus

```typescript
// hooks/useFeatureSync.ts
import { useEffect } from 'react';
import { useSpatialStore } from '../store/useSpatialStore';
import type { MapLibreMap } from 'maplibre-gl';

export function useFeatureSync(mapInstance: MapLibreMap | null) {
  useEffect(() => {
    if (!mapInstance) return;

    let activeHoverId: string | number | null = null;

    // Direct subscription bypassing React reconciliation cycle
    const unsub = useSpatialStore.subscribe(
      (state) => state.inspectionSheet.activeFeatureId,
      (newFeatureId) => {
        if (activeHoverId !== null) {
          mapInstance.setFeatureState(
            { source: 'flood-polygons', id: activeHoverId },
            { active: false }
          );
        }
        if (newFeatureId) {
          mapInstance.setFeatureState(
            { source: 'flood-polygons', id: newFeatureId },
            { active: true }
          );
        }
        activeHoverId = newFeatureId;
      }
    );

    return () => unsub();
  }, [mapInstance]);
}
```

---

### Pattern C: Custom GLSL Threshold Shader for Multi-Hazard Blending

```glsl
// fragment-shader.glsl (Deck.gl BitmapLayer / MapLibre Custom Layer)
precision highp float;

uniform sampler2D u_optical_texture;
uniform sampler2D u_sar_flood_texture;
uniform float u_flood_cutoff;      // User threshold slider (default: 0.50)
uniform float u_split_position;    // 0.0 to 1.0 (Split-curtain divider position)

varying vec2 v_texcoord;

void main() {
  vec4 opticalSample = texture2D(u_optical_texture, v_texcoord);
  vec4 sarSample = texture2D(u_sar_flood_texture, v_texcoord);

  // Screen split coordinate logic (gl_FragCoord.x normalized)
  if (gl_FragCoord.x < u_split_position) {
    // LEFT SIDE: Render Optical Natural Color
    gl_FragColor = opticalSample;
  } else {
    // RIGHT SIDE: Render SAR Inundation Anomaly (Electric Cyan / Coral)
    if (sarSample.r > u_flood_cutoff) {
      gl_FragColor = vec4(0.18, 0.83, 0.75, sarSample.r * 0.90);
    } else {
      gl_FragColor = opticalSample * 0.45; // Dimmed basemap under dry areas
    }
  }
}
```

---

## 5. Implementation Roadmap for Kalopathor

### Phase 1: Immediate Enhancements (Completed / In Progress)
- [x] **Charcoal & Glassmorphic Palette:** Implemented `--ink-0: #101216` matte charcoal palette with multi-stop blur filters.
- [x] **Complete 10-Layer System Catalog:** Structured all optical, radar, hydrological, and demographic products on the landing page.
- [x] **Backend Transparency Section:** Documented the $0.00 GCS ADC permanent OAuth architecture, live loop gating reasons, and the 3 zero-compute upgrades.
- [x] **Honesty Doctrine Matrix:** Enforced explicit labeling (*No Ghost Data*, *No False Guarantees*, *Independent Auditing*, *Depth Over Breadth*).

### Phase 2: Operations Console Hardening (Next Steps)
1. **Split-Curtain Comparison Mode:** Integrate `maplibre-gl-compare` into [OperationsConsole.tsx](file:///home/ubuntu/General/kalopathor/Kalopathor-public/frontend/app/components/OperationsConsole.tsx) to swipe between NASA VIIRS TrueColor and Sentinel-1 SAR `d3v4.2`.
2. **Type-Safe URL State (`nuqs`):** Synchronize lat/lon/zoom, selected polygon, active layers, and dates directly into URL search parameters.
3. **Bi-Directional `setFeatureState` Highlights:** Connect gauge drawer hover events to MapLibre station points with zero DOM lag.
4. **`visx` Telemetry Hydrographs:** Upgrade [GaugeDrawer.tsx](file:///home/ubuntu/General/kalopathor/Kalopathor-public/frontend/app/components/GaugeDrawer.tsx) to responsive D3 SVG curves with real-time danger thresholds and cursor hover inspectors.

### Phase 3: High-Performance GPU Graphics (Future Scaling)
1. **Client-Side Zarr/COG Decoding:** Utilize `carbonplan/zarr-layer` to evaluate SDWI index math dynamically on the GPU.
2. **DuckDB-WASM + GeoArrow Querying:** Stream multi-year erosion transects and national shelter networks directly into WebAssembly memory buffers.
