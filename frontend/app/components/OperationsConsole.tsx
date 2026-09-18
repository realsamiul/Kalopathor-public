'use client';

import {
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  addProtocol,
  removeProtocol,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type RequestParameters
} from 'maplibre-gl';
import {Protocol} from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import {useLocale, useTranslations} from 'next-intl';
import Link from 'next/link';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {
  GIBS_DATES,
  GIBS_DEFAULT_DATE,
  TRANSPARENT_PNG,
  clampGibsDate,
  gibsProtocolUrl,
  gfmTileUrl,
  GFM_DEFAULT_DATE,
  layers,
  type Coverage,
  type GibsLayer,
  type LayerId
} from '@/lib/map-config';
import {registerGibsProtocol, unregisterGibsProtocol, toArrayBuffer} from '@/lib/map-protocols';
import {
  STATE_KEYS,
  bundleUrl,
  routeGeoJSON,
  shelterGeoJSON,
  type ActionCardOverrides,
  type Bundle,
  type ConfidenceClass,
  type LifecycleBadge,
  type StateKey
} from '@/lib/bundle';
import {PREDICTION_DATES, WORKFLOW_ITEMS, type WorkflowItemId} from '@/lib/workflow';
import {useBreakpoint} from '@/lib/breakpoint';
import {humanAge} from '@/lib/freshness';
import type {FreshnessContract} from '@/lib/freshness';
import TopBar, {type TopStats} from './ui/TopBar';
import BottomNav from './ui/BottomNav';
import Legend from './ui/Legend';
import Sheet from './ui/Sheet';
import TimeScrubber from './TimeScrubber';
import WorkflowRail from './WorkflowRail';
import ActionCard from './ActionCard';
import WorkflowListPanel from './WorkflowListPanel';
import DataQualityPanel from './DataQualityPanel';
import GaugeDrawer, {type GaugeFeatureProps} from './GaugeDrawer';
import {List, MapPinned, X} from 'lucide-react';

const EMPTY_FC: GeoJSON.FeatureCollection = {type: 'FeatureCollection', features: []};
const DARK_BG = '#070b12';

const CONFIDENCE_CLASSES: ConfidenceClass[] = [
  'observed_high',
  'observed_medium',
  'possible',
  'review_required'
];

const BADGES: LifecycleBadge[] = ['monitoring', 'analysis', 'historical'];

export interface TopFloodPolygon {
  polygon_id: number;
  area_km2: number;
  district: string | null;
  confidence_class: string;
  badge: LifecycleBadge;
  affected_people: number;
  sar_pass_date: string;
  lon: number | null;
  lat: number | null;
}

export interface OpsMeta {
  event: {name: string; event_id: string};
  sar: {
    latest_pass: string;
    sensor: string[];
    polygon_count: number;
    total_affected: number;
    total_area_km2: number;
    gauge_count: number;
    next_pass_est: string;
    source: string;
  };
}

// Which core layers each workflow view activates — exhaustive (all LayerId keys)
// so no layer state can bleed between views.
const VIEW_LAYERS: Record<WorkflowItemId, Record<LayerId, boolean>> = {
  now_flooding:   {basemap: true, mcdwd: false, imerg: false, gfm: true, hillshade: true, rivers: true, flood: true, exposure: true, erosion: true, erosion_banklines: false, prediction: false, uncertainty: false, landslide: false, tvdi: false, gauges: false},
  next_72h:       {basemap: true, mcdwd: false, imerg: false, gfm: false, hillshade: true, rivers: true, flood: true, exposure: false, erosion: false, erosion_banklines: false, prediction: true, uncertainty: true, landslide: false, tvdi: false, gauges: false},
  people_at_risk: {basemap: true, mcdwd: false, imerg: false, gfm: false, hillshade: true, rivers: true, flood: true, exposure: true, erosion: false, erosion_banklines: false, prediction: false, uncertainty: false, landslide: false, tvdi: false, gauges: false},
  routes_shelters:{basemap: true, mcdwd: false, imerg: false, gfm: false, hillshade: true, rivers: true, flood: false, exposure: false, erosion: false, erosion_banklines: false, prediction: false, uncertainty: false, landslide: false, tvdi: false, gauges: false},
  gauges:         {basemap: true, mcdwd: false, imerg: false, gfm: false, hillshade: true, rivers: true, flood: false, exposure: false, erosion: false, erosion_banklines: false, prediction: false, uncertainty: false, landslide: false, tvdi: false, gauges: true},
  alerts:         {basemap: true, mcdwd: false, imerg: false, gfm: true, hillshade: true, rivers: true, flood: true, exposure: false, erosion: false, erosion_banklines: false, prediction: false, uncertainty: false, landslide: false, tvdi: false, gauges: false},
  data_quality:   {basemap: true, mcdwd: false, imerg: false, gfm: false, hillshade: true, rivers: true, flood: true, exposure: false, erosion: false, erosion_banklines: false, prediction: false, uncertainty: false, landslide: false, tvdi: false, gauges: false}
};

const GIB_LAYER_IDS: Record<GibsLayer, string> = {
  basemap: 'basemap',
  mcdwd: 'mcdwd',
  imerg: 'imerg'
};

const RASTER_LAYER_IDS: Record<LayerId, string[]> = {
  basemap:           ['basemap'],
  mcdwd:             ['mcdwd'],
  imerg:             ['imerg'],
  gfm:               ['gfm'],
  hillshade:         ['hillshade'],
  rivers:            ['rivers-glow', 'rivers'],
  flood:             ['flood-fill', 'flood-glow', 'flood-selected-glow', 'flood-selected'],
  exposure:          ['exposure-fill'],
  erosion:           ['erosion'],
  erosion_banklines: ['erosion-banklines'],
  prediction:        ['prediction'],
  uncertainty:       ['uncertainty'],
  landslide:         ['landslide'],
  tvdi:              ['tvdi'],
  gauges:            ['gauges', 'gauges-halo']
};

type SheetKind = null | 'list' | 'card' | 'gauge' | 'quality' | 'time' | 'more';

export default function OperationsConsole() {
  const t = useTranslations();
  const locale = useLocale();
  const bp = useBreakpoint();
  const isDesktop = bp === 'desktop';
  const isMobile = bp === 'mobile';

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);
  const hoveredRef = useRef<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [visible, setVisible] = useState<Record<LayerId, boolean>>({
    basemap:           true,
    mcdwd:             false,
    imerg:             false,
    gfm:               false,
    hillshade:         true,
    rivers:            true,
    flood:             true,
    exposure:          true,
    erosion:           true,
    erosion_banklines: false,
    prediction:        true,
    uncertainty:       false,
    landslide:         false,
    tvdi:              false,
    gauges:            false
  });
  const [gibsDate, setGibsDate] = useState(GIBS_DEFAULT_DATE);
  const [horizon, setHorizon] = useState(5);
  const [timeIndex, setTimeIndex] = useState(PREDICTION_DATES.indexOf('2024-06-18'));
  const [playing, setPlaying] = useState(false);
  const [cardBundle, setCardBundle] = useState<Bundle | null>(null);
  const [activeState, setActiveState] = useState<StateKey>('feni');
  const [selectedPolygonId, setSelectedPolygonId] = useState<number | null>(null);
  const [cardVisible, setCardVisible] = useState(true);
  const [cardOverrides, setCardOverrides] = useState<ActionCardOverrides | null>(null);
  const [view, setView] = useState<WorkflowItemId>('now_flooding');
  const [hoveredPolygonId, setHoveredPolygonId] = useState<number | null>(null);
  const [topPolys, setTopPolys] = useState<TopFloodPolygon[]>([]);
  const [opsMeta, setOpsMeta] = useState<OpsMeta | null>(null);
  const [freshness, setFreshness] = useState<FreshnessContract | null>(null);
  const [activeGauge, setActiveGauge] = useState<GaugeFeatureProps | null>(null);
  const [imergClipped, setImergClipped] = useState(
    () => clampGibsDate('imerg', GIBS_DEFAULT_DATE) !== GIBS_DEFAULT_DATE
  );
  const [layersOpen, setLayersOpen] = useState(false);
  const [legendOpenMobile, setLegendOpenMobile] = useState(false);
  const [forecastAvailable, setForecastAvailable] = useState(true);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const hydrated = useRef(false);

  // Refs so stable map event handlers can read the latest render state.
  const isDesktopRef = useRef(isDesktop);
  isDesktopRef.current = isDesktop;
  const cardVisibleRef = useRef(cardVisible);
  cardVisibleRef.current = cardVisible;
  const activeGaugeRef = useRef(activeGauge);
  activeGaugeRef.current = activeGauge;

  // ------------------------------------------------------------------ data
  const loadBundle = useCallback((key: StateKey) => {
    fetch(bundleUrl(key))
      .then((r) => {
        if (!r.ok) throw new Error(`bundle ${r.status}`);
        return r.json();
      })
      .then((b: Bundle) => setCardBundle(b))
      .catch((err) => console.error('ActionCard bundle load failed', err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(bundleUrl('feni'))
      .then((r) => r.json())
      .then((b: Bundle) => {
        if (!cancelled) setCardBundle(b);
      })
      .catch((err) => console.error('Feni bundle load failed', err));
    fetch('/data/top_flood_polygons.json')
      .then((r) => r.json())
      .then((d: {top: TopFloodPolygon[]}) => {
        if (!cancelled) setTopPolys(d.top);
      })
      .catch((err) => console.error('top polygons load failed', err));
    fetch('/data/ops_meta.json')
      .then((r) => r.json())
      .then((m: OpsMeta) => {
        if (!cancelled) setOpsMeta(m);
      })
      .catch((err) => console.error('ops meta load failed', err));
    fetch('/api/freshness')
      .then((r) => (r.ok ? r.json() : null))
      .then((c: FreshnessContract | null) => {
        if (!cancelled) setFreshness(c);
      })
      .catch(() => undefined);
    // Honest check: prediction tiles are large and gitignored in the public repo.
    fetch('/data/pmtiles/prediction_t5_2024-06-18.pmtiles', {method: 'HEAD'})
      .then((r) => setForecastAvailable(r.ok))
      .catch(() => setForecastAvailable(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // ------------------------------------------------------------ selection
  const setFeatureSelected = useCallback((id: number | null, feature?: GeoJSON.Feature) => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedRef.current !== null && map.getLayer('flood-fill')) {
      map.setFeatureState({source: 'flood', id: selectedRef.current}, {selected: false});
    }
    selectedRef.current = id;
    if (id !== null && map.getLayer('flood-fill')) {
      map.setFeatureState({source: 'flood', id}, {selected: true});
    }
    const src = map.getSource('flood-selected') as GeoJSONSource | undefined;
    if (src) {
      src.setData(feature ? {type: 'FeatureCollection', features: [feature]} : EMPTY_FC);
    }
  }, []);

  const selectPolygon = useCallback(
    (id: number, overrides?: ActionCardOverrides, feature?: GeoJSON.Feature) => {
      setSelectedPolygonId(id);
      setCardOverrides(overrides ?? null);
      setCardVisible(true);
      setActiveGauge(null);
      setFeatureSelected(id, feature);
      loadBundle('feni');
      // ref-based so this callback (and the map-init effect that closes over
      // it) stays referentially stable across breakpoint changes
      if (!isDesktopRef.current) setSheet('card');
    },
    [loadBundle, setFeatureSelected]
  );

  const closeCard = useCallback(() => {
    setCardVisible(false);
    setSelectedPolygonId(null);
    setCardOverrides(null);
    setFeatureSelected(null);
    if (!isDesktop && sheet === 'card') setSheet(null);
  }, [isDesktop, sheet, setFeatureSelected]);

  const changeState = useCallback(
    (key: StateKey) => {
      setActiveState(key);
      setSelectedPolygonId(null);
      setCardOverrides(null);
      setCardVisible(true);
      setActiveGauge(null);
      setFeatureSelected(null);
      loadBundle(key);
    },
    [loadBundle, setFeatureSelected]
  );

  const setHoveredPolygon = useCallback((id: number | null) => {
    setHoveredPolygonId(id);
    const map = mapRef.current;
    if (!map || !map.getLayer('flood-fill')) return;
    if (hoveredRef.current !== null) {
      map.setFeatureState({source: 'flood', id: hoveredRef.current}, {hovered: false});
    }
    if (id !== null) {
      map.setFeatureState({source: 'flood', id}, {hovered: true});
    }
    hoveredRef.current = id;
  }, []);

  const focusAt = useCallback((lat: number, lon: number, zoom = 9) => {
    mapRef.current?.flyTo({center: [lon, lat], zoom, duration: 900});
  }, []);

  // ------------------------------------------------------------ view / layers
  const setLayerVisible = useCallback((id: LayerId, on: boolean) => {
    setVisible((v) => ({...v, [id]: on}));
    const map = mapRef.current;
    if (!map) return;
    for (const l of RASTER_LAYER_IDS[id]) {
      if (map.getLayer(l)) map.setLayoutProperty(l, 'visibility', on ? 'visible' : 'none');
    }
    if (id === 'exposure' && on) {
      const src = map.getSource('exposure') as GeoJSONSource | undefined;
      if (src) {
        fetch('/data/exposure_districts.geojson')
          .then((r) => r.json())
          .then((fc) => src.setData(fc))
          .catch((err) => console.error('exposure load failed', err));
      }
    }
  }, []);

  const applyView = useCallback(
    (id: WorkflowItemId) => {
      setView(id);
      setActiveGauge(null);
      const preset = VIEW_LAYERS[id];
      for (const k of Object.keys(preset) as LayerId[]) setLayerVisible(k, preset[k]);
      const map = mapRef.current;
      if (!map) return;
      const dataLayers: [string, boolean][] = [
        ['gauges', id === 'gauges'],
        ['shelters', id === 'routes_shelters'],
        ['routes', id === 'routes_shelters']
      ];
      for (const [l, on] of dataLayers) {
        if (map.getLayer(l)) {
          map.setLayoutProperty(l, 'visibility', on ? 'visible' : 'none');
        }
      }
    },
    [setLayerVisible]
  );

  const selectView = useCallback(
    (id: WorkflowItemId) => {
      applyView(id);
      setHoveredPolygon(null);
      if (id === 'data_quality') {
        if (!isDesktop) setSheet('quality');
        return;
      }
      if (!isDesktop) setSheet('list');
    },
    [applyView, isDesktop, setHoveredPolygon]
  );

  const setPrediction = useCallback((horizonId: number, date: string) => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('prediction');
    if (src && 'setTiles' in src) {
      (src as import('maplibre-gl').RasterTileSource | undefined)?.setTiles([
        `pmtiles:///data/pmtiles/prediction_t${horizonId}_${date}.pmtiles/{z}/{x}/{y}`
      ]);
    }
  }, []);

  const setGibsDateFor = useCallback((date: string) => {
    setGibsDate(date);
    setImergClipped(clampGibsDate('imerg', date) !== date);
    const map = mapRef.current;
    if (!map) return;
    for (const l of ['basemap', 'mcdwd', 'imerg'] as GibsLayer[]) {
      const src = map.getSource(GIB_LAYER_IDS[l]);
      if (src && 'setTiles' in src) {
        (src as import('maplibre-gl').RasterTileSource | undefined)?.setTiles([gibsProtocolUrl(l, date)]);
      }
    }
    // Sync GFM date to GIBS scrubber date
    const gfmSrc = map.getSource('gfm');
    if (gfmSrc && 'setTiles' in gfmSrc) {
      (gfmSrc as import('maplibre-gl').RasterTileSource | undefined)?.setTiles([`gfm://${date}/{z}/{x}/{y}`]);
    }
  }, []);

  // Timeline autoplay
  useEffect(() => {
    if (!playing || !mapReady) return;
    const timer = setTimeout(() => {
      const di = Math.max(0, GIBS_DATES.indexOf(gibsDate));
      setGibsDateFor(GIBS_DATES[(di + 1) % GIBS_DATES.length]);
      const ni = (timeIndex + 1) % PREDICTION_DATES.length;
      setTimeIndex(ni);
      setPrediction(horizon, PREDICTION_DATES[ni]);
    }, 2200);
    return () => clearTimeout(timer);
  }, [playing, mapReady, gibsDate, timeIndex, horizon, setGibsDateFor, setPrediction]);

  // ------------------------------------------------------------ map events
  const onPolygonClick = useCallback(
    (props: Record<string, unknown>, feature?: GeoJSON.Feature) => {
      const pid = props.polygon_id as number;
      if (typeof pid !== 'number') return;
      const cls = props.confidence_class as string;
      const overrides: ActionCardOverrides = {
        confidenceClass: CONFIDENCE_CLASSES.includes(cls as ConfidenceClass)
          ? (cls as ConfidenceClass)
          : undefined,
        affectedPeople: props.affected_people as number | undefined,
        district: (props.district as string) ?? undefined,
        sarPassDate: (props.sar_pass_date as string) ?? undefined,
        badge: BADGES.includes(props.badge as LifecycleBadge) ? (props.badge as LifecycleBadge) : undefined
      };
      selectPolygon(pid, overrides, feature);
    },
    [selectPolygon]
  );

  useEffect(() => {
    if (!mapContainer.current) return;
    // Load the raw MapLibre ESM build at runtime (webpack's bundled worker
    // placeholder resolves to an unfetchable file:// path, which stalls
    // raster tile decode and the map 'load' event).
    setWorkerUrl('/lib/maplibre-gl-worker.mjs');

    const protocol = new Protocol();
    addProtocol('pmtiles', protocol.tile);
    registerGibsProtocol();

    // Hazard tile bundles (landslide + TVDI) — base64 PNG tiles from JSON
    const hazardBundles: Record<string, Record<string, string>> = {};
    const loadHazardBundle = async (name: string) => {
      if (hazardBundles[name]) return hazardBundles[name];
      const res = await fetch(`/data/pmtiles/${name}_tiles.json`);
      const data = await res.json();
      hazardBundles[name] = data.tiles || {};
      return hazardBundles[name];
    };
    addProtocol('hazard', async (params: RequestParameters) => {
      try {
        const url = new URL(params.url);
        const name = url.hostname; // e.g. "landslide" or "tvdi"
        const [, zs, xs, ys] = url.pathname.split('/');
        const key = `${zs}/${xs}/${ys}`;
        const bundle = await loadHazardBundle(name);
        const b64 = bundle[key];
        if (!b64) return {data: toArrayBuffer(TRANSPARENT_PNG)};
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return {data: arr.buffer};
      } catch {
        return {data: toArrayBuffer(TRANSPARENT_PNG)};
      }
    });
    addProtocol('gfm', async (params: RequestParameters, abortController: AbortController) => {
      try {
        const url = new URL(params.url);
        const [, date, zs, xs, ys] = url.pathname.split('/');
        const z = Number(zs);
        const x = Number(xs);
        const y = Number(ys);
        const res = await fetch(gfmTileUrl(date, z, x, y), {
          signal: abortController.signal
        });
        if (!res.ok) return {data: toArrayBuffer(TRANSPARENT_PNG)};
        const data = await res.arrayBuffer();
        return {data};
      } catch (err) {
        console.warn('gfm tile error', err);
        return {data: toArrayBuffer(TRANSPARENT_PNG)};
      }
    });

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: [gibsProtocolUrl('basemap', GIBS_DEFAULT_DATE)],
            tileSize: 512,
            minzoom: 0,
            maxzoom: 9
          },
          mcdwd: {
            type: 'raster',
            tiles: [gibsProtocolUrl('mcdwd', GIBS_DEFAULT_DATE)],
            tileSize: 512,
            minzoom: 0,
            maxzoom: 9
          },
          imerg: {
            type: 'raster',
            tiles: [gibsProtocolUrl('imerg', GIBS_DEFAULT_DATE)],
            tileSize: 512,
            minzoom: 0,
            maxzoom: 9
          },
          gfm: {
            type: 'raster',
            tiles: [`gfm://${GFM_DEFAULT_DATE}/{z}/{x}/{y}`],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 12,
            attribution: '© Copernicus GFM / EODC'
          },
          hillshade: {
            type: 'raster',
            tiles: ['pmtiles:///data/hillshade_bgd.pmtiles/{z}/{x}/{y}'],
            tileSize: 256,
            minzoom: 5,
            maxzoom: 10
          },
          rivers: {
            type: 'geojson',
            data: '/data/rivers_bgd.geojson'
          },
          flood: {
            type: 'geojson',
            data: '/data/detection_polygons_v4.geojson',
            promoteId: 'polygon_id'
          },
          'flood-selected': {
            type: 'geojson',
            data: EMPTY_FC
          },
          exposure: {
            type: 'geojson',
            data: EMPTY_FC
          },
          erosion: {
            type: 'geojson',
            data: '/data/erosion_layer.geojson'
          },
          erosion_banklines: {
            type: 'geojson',
            data: '/data/erosion_banklines.geojson'
          },
          prediction: {
            type: 'raster',
            tiles: ['pmtiles:///data/pmtiles/prediction_t5_2024-06-18.pmtiles/{z}/{x}/{y}'],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 7
          },
          uncertainty: {
            type: 'raster',
            tiles: ['pmtiles:///data/pmtiles/uncertainty_t5.pmtiles/{z}/{x}/{y}'],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 7
          },
          landslide: {
            type: 'raster',
            tiles: ['hazard://landslide/{z}/{x}/{y}'],
            tileSize: 256,
            minzoom: 5,
            maxzoom: 9
          },
          tvdi: {
            type: 'raster',
            tiles: ['hazard://tvdi/{z}/{x}/{y}'],
            tileSize: 256,
            minzoom: 5,
            maxzoom: 9
          },
          gauges: {
            type: 'geojson',
            data: '/data/ffwc_gauges.geojson'
          },
          shelters: {
            type: 'geojson',
            data: EMPTY_FC
          },
          routes: {
            type: 'geojson',
            data: EMPTY_FC
          }
        },
        layers: [
          {id: 'bg', type: 'background', paint: {'background-color': DARK_BG}},
          {
            id: 'basemap',
            type: 'raster',
            source: 'basemap',
            // Stylized-realistic: keep the satellite truth, push it into a
            // moody command-center grade (darker, less saturated, more contrast).
            paint: {
              'raster-saturation': -0.3,
              'raster-brightness-min': 0.7,
              'raster-brightness-max': 0.85,
              'raster-contrast': 1.12,
              'raster-hue-rotate': -5,
              'raster-fade-duration': 0
            }
          },
          {
            id: 'mcdwd',
            type: 'raster',
            source: 'mcdwd',
            layout: {visibility: 'none'},
            paint: {'raster-opacity': 0.75, 'raster-saturation': -0.1, 'raster-fade-duration': 0}
          },
          {
            id: 'imerg',
            type: 'raster',
            source: 'imerg',
            layout: {visibility: 'none'},
            paint: {'raster-opacity': 0.55, 'raster-fade-duration': 0}
          },
          {
            id: 'gfm',
            type: 'raster',
            source: 'gfm',
            layout: {visibility: 'none'},
            paint: {'raster-opacity': 0.7, 'raster-saturation': 0.15, 'raster-fade-duration': 0}
          },
          {
            id: 'hillshade',
            type: 'raster',
            source: 'hillshade',
            paint: {'raster-opacity': 0.32}
          },
          {
            id: 'rivers-glow',
            type: 'line',
            source: 'rivers',
            layout: {'line-join': 'round', 'line-cap': 'round'},
            paint: {
              'line-color': '#3b82f6',
              'line-width': ['interpolate', ['linear'], ['zoom'], 5, 3, 10, 7],
              'line-opacity': 0.12,
              'line-blur': 2
            }
          },
          {
            id: 'rivers',
            type: 'line',
            source: 'rivers',
            layout: {'line-join': 'round', 'line-cap': 'round'},
            paint: {
              'line-color': '#60a5fa',
              'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.2, 10, 3],
              'line-opacity': 0.8
            }
          },
          {
            id: 'exposure-fill',
            type: 'fill',
            source: 'exposure',
            layout: {visibility: 'none'},
            paint: {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'affected_people'],
                0,
                'rgba(45,212,191,0.18)',
                200000,
                'rgba(245,158,11,0.38)',
                800000,
                'rgba(239,68,68,0.5)',
                1800000,
                'rgba(190,18,60,0.6)'
              ],
              'fill-opacity': 0.85
            }
          },
          {
            id: 'flood-fill',
            type: 'fill',
            source: 'flood',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hovered'], false],
                '#f87171',
                ['boolean', ['feature-state', 'selected'], false],
                '#ef4444',
                '#dc2626'
              ],
              'fill-opacity': [
                'case',
                ['==', ['get', 'badge'], 'monitoring'],
                0.55,
                ['==', ['get', 'badge'], 'analysis'],
                0.42,
                0.3
              ]
            }
          },
          {
            id: 'flood-glow',
            type: 'line',
            source: 'flood',
            paint: {
              'line-color': '#ef4444',
              'line-width': 1.5,
              'line-opacity': 0.9,
              'line-blur': 2
            }
          },
          {
            id: 'flood-selected-glow',
            type: 'line',
            source: 'flood-selected',
            paint: {
              'line-color': '#ffffff',
              'line-width': 7,
              'line-opacity': 0.28,
              'line-blur': 3
            }
          },
          {
            id: 'flood-selected',
            type: 'line',
            source: 'flood-selected',
            paint: {
              'line-color': '#ffffff',
              'line-width': 2,
              'line-opacity': 0.95
            }
          },
          {
            id: 'erosion',
            type: 'line',
            source: 'erosion',
            paint: {
              'line-color': '#f97316',
              'line-width': 1.5,
              'line-opacity': 0.85,
              'line-dasharray': [4, 2]
            }
          },
          {
            id: 'erosion-banklines',
            type: 'line',
            source: 'erosion_banklines',
            layout: {visibility: 'none'},
            paint: {
              'line-color': [
                'match',
                ['get', 'river'],
                'jamuna', '#f59e0b',
                'meghna', '#a78bfa',
                'padma',  '#34d399',
                '#94a3b8'
              ],
              'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 9, 3],
              'line-opacity': 0.8
            }
          },
          {
            id: 'uncertainty',
            type: 'raster',
            source: 'uncertainty',
            layout: {visibility: 'none'},
            paint: {
              'raster-opacity': 0.45,
              'raster-fade-duration': 0,
              'raster-hue-rotate': 30,
              'raster-saturation': -0.3
            }
          },
          {
            id: 'landslide',
            type: 'raster',
            source: 'landslide',
            layout: {visibility: 'none'},
            paint: {'raster-opacity': 0.55, 'raster-fade-duration': 0, 'raster-hue-rotate': -60, 'raster-saturation': 0.4}
          },
          {
            id: 'tvdi',
            type: 'raster',
            source: 'tvdi',
            layout: {visibility: 'none'},
            paint: {'raster-opacity': 0.5, 'raster-fade-duration': 0, 'raster-hue-rotate': 60, 'raster-saturation': 0.3}
          },
          {
            id: 'gauges',
            type: 'circle',
            source: 'gauges',
            layout: {visibility: 'none'},
            paint: {
              'circle-radius': [
                'case',
                ['==', ['get', 'status'], 'danger'],
                7,
                ['==', ['get', 'status'], 'warning'],
                6,
                5
              ],
              'circle-color': [
                'match',
                ['get', 'status'],
                'danger', '#f43f5e',
                'warning', '#f59e0b',
                '#2dd4bf'
              ],
              'circle-stroke-color': DARK_BG,
              'circle-stroke-width': 1.5
            }
          },
          {
            id: 'gauges-halo',
            type: 'circle',
            source: 'gauges',
            layout: {visibility: 'none'},
            paint: {
              'circle-radius': ['case', ['==', ['get', 'status'], 'danger'], 12, 0],
              'circle-color': '#f43f5e',
              'circle-opacity': 0.16
            }
          },
          {
            id: 'shelters',
            type: 'circle',
            source: 'shelters',
            layout: {visibility: 'none'},
            paint: {
              'circle-radius': 4,
              'circle-color': '#a78bfa',
              'circle-stroke-color': DARK_BG,
              'circle-stroke-width': 1
            }
          },
          {
            id: 'routes',
            type: 'line',
            source: 'routes',
            layout: {visibility: 'none'},
            paint: {
              'line-color': ['get', 'is_safe_for_recommendation'],
              'line-width': 2,
              'line-opacity': 0.85,
              'line-dasharray': [3, 2]
            }
          }
        ]
      },
      center: [90.4, 23.8],
      zoom: 6.2,
      minZoom: 1,
      maxZoom: 12,
      attributionControl: {
        compact: true,
        customAttribution: 'GIBS/NASA · FFWC · Kalopathor'
      }
    });

    map.addControl(new NavigationControl({showCompass: true}), 'bottom-right');
    map.addControl(new ScaleControl({maxWidth: 110}), 'bottom-right');

    // Readiness: MapLibre v6 may keep the 'load' event pending while raster
    // tiles trickle in, so we gate the console UI on the first painted frame.
    const markReady = () => {
      if (readyRef.current) return;
      readyRef.current = true;
      setMapReady(true);
    };
    map.on('load', markReady);
    map.on('render', markReady);
    setTimeout(markReady, 15000);

    // Event handlers are registered up-front; MapLibre dispatches them only
    // once the referenced layers exist.
    map.on('click', 'flood-fill', (e: MapLayerMouseEvent) => {
      if (e.features?.[0]) onPolygonClick(e.features[0].properties, e.features[0]);
    });
    map.on('mousemove', 'flood-fill', (e: MapLayerMouseEvent) => {
      const pid = e.features?.[0]?.properties?.polygon_id;
      if (typeof pid === 'number') setHoveredPolygon(pid);
    });
    map.on('mouseleave', 'flood-fill', () => setHoveredPolygon(null));
    map.on('mouseenter', 'flood-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'flood-fill', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('click', 'gauges', (e: MapLayerMouseEvent) => {
      const p = e.features?.[0]?.properties;
      if (!p) return;
      setActiveGauge(p as unknown as GaugeFeatureProps);
      setCardVisible(false);
      setSelectedPolygonId(null);
      setFeatureSelected(null);
      if (!isDesktopRef.current) setSheet('gauge');
    });
    map.on('mouseenter', 'gauges', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'gauges', () => {
      map.getCanvas().style.cursor = '';
    });
    // Empty-map click: dismiss card/gauge (sheet on mobile, column on desktop)
    map.on('click', (e) => {
      const hits = map.queryRenderedFeatures(e.point, {
        layers: ['flood-fill', 'gauges']
      });
      if (hits.length > 0) return;
      if (cardVisibleRef.current && !activeGaugeRef.current) closeCardRef.current();
    });

    mapRef.current = map;

    // Keep the canvas in sync with layout changes (card column, breakpoint).
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(mapContainer.current);

    return () => {
      ro.disconnect();
      removeProtocol('pmtiles');
      unregisterGibsProtocol();
      removeProtocol('gfm');
      removeProtocol('hazard');
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPolygonClick, setHoveredPolygon]);

  const closeCardRef = useRef(closeCard);
  closeCardRef.current = closeCard;

  // Keep bundle-derived sources in sync with the selected state bundle.
  useEffect(() => {
    if (!mapReady || !cardBundle) return;
    const map = mapRef.current;
    if (!map) return;
    (map.getSource('shelters') as GeoJSONSource | undefined)?.setData(shelterGeoJSON(cardBundle));
    (map.getSource('routes') as GeoJSONSource | undefined)?.setData(routeGeoJSON(cardBundle));
  }, [mapReady, cardBundle]);

  // Apply the default view's layer preset once the map is up.
  useEffect(() => {
    if (mapReady) applyView('now_flooding');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  // ------------------------------------------------------------ URL state (deep links)
  useEffect(() => {
    if (hydrated.current || typeof window === 'undefined') return;
    hydrated.current = true;
    const q = new URLSearchParams(window.location.search);
    const v = q.get('view');
    if (v && (WORKFLOW_ITEMS as readonly {id: WorkflowItemId}[]).some((i) => i.id === v)) {
      applyView(v as WorkflowItemId);
      setView(v as WorkflowItemId);
      if (v === 'data_quality' && !isDesktopRef.current) setSheet('quality');
    }
    const st = q.get('state');
    if (st && (STATE_KEYS as readonly string[]).includes(st)) changeState(st as StateKey);
    const d = q.get('date');
    if (d && GIBS_DATES.includes(d)) setGibsDateFor(d);
    const h = Number(q.get('horizon'));
    if ([1, 3, 5, 7].includes(h)) setHorizon(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  useEffect(() => {
    if (!hydrated.current) return;
    const q = new URLSearchParams(window.location.search);
    q.set('view', view);
    q.set('state', activeState);
    q.set('date', gibsDate);
    q.set('horizon', String(horizon));
    if (selectedPolygonId != null) q.set('poly', String(selectedPolygonId));
    else q.delete('poly');
    const url = `${window.location.pathname}?${q.toString()}`;
    window.history.replaceState(null, '', url);
  }, [view, activeState, gibsDate, horizon, selectedPolygonId]);

  // ------------------------------------------------------------ keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return;
      const n = Number(e.key);
      if (n >= 1 && n <= WORKFLOW_ITEMS.length) {
        selectView(WORKFLOW_ITEMS[n - 1].id);
      } else if (e.key === 'l' || e.key === 'L') {
        setLayersOpen((o) => !o);
      } else if (e.key === 'Escape') {
        if (sheet) setSheet(null);
        else closeCard();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectView, closeCard, sheet]);

  // ------------------------------------------------------------ derived
  const sarLastPass = opsMeta?.sar.latest_pass ?? freshness?.layers.sar_detection.last_pass;
  const sarNextPass = freshness?.layers.sar_detection.next_pass ?? opsMeta?.sar.next_pass_est;
  const ffwcAsOf = freshness?.layers.ffwc_gauges.last_success;
  const forecastAsOf = freshness?.layers.forecast_openmeteo.run_ts;
  const serverTime = freshness?.server_time ?? new Date().toISOString();

  const stats: TopStats = useMemo(() => {
    const age = (iso: string | null | undefined) =>
      iso
        ? humanAge(Math.max(0, Math.floor((Date.parse(serverTime) - Date.parse(iso)) / 1000)))
        : '—';
    return {
      sar: sarLastPass ? String(sarLastPass).slice(0, 10) : '—',
      ffwc: age(ffwcAsOf),
      fcst: age(forecastAsOf),
      next: sarNextPass ? String(sarNextPass).slice(0, 10) : '—'
    };
  }, [sarLastPass, sarNextPass, ffwcAsOf, forecastAsOf, serverTime]);

  const listCount = useMemo(() => {
    switch (view) {
      case 'now_flooding':
        return topPolys.length;
      case 'gauges':
        return opsMeta?.sar.gauge_count ?? 0;
      default:
        return 0;
    }
  }, [view, topPolys.length, opsMeta]);

  // ------------------------------------------------------------ panels
  const cardAccent = cardOverrides?.confidenceClass
    ? {observed_high: '45 212 191', observed_medium: '245 158 11', possible: '56 189 248', forecast_only: '167 139 250', review_required: '244 63 94'}[cardOverrides.confidenceClass]
    : '245 158 11';

  const gaugeTone = activeGauge?.status === 'danger' ? '244 63 94' : activeGauge?.status === 'warning' ? '245 158 11' : '45 212 191';

  const showCardContent = cardVisible && cardBundle && !activeGauge && view !== 'data_quality';

  const desktopPanel = activeGauge ? (
    <GaugeDrawer gauge={activeGauge} onClose={() => setActiveGauge(null)} />
  ) : view === 'data_quality' ? (
    <DataQualityPanel onClose={() => selectView('now_flooding')} />
  ) : showCardContent ? (
    <ActionCard
      bundle={cardBundle}
      polygonId={selectedPolygonId}
      overrides={cardOverrides ?? undefined}
      onClose={closeCard}
    />
  ) : null;

  const sheetSide = (kind: 'card' | 'gauge' | 'quality' | 'list'): 'bottom' | 'left' | 'right' => {
    if (bp === 'mobile') return 'bottom';
    return kind === 'list' ? 'left' : 'right';
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-ink-0">
      <TopBar
        eventName={opsMeta?.event.name ?? cardBundle?.event.title ?? t('ops.title')}
        stats={stats}
        healthMode={freshness?.mode ?? 'seeded'}
        gfmVisible={visible.gfm}
        onGfmToggle={() => setLayerVisible('gfm', !visible.gfm)}
        onOpenMenu={() => setSheet('more')}
        showMenu={isMobile}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* Left rail: full (desktop) / icon-only (tablet) */}
        {bp !== 'mobile' && (
          <WorkflowRail
            active={view}
            onSelect={selectView}
            compact={bp === 'tablet'}
            layersOpen={layersOpen}
            onToggleLayers={() => setLayersOpen((o) => !o)}
            layersToggle={
              <LayerSwitcher
                visible={visible}
                onToggle={setLayerVisible}
                gibsDate={gibsDate}
                imergClipped={imergClipped}
              />
            }
          />
        )}

        {/* Center: map + scrubber + (mobile) bottom nav */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

            {mapReady && (
              <>
                {/* State selector — desktop/tablet pill */}
                {bp !== 'mobile' && (
                  <motion.div
                    initial={{y: -10, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{delay: 0.1}}
                    className="absolute left-1/2 top-2.5 z-20 -translate-x-1/2"
                  >
                    <label className="glass flex items-center gap-2 rounded-full px-3 py-1.5 shadow-panel">
                      <span className="font-mono text-[8.5px] uppercase tracking-widest text-mist-3">
                        {t('ops.card.selectState')}
                      </span>
                      <select
                        value={activeState}
                        onChange={(e) => changeState(e.target.value as StateKey)}
                        className="max-w-[180px] bg-transparent text-[11.5px] font-medium text-mist-1 outline-none [&>option]:bg-ink-2"
                      >
                        {STATE_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {stateLabels(t)[k]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </motion.div>
                )}

                {/* Mobile: list + legend chips */}
                {isMobile && (
                  <div className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-1.5">
                    <button
                      onClick={() => setSheet(sheet === 'list' ? null : 'list')}
                      className="glass flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shadow-panel"
                    >
                      <List size={13} className="text-accent" aria-hidden />
                      <span className="font-mono text-[10px] text-mist-1">
                        {t(`ops.rail.${view}`)}
                      </span>
                      {listCount > 0 && (
                        <span className="rounded bg-accent/15 px-1 font-mono text-[9px] font-semibold text-accent">
                          {listCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setLegendOpenMobile((o) => !o)}
                      aria-expanded={legendOpenMobile}
                      className={`glass flex items-center justify-center rounded-lg p-2 shadow-panel ${
                        legendOpenMobile ? 'text-accent' : 'text-mist-2'
                      }`}
                    >
                      <MapPinned size={14} aria-hidden />
                    </button>
                    {legendOpenMobile && (
                      <div className="fade-up">
                        <Legend />
                      </div>
                    )}
                  </div>
                )}

                {/* Legend — desktop */}
                {isDesktop && (
                  <div className="absolute bottom-3 left-3 z-20">
                    <Legend />
                  </div>
                )}

                {/* Stats strip — desktop */}
                {isDesktop && opsMeta && (
                  <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
                    <div className="glass flex items-center gap-3 rounded-lg px-3.5 py-2 shadow-panel">
                      <StatsChip label={t('ops.stats.polygons')} value={String(opsMeta.sar.polygon_count)} />
                      <span className="h-3.5 w-px bg-line-strong" />
                      <StatsChip label={t('ops.stats.area')} value={`${opsMeta.sar.total_area_km2.toLocaleString()} km²`} />
                      <span className="h-3.5 w-px bg-line-strong" />
                      <StatsChip label={t('ops.stats.affected')} value={`${(opsMeta.sar.total_affected / 1e6).toFixed(1)}M`} />
                      <span className="h-3.5 w-px bg-line-strong" />
                      <StatsChip label={t('ops.stats.gauges')} value={String(opsMeta.sar.gauge_count)} />
                    </div>
                  </div>
                )}

                {/* Click hint — desktop only (hover affordance) */}
                {isDesktop && view === 'now_flooding' && cardVisible && selectedPolygonId === null && !activeGauge && (
                  <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.8}}
                    className="pointer-events-none absolute bottom-14 left-1/2 z-10 -translate-x-1/2"
                  >
                    <span className="rounded-full bg-ink-2/85 px-3 py-1.5 font-mono text-[9.5px] text-mist-2 shadow-panel backdrop-blur">
                      {t('ops.card.clickHint')}
                    </span>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Time scrubber: full bar (desktop/tablet) or compact chips (mobile) */}
          {mapReady && (
            <TimeScrubber
              mode={isMobile ? 'chips' : 'bar'}
              gibsDate={gibsDate}
              onGibsDate={setGibsDateFor}
              imergClipped={imergClipped}
              horizon={horizon}
              onHorizon={(h) => {
                setHorizon(h);
                setPrediction(h, PREDICTION_DATES[timeIndex]);
              }}
              timeIndex={timeIndex}
              onTimeIndex={(i) => {
                setTimeIndex(i);
                setPrediction(horizon, PREDICTION_DATES[i]);
              }}
              playing={playing}
              onTogglePlay={() => setPlaying((p) => !p)}
              forecastAvailable={forecastAvailable}
              onExpand={() => setSheet('time')}
            />
          )}

          {isMobile && (
            <BottomNav active={view} onSelect={selectView} onMore={() => setSheet('more')} />
          )}
        </div>

        {/* Right column — desktop only */}
        {isDesktop && desktopPanel && (
          <aside className="flex w-[380px] shrink-0 flex-col border-l border-line bg-ink-1">
            <motion.div
              key={`${view}-${activeGauge?.gauge_id ?? 'card'}`}
              initial={{opacity: 0, x: 16}}
              animate={{opacity: 1, x: 0}}
              transition={{duration: 0.22}}
              className="flex min-h-0 flex-1 flex-col"
            >
              {desktopPanel}
            </motion.div>
          </aside>
        )}
      </div>

      {/* Mobile + tablet sheets */}
      {bp !== 'desktop' && (
        <AnimatePresence>
          {sheet === 'list' && (
            <Sheet
              key="list"
              open
              side={sheetSide('list')}
              backdrop={false}
              ariaLabel={t(`ops.rail.${view}`)}
              onClose={() => setSheet(null)}
              accent="45 212 191"
            >
              <SheetHead title={t(`ops.rail.${view}`)} onClose={() => setSheet(null)} />
              <WorkflowListPanel
                view={view}
                bundle={cardBundle}
                topPolys={topPolys}
                hoveredPolygonId={hoveredPolygonId}
                onHoverPolygon={setHoveredPolygon}
                onSelectPolygon={(p) => {
                  selectPolygon(p.polygon_id, {
                    confidenceClass: p.confidence_class as ConfidenceClass,
                    affectedPeople: p.affected_people,
                    district: p.district ?? undefined,
                    sarPassDate: p.sar_pass_date,
                    badge: p.badge
                  });
                  if (p.lat != null && p.lon != null) focusAt(p.lat, p.lon, 10);
                }}
                onFocus={focusAt}
              />
            </Sheet>
          )}

          {sheet === 'card' && showCardContent && cardBundle && (
            <Sheet
              key="card"
              open
              side={sheetSide('card')}
              backdrop={false}
              ariaLabel={t('ops.card.title')}
              onClose={closeCard}
              accent={cardAccent}
              peek={56}
              expanded={90}
            >
              <ActionCard
                bundle={cardBundle}
                polygonId={selectedPolygonId}
                overrides={cardOverrides ?? undefined}
                onClose={closeCard}
              />
            </Sheet>
          )}

          {sheet === 'gauge' && activeGauge && (
            <Sheet
              key="gauge"
              open
              side={sheetSide('gauge')}
              backdrop={false}
              ariaLabel={t('gauge.title')}
              onClose={() => {
                setActiveGauge(null);
                if (sheet === 'gauge') setSheet(null);
              }}
              accent={gaugeTone}
              peek={60}
              expanded={92}
            >
              <GaugeDrawer
                gauge={activeGauge}
                onClose={() => {
                  setActiveGauge(null);
                  setSheet(null);
                }}
              />
            </Sheet>
          )}

          {sheet === 'quality' && (
            <Sheet
              key="quality"
              open
              side={sheetSide('quality')}
              backdrop
              ariaLabel={t('ops.freshness.title')}
              onClose={() => setSheet(null)}
              accent="45 212 191"
            >
              <DataQualityPanel
                onClose={() => setSheet(null)}
              />
            </Sheet>
          )}

          {sheet === 'time' && (
            <Sheet
              key="time"
              open
              side="bottom"
              backdrop={false}
              ariaLabel={t('timeline.imagery')}
              onClose={() => setSheet(null)}
              accent="45 212 191"
              peek={34}
              expanded={55}
            >
              <div className="px-3 pb-4 pt-1">
                <TimeScrubber
                  mode="bar"
                  gibsDate={gibsDate}
                  onGibsDate={setGibsDateFor}
                  imergClipped={imergClipped}
                  horizon={horizon}
                  onHorizon={(h) => {
                    setHorizon(h);
                    setPrediction(h, PREDICTION_DATES[timeIndex]);
                  }}
                  timeIndex={timeIndex}
                  onTimeIndex={(i) => {
                    setTimeIndex(i);
                    setPrediction(horizon, PREDICTION_DATES[i]);
                  }}
                  playing={playing}
                  onTogglePlay={() => setPlaying((p) => !p)}
                  forecastAvailable={forecastAvailable}
                />
              </div>
            </Sheet>
          )}

          {sheet === 'more' && (
            <Sheet
              key="more"
              open
              side="bottom"
              backdrop
              ariaLabel={t('nav.more')}
              onClose={() => setSheet(null)}
              accent="129 140 248"
              peek={62}
              expanded={85}
            >
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-5 pt-3">
                {/* State selector */}
                <div>
                  <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-mist-3">
                    {t('ops.card.selectState')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATE_KEYS.map((k) => (
                      <button
                        key={k}
                        onClick={() => {
                          changeState(k);
                          setSheet('card');
                        }}
                        className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                          activeState === k
                            ? 'border-accent/60 bg-accent/12 text-accent'
                            : 'border-line text-mist-2 hover:border-line-strong'
                        }`}
                      >
                        {stateLabels(t)[k]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secondary views */}
                <div>
                  <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-mist-3">
                    {t('ops.rail.title')}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['alerts', 'data_quality'] as const).map((id) => (
                      <button
                        key={id}
                        onClick={() => selectView(id)}
                        className={`rounded-lg border px-3 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
                          view === id
                            ? 'border-accent/60 bg-accent/12 text-accent'
                            : 'border-line text-mist-2 hover:border-line-strong'
                        }`}
                      >
                        {t(`ops.rail.${id}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI stats */}
                {opsMeta && (
                  <div>
                    <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-mist-3">
                      {t('ops.stats.title')}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Kpi label={t('ops.stats.polygons')} value={String(opsMeta.sar.polygon_count)} />
                      <Kpi label={t('ops.stats.area')} value={`${opsMeta.sar.total_area_km2.toLocaleString()} km²`} />
                      <Kpi label={t('ops.stats.affected')} value={`${(opsMeta.sar.total_affected / 1e6).toFixed(1)}M`} />
                      <Kpi label={t('ops.stats.gauges')} value={String(opsMeta.sar.gauge_count)} />
                    </div>
                  </div>
                )}

                {/* Freshness */}
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-mist-3">{t('ops.status.sarPass')}</span>
                    <span className="text-mist-1">{stats.sar}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-mist-3">{t('ops.status.ffwcAge')}</span>
                    <span className="text-mist-1">{stats.ffwc}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-mist-3">{t('ops.status.forecastAge')}</span>
                    <span className="text-mist-1">{stats.fcst}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-mist-3">{t('ops.status.nextPass')}</span>
                    <span className="text-accent2">{stats.next}</span>
                  </div>
                </div>

                <Link
                  href={`/${locale}/operations`}
                  onClick={() => setSheet(null)}
                  className="w-fit font-mono text-[10px] text-mist-3 underline decoration-line-strong underline-offset-4"
                >
                  KALOPATHOR · {t('ops.utc')}
                </Link>
              </div>
            </Sheet>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- helpers

function SheetHead({title, onClose}: {title: string; onClose: () => void}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-2.5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-mist-3">{title}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="close"
        className="rounded-md border border-line p-1.5 text-mist-3 transition-colors hover:text-mist-1"
      >
        <X size={13} aria-hidden />
      </button>
    </div>
  );
}

function StatsChip({label, value}: {label: string; value: string}) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className="font-mono text-[12px] font-bold leading-none text-mist-1">{value}</span>
      <span className="font-mono text-[8px] uppercase tracking-widest text-mist-3">{label}</span>
    </span>
  );
}

function Kpi({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-lg border border-line bg-ink-2/60 px-3 py-2">
      <div className="font-mono text-[15px] font-bold leading-tight text-mist-1">{value}</div>
      <div className="mt-0.5 font-mono text-[8.5px] uppercase tracking-widest text-mist-3">{label}</div>
    </div>
  );
}

const COVERAGE_LABEL: Record<Coverage, string> = {
  global: 'coverage.global',
  national: 'coverage.national',
  pilot: 'coverage.pilot'
};

// Honesty chip per layer: status + color
type HonestyStatus = 'live' | 'seeded' | 'estimate' | 'cached';
const LAYER_HONESTY: Partial<Record<LayerId, HonestyStatus>> = {
  basemap:           'live',
  gfm:               'live',
  mcdwd:             'live',
  imerg:             'live',
  gauges:            'seeded',
  flood:             'seeded',
  prediction:        'estimate',
  uncertainty:       'estimate',
  exposure:          'seeded',
  erosion_banklines: 'cached',
  erosion:           'cached',
  landslide:         'cached',
  tvdi:              'cached',
  hillshade:         'cached',
  rivers:            'cached'
};
const HONESTY_STYLE: Record<HonestyStatus, {dot: string; label: string; text: string}> = {
  live:     {dot: 'bg-accent shadow-[0_0_4px_#2dd4bf]', label: 'LIVE',     text: 'text-accent'},
  seeded:   {dot: 'bg-mist-3',                                label: 'SEEDED',   text: 'text-mist-3'},
  estimate: {dot: 'bg-est shadow-[0_0_4px_#fbbf24]',          label: 'ESTIMATE', text: 'text-est'},
  cached:   {dot: 'bg-[#374151]',                             label: 'CACHED',   text: 'text-mist-3'}
};

function LayerSwitcher({
  visible,
  onToggle,
  gibsDate,
  imergClipped
}: {
  visible: Record<LayerId, boolean>;
  onToggle: (id: LayerId, on: boolean) => void;
  gibsDate: string;
  imergClipped: boolean;
}) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-2">
      {layers.map(({id, coverage, noteKey}) => {
        const honesty = LAYER_HONESTY[id];
        const hs = honesty ? HONESTY_STYLE[honesty] : null;
        return (
          <label key={id} className="flex cursor-pointer items-start gap-2 text-[12px] text-mist-1">
            <input
              type="checkbox"
              checked={visible[id]}
              onChange={(e) => onToggle(id, e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-accent2"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-1">
                <span className="leading-tight">{t(`layers.${id}`)}</span>
                {hs && (
                  <span className={`flex shrink-0 items-center gap-1 font-mono text-[7.5px] uppercase tracking-widest ${hs.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${hs.dot}`} />
                    {hs.label}
                  </span>
                )}
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1">
                <span className="rounded bg-ink-3 px-1 py-px font-mono text-[7.5px] uppercase tracking-widest text-mist-3">
                  {t(COVERAGE_LABEL[coverage])}
                </span>
                {id === 'imerg' && imergClipped && (
                  <span className="rounded bg-est/15 px-1 py-px font-mono text-[7.5px] uppercase tracking-widest text-est">
                    {t('layers.note.capped')}
                  </span>
                )}
                {id === 'prediction' && (
                  <span className="rounded bg-est/10 px-1 py-px font-mono text-[7.5px] uppercase tracking-widest text-est">
                    {t('layers.note.calibPending')}
                  </span>
                )}
              </span>
              {noteKey && noteKey !== 'layers.note.calibPending' && (
                <span className="mt-0.5 block font-mono text-[9px] leading-snug text-est/90">{t(noteKey)}</span>
              )}
            </span>
          </label>
        );
      })}
      <div className="mt-1 border-t border-line pt-1.5 font-mono text-[9px] text-mist-3">
        {t('layers.basemapDate')}: {gibsDate}
      </div>
    </div>
  );
}

function stateLabels(t: (key: string) => string): Record<StateKey, string> {
  return {
    feni: t('ops.card.state.feni'),
    observed_high: t('ops.card.state.observed_high'),
    possible: t('ops.card.state.possible'),
    review_required: t('ops.card.state.review_required'),
    gauge_absent: t('ops.card.state.gauge_absent')
  };
}
