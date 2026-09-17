'use client';

import {
  Map as MapLibreMap,
  NavigationControl,
  RasterTileSource,
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
import {motion} from 'framer-motion';
import {
  GIBS_DATES,
  GIBS_DEFAULT_DATE,
  GIBS_EVENT_DATE,
  TRANSPARENT_PNG,
  clampGibsDate,
  gibsProtocolUrl,
  gibsTileUrl,
  gfmTileUrl,
  GFM_DEFAULT_DATE,
  layers,
  type Coverage,
  type GibsLayer,
  type LayerId
} from '@/lib/map-config';
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
import type {WorkflowItemId} from '@/lib/workflow';
import {humanAge} from '@/lib/freshness';
import type {FreshnessContract} from '@/lib/freshness';
import ActionCard from './ActionCard';
import WorkflowRail from './WorkflowRail';
import WorkflowListPanel from './WorkflowListPanel';
import DataQualityPanel from './DataQualityPanel';
import GaugeDrawer, {type GaugeFeatureProps} from './GaugeDrawer';

const EMPTY_FC: GeoJSON.FeatureCollection = {type: 'FeatureCollection', features: []};
const DARK_BG = '#0a0e17';

// Minimal structural types for the runtime-loaded MapLibre ESM module.


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
    next_pass_est: string;
    source: string;
  };
}

// Which core layers each workflow view activates.
const VIEW_LAYERS: Record<WorkflowItemId, Partial<Record<LayerId, boolean>>> = {
  now_flooding:  {flood: true, gfm: true, prediction: false, exposure: true, erosion: true, erosion_banklines: false, gauges: false, uncertainty: false, landslide: false, tvdi: false},
  next_72h:      {prediction: true, uncertainty: true, flood: true, gfm: false, exposure: false, erosion: false, gauges: false, landslide: false, tvdi: false},
  people_at_risk:{exposure: true, flood: true, gfm: false, prediction: false, erosion: false, gauges: false, landslide: false, tvdi: false},
  routes_shelters:{flood: false, gfm: false, prediction: false, erosion: false, gauges: false},
  gauges:        {gauges: true, flood: false, gfm: false, prediction: false, exposure: false, erosion: false},
  alerts:        {flood: true, gfm: true, prediction: false, exposure: false, erosion: false},
  data_quality:  {flood: true, gfm: false, prediction: false, exposure: false, erosion: false}
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
  rivers:            ['rivers'],
  flood:             ['flood-fill', 'flood-glow'],
  exposure:          ['exposure-fill'],
  erosion:           ['erosion'],
  erosion_banklines: ['erosion-banklines'],
  prediction:        ['prediction'],
  uncertainty:       ['uncertainty'],
  landslide:         ['landslide'],
  tvdi:              ['tvdi'],
  gauges:            ['gauges']
};

function toArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export default function OperationsConsole() {
  const t = useTranslations();
  const locale = useLocale();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);
  const hoveredRef = useRef<number | null>(null);
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

  const loadBundle = useCallback((key: StateKey) => {
    fetch(bundleUrl(key))
      .then((r) => {
        if (!r.ok) throw new Error(`bundle ${r.status}`);
        return r.json();
      })
      .then((b: Bundle) => setCardBundle(b))
      .catch((err) => console.error('ActionCard bundle load failed', err));
  }, []);

  const selectPolygon = useCallback(
    (id: number, overrides?: ActionCardOverrides) => {
      setSelectedPolygonId(id);
      setCardOverrides(overrides ?? null);
      setCardVisible(true);
      setActiveGauge(null);
      loadBundle('feni');
    },
    [loadBundle]
  );

  const changeState = useCallback(
    (key: StateKey) => {
      setActiveState(key);
      setSelectedPolygonId(null);
      setCardOverrides(null);
      setCardVisible(true);
      setActiveGauge(null);
      loadBundle(key);
    },
    [loadBundle]
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
      for (const k of Object.keys(preset) as LayerId[]) setLayerVisible(k, preset[k]!);
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

  const setPrediction = useCallback((horizonId: number, date: string) => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('prediction');
    if (src && 'setTiles' in src) {
      (src as RasterTileSource | undefined)?.setTiles([
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
        (src as RasterTileSource | undefined)?.setTiles([gibsProtocolUrl(l, date)]);
      }
    }
    // Sync GFM date to GIBS scrubber date
    const gfmSrc = map.getSource('gfm');
    if (gfmSrc && 'setTiles' in gfmSrc) {
      (gfmSrc as RasterTileSource | undefined)?.setTiles([`gfm://${date}/{z}/{x}/{y}`]);
    }
  }, []);

  const onPolygonClick = useCallback(
    (props: Record<string, unknown>) => {
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
        badge: BADGES.includes(props.badge as LifecycleBadge)
          ? (props.badge as LifecycleBadge)
          : undefined
      };
      selectPolygon(pid, overrides);
    },
    [selectPolygon]
  );

  // Fetch non-map data.
  useEffect(() => {
    let cancelled = false;
    fetch(bundleUrl('feni'))
      .then((r) => r.json())
      .then((b: Bundle) => {
        if (cancelled) return;
        setCardBundle(b);
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
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    // Load the raw MapLibre ESM build at runtime (webpack's bundled worker
    // placeholder resolves to an unfetchable file:// path, which stalls
    // raster tile decode and the map 'load' event). The import specifier is
    // a variable so webpack leaves it as a browser-side module fetch.
      setWorkerUrl('/lib/maplibre-gl-worker.mjs');

    const protocol = new Protocol();
    addProtocol('pmtiles', protocol.tile);

    // GIBS custom protocol: translate MapLibre WebMercator xyz into the
    // GIBS epsg4326 "250m" grid, carrying layer + date in the URL.
    addProtocol('gibs', async (params: RequestParameters, abortController: AbortController) => {
      try {
        const url = new URL(params.url);
        const layer = url.hostname as GibsLayer;
        const [, date, zs, xs, ys] = url.pathname.split('/');
        const z = Number(zs);
        const x = Number(xs);
        const y = Number(ys);
        const res = await fetch(gibsTileUrl(layer, date, z, x, y), {
          signal: abortController.signal
        });
        if (!res.ok) {
          // Date without coverage: transparent tile so the scrubber survives.
          return {data: toArrayBuffer(TRANSPARENT_PNG)};
        }
        const data = await res.arrayBuffer();
        return {data};
      } catch (err) {
        console.warn('gibs tile error', err);
        return {data: toArrayBuffer(TRANSPARENT_PNG)};
      }
    });

    // Hazard tile bundles (landslide + TVDI) — base64 PNG tiles from JSON
    const hazardBundles: Record<string, Record<string,string>> = {};
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
          {id: 'basemap', type: 'raster', source: 'basemap'},
          {
            id: 'mcdwd',
            type: 'raster',
            source: 'mcdwd',
            layout: {visibility: 'none'},
            paint: {'raster-opacity': 0.75, 'raster-fade-duration': 0}
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
            paint: {'raster-opacity': 0.70, 'raster-fade-duration': 0}
          },
          {
            id: 'hillshade',
            type: 'raster',
            source: 'hillshade',
            paint: {'raster-opacity': 0.35}
          },
          {
            id: 'rivers',
            type: 'line',
            source: 'rivers',
            layout: {'line-join': 'round', 'line-cap': 'round'},
            paint: {
              'line-color': '#3b82f6',
              'line-width': 1.2,
              'line-opacity': 0.7
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
                '#fca5a5',
                '#dc2626'
              ],
              'fill-opacity': [
                'case',
                ['==', ['get', 'badge'], 'monitoring'],
                0.6,
                ['==', ['get', 'badge'], 'analysis'],
                0.45,
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
              'line-opacity': 0.85,
              'line-blur': 2
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
                'match', ['get', 'river'],
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
            paint: {'raster-opacity': 0.45, 'raster-fade-duration': 0,
                    'raster-hue-rotate': 30, 'raster-saturation': -0.3}
          },
          {
            id: 'landslide',
            type: 'raster',
            source: 'landslide',
            layout: {visibility: 'none'},
            paint: {'raster-opacity': 0.55, 'raster-fade-duration': 0,
                    'raster-hue-rotate': -60, 'raster-saturation': 0.4}
          },
          {
            id: 'tvdi',
            type: 'raster',
            source: 'tvdi',
            layout: {visibility: 'none'},
            paint: {'raster-opacity': 0.50, 'raster-fade-duration': 0,
                    'raster-hue-rotate': 60, 'raster-saturation': 0.3}
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
                'danger',
                '#f43f5e',
                'warning',
                '#f59e0b',
                '#2dd4bf'
              ],
              'circle-stroke-color': '#0a0e17',
              'circle-stroke-width': 1.5
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
              'circle-stroke-color': '#0a0e17',
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

    map.addControl(new NavigationControl({showCompass: false}), 'bottom-right');

    // Readiness: MapLibre v6 may keep the 'load' event pending while raster
    // tiles trickle in, so we gate the console UI on the first painted frame
    // (the 'load' event remains as the fast path when it does fire).
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
      if (e.features?.[0]) onPolygonClick(e.features[0].properties);
    });
    map.on('mousemove', 'flood-fill', (e: MapLayerMouseEvent) => {
      const pid = e.features?.[0]?.properties?.polygon_id;
      if (typeof pid === 'number') setHoveredPolygon(pid);
    });
    map.on('mouseleave', 'flood-fill', () => setHoveredPolygon(null));
    map.on('mouseenter', 'flood-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('click', 'gauges', (e: MapLayerMouseEvent) => {
      const p = e.features?.[0]?.properties;
      if (!p) return;
      setActiveGauge(p as unknown as GaugeFeatureProps);
      setCardVisible(false);
      setSelectedPolygonId(null);
    });
    map.on('mouseenter', 'gauges', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'gauges', () => {
      map.getCanvas().style.cursor = '';
    });

    mapRef.current = map;

    return () => {
      removeProtocol('pmtiles');
      removeProtocol('gibs');
      removeProtocol('gfm');
      removeProtocol('hazard');
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, [onPolygonClick, setHoveredPolygon]);

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
  }, [mapReady, applyView]);

  const sarLastPass = opsMeta?.sar.latest_pass ?? freshness?.layers.sar_detection.last_pass;
  const sarNextPass = freshness?.layers.sar_detection.next_pass ?? opsMeta?.sar.next_pass_est;
  const ffwcAsOf = freshness?.layers.ffwc_gauges.last_success;
  const forecastAsOf = freshness?.layers.forecast_openmeteo.run_ts;
  const serverTime = freshness?.server_time ?? new Date().toISOString();

  const stats = useMemo(() => {
    const age = (iso: string | null | undefined) =>
      iso
        ? humanAge(Math.max(0, Math.floor((Date.parse(serverTime) - Date.parse(iso)) / 1000)))
        : '—';
    return {
      sar: sarLastPass ? String(sarLastPass).slice(0, 10) : '—',
      ffwc: age(ffwcAsOf),
      fcst: age(forecastAsOf),
      next: sarNextPass ? `${String(sarNextPass).slice(0, 10)} (${t('ops.freshness.estimated')})` : '—'
    };
  }, [sarLastPass, sarNextPass, ffwcAsOf, forecastAsOf, serverTime, t]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

      {mapReady && (
        <>
          <TopStatusBar
            eventName={opsMeta?.event.name ?? cardBundle?.event.title ?? t('ops.title')}
            stats={stats}
            healthMode={freshness?.mode ?? 'seeded'}
            locale={locale}
            gfmVisible={visible.gfm}
            onGfmToggle={() => setLayerVisible('gfm', !visible.gfm)}
          />
          <StateSelector
            active={activeState}
            onChange={changeState}
            labels={stateLabels(t)}
            selectLabel={t('ops.card.selectState')}
          />
          <WorkflowRail
            active={view}
            onSelect={applyView}
            layersToggle={
              <LayerSwitcher
                visible={visible}
                onToggle={setLayerVisible}
                gibsDate={gibsDate}
                imergClipped={imergClipped}
              />
            }
          />
          {view !== 'data_quality' && (
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
          )}
          <ImageryScrubber
            gibsDate={gibsDate}
            onGibsDate={setGibsDateFor}
            imergClipped={imergClipped}
            horizon={horizon}
            setHorizon={(h) => {
              setHorizon(h);
              setPrediction(h, PREDICTION_DATES[timeIndex]);
            }}
            timeIndex={timeIndex}
            setTimeIndex={(i) => {
              setTimeIndex(i);
              setPrediction(horizon, PREDICTION_DATES[i]);
            }}
          />

          {/* Stats strip */}
          {opsMeta && (
            <div className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 pointer-events-none">
              <div className="flex items-center gap-3 rounded-lg border border-[#1f2937] bg-[#0d1220]/90 px-3 py-1.5 backdrop-blur">
                <StatsChip label={t('ops.stats.polygons')} value={String(opsMeta.sar.polygon_count)} />
                <span className="h-3 w-px bg-[#1f2937]" />
                <StatsChip label={t('ops.stats.area')} value={`21,954 km²`} />
                <span className="h-3 w-px bg-[#1f2937]" />
                <StatsChip label={t('ops.stats.affected')} value={`${(opsMeta.sar.total_affected / 1e6).toFixed(1)}M`} />
                <span className="h-3 w-px bg-[#1f2937]" />
                <StatsChip label={t('ops.stats.gauges')} value="115" />
              </div>
            </div>
          )}

          {view !== 'data_quality' && activeGauge && (
            <div className="absolute bottom-20 right-3 top-[5.25rem] z-10">
              <GaugeDrawer gauge={activeGauge} onClose={() => setActiveGauge(null)} />
            </div>
          )}

          {view !== 'data_quality' && cardVisible && cardBundle && !activeGauge && (
            <div className="absolute bottom-20 right-3 top-[5.25rem] z-10">
              <ActionCard
                bundle={cardBundle}
                polygonId={selectedPolygonId}
                overrides={cardOverrides ?? undefined}
                onClose={() => {
                  setCardVisible(false);
                  setSelectedPolygonId(null);
                  setCardOverrides(null);
                }}
              />
            </div>
          )}

          {view === 'data_quality' && <DataQualityPanel />}

          {view === 'now_flooding' && cardVisible && selectedPolygonId === null && !activeGauge && (
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              transition={{delay: 0.6}}
              className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2"
            >
              <span className="rounded bg-[#111827]/85 px-3 py-1.5 font-mono text-[10px] text-[#9ca3af] backdrop-blur">
                {t('ops.card.clickHint')}
              </span>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

const PREDICTION_DATES = [
  '2024-06-18',
  '2024-06-19',
  '2024-06-20',
  '2024-06-29',
  '2024-06-30',
  '2024-07-01',
  '2024-07-02',
  '2024-07-11',
  '2024-07-13',
  '2024-08-04',
  '2024-08-05',
  '2024-08-14'
];

function stateLabels(
  t: (key: string) => string
): Record<StateKey, string> {
  return {
    feni: t('ops.card.state.feni'),
    observed_high: t('ops.card.state.observed_high'),
    possible: t('ops.card.state.possible'),
    review_required: t('ops.card.state.review_required'),
    gauge_absent: t('ops.card.state.gauge_absent')
  };
}

function StateSelector({
  active,
  onChange,
  labels,
  selectLabel
}: {
  active: StateKey;
  onChange: (k: StateKey) => void;
  labels: Record<StateKey, string>;
  selectLabel: string;
}) {
  return (
    <motion.div
      initial={{y: -12, opacity: 0}}
      animate={{y: 0, opacity: 1}}
      transition={{delay: 0.1}}
      className="absolute left-1/2 top-[4.75rem] z-10 -translate-x-1/2"
    >
      <label className="flex items-center gap-2 rounded-lg border border-[#1f2937] bg-[#111827]/85 px-3 py-1.5 backdrop-blur">
        <span className="font-mono text-[9px] uppercase tracking-widest text-[#9ca3af]">
          {selectLabel}
        </span>
        <select
          value={active}
          onChange={(e) => onChange(e.target.value as StateKey)}
          className="bg-transparent text-[11px] text-[#e5e7eb] outline-none [&>option]:bg-[#111827]"
        >
          {STATE_KEYS.map((k) => (
            <option key={k} value={k}>
              {labels[k]}
            </option>
          ))}
        </select>
      </label>
    </motion.div>
  );
}

function TopStatusBar({
  eventName,
  stats,
  healthMode,
  locale,
  gfmVisible,
  onGfmToggle
}: {
  eventName: string;
  stats: {sar: string; ffwc: string; fcst: string; next: string};
  healthMode: 'seeded' | 'live';
  locale: string;
  gfmVisible: boolean;
  onGfmToggle: () => void;
}) {
  const t = useTranslations();
  const live = healthMode === 'live';
  return (
    <motion.div
      initial={{y: -16, opacity: 0}}
      animate={{y: 0, opacity: 1}}
      className="absolute inset-x-0 top-[2.75rem] z-20 flex items-center gap-2 px-2"
    >
      <div className="flex items-center gap-2 rounded-lg border border-[#2dd4bf]/40 bg-[#0d1220]/90 px-2.5 py-1 backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2dd4bf] shadow-[0_0_8px_#2dd4bf]" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#2dd4bf]">
          {t('ops.status.livePilot')}
        </span>
      </div>
      <div className="hidden min-w-0 flex-1 truncate font-mono text-[10px] text-[#9ca3af] sm:block">
        {eventName}
      </div>
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto rounded-lg border border-[#1f2937] bg-[#0d1220]/90 px-2.5 py-1 backdrop-blur">
        <Stat label={t('ops.status.sarPass')} value={stats.sar} />
        <Stat label={t('ops.status.ffwcAge')} value={stats.ffwc} />
        <Stat label={t('ops.status.forecastAge')} value={stats.fcst} />
        <Stat label={t('ops.status.nextPass')} value={stats.next} />
        <span className="mx-1 h-3 w-px bg-[#1f2937]" />
        <button
          onClick={onGfmToggle}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            gfmVisible
              ? 'border border-[#2dd4bf]/60 bg-[#2dd4bf]/10 text-[#2dd4bf]'
              : 'border border-[#1f2937] text-[#9ca3af] hover:text-[#e5e7eb]'
          }`}
          title="Toggle Copernicus GFM live flood layer"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${gfmVisible ? 'animate-pulse bg-[#2dd4bf]' : 'bg-[#374151]'}`} />
          GFM
        </button>
        <Link
          href={locale === 'bn' ? '/en/operations' : '/bn/operations'}
          className="rounded border border-[#1f2937] px-1.5 py-0.5 font-mono text-[10px] text-[#818cf8] transition-colors hover:border-[#818cf8]/50"
        >
          {locale === 'bn' ? 'EN' : 'বাংলা'}
        </Link>
        <span
          className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest ${
            live ? 'text-[#2dd4bf]' : 'text-[#f59e0b]'
          }`}
          title={live ? t('ops.status.liveHealth') : t('ops.freshness.seededBannerTitle')}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              live
                ? 'bg-[#2dd4bf] shadow-[0_0_6px_#2dd4bf]'
                : 'bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]'
            }`}
          />
          {live ? t('ops.status.healthLive') : t('ops.status.healthDemo')}
        </span>
      </div>
    </motion.div>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <span className="flex items-center gap-1 whitespace-nowrap font-mono text-[10px]">
      <span className="text-[#6b7280]">{label}</span>
      <span className="text-[#e5e7eb]">{value}</span>
    </span>
  );
}

function StatsChip({label, value}: {label: string; value: string}) {
  return (
    <span className="flex flex-col items-center">
      <span className="font-mono text-[11px] font-bold text-[#e5e7eb]">{value}</span>
      <span className="font-mono text-[8px] uppercase tracking-widest text-[#6b7280]">{label}</span>
    </span>
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
  rivers:            'cached',
};
const HONESTY_STYLE: Record<HonestyStatus, {dot: string; label: string; text: string}> = {
  live:     {dot: 'bg-[#2dd4bf] shadow-[0_0_4px_#2dd4bf]', label: 'LIVE',     text: 'text-[#2dd4bf]'},
  seeded:   {dot: 'bg-[#6b7280]',                           label: 'SEEDED',   text: 'text-[#6b7280]'},
  estimate: {dot: 'bg-[#f59e0b] shadow-[0_0_4px_#f59e0b]', label: 'ESTIMATE', text: 'text-[#f59e0b]'},
  cached:   {dot: 'bg-[#374151]',                           label: 'CACHED',   text: 'text-[#4b5563]'},
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
    <div className="flex flex-col gap-1.5">
      {layers.map(({id, coverage, noteKey}) => {
        const honesty = LAYER_HONESTY[id];
        const hs = honesty ? HONESTY_STYLE[honesty] : null;
        return (
          <div key={id} className="flex flex-col gap-0.5">
            <label className="flex cursor-pointer items-start gap-2 text-[12px] text-[#e5e7eb]">
              <input
                type="checkbox"
                checked={visible[id]}
                onChange={(e) => onToggle(id, e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-[#818cf8]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-1">
                  <span className="leading-tight">{t(`layers.${id}`)}</span>
                  {hs && (
                    <span className={`flex items-center gap-0.5 font-mono text-[8px] uppercase tracking-widest ${hs.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${hs.dot}`} />
                      {hs.label}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1">
                  <span className="rounded bg-[#1f2937] px-1 py-px font-mono text-[8px] uppercase tracking-widest text-[#4b5563]">
                    {t(COVERAGE_LABEL[coverage])}
                  </span>
                  {id === 'imerg' && imergClipped && (
                    <span className="rounded bg-[#f59e0b]/15 px-1 py-px font-mono text-[8px] text-[#f59e0b]">
                      {t('layers.note.capped')}
                    </span>
                  )}
                  {id === 'prediction' && (
                    <span className="rounded bg-[#f59e0b]/10 px-1 py-px font-mono text-[8px] text-[#f59e0b]">
                      {t('layers.note.calibPending')}
                    </span>
                  )}
                </span>
                {noteKey && noteKey !== 'layers.note.calibPending' && (
                  <span className="block font-mono text-[9px] text-[#f59e0b]">{t(noteKey)}</span>
                )}
              </span>
            </label>
          </div>
        );
      })}
      <div className="mt-1 border-t border-[#1f2937] pt-1.5 font-mono text-[9px] text-[#6b7280]">
        {t('layers.basemapDate')}: {gibsDate}
      </div>
    </div>
  );
}

function ImageryScrubber({
  gibsDate,
  onGibsDate,
  imergClipped,
  horizon,
  setHorizon,
  timeIndex,
  setTimeIndex
}: {
  gibsDate: string;
  onGibsDate: (d: string) => void;
  imergClipped: boolean;
  horizon: number;
  setHorizon: (h: number) => void;
  timeIndex: number;
  setTimeIndex: (i: number) => void;
}) {
  const t = useTranslations();
  const dateIndex = Math.max(0, GIBS_DATES.indexOf(gibsDate));
  const isEvent = gibsDate === GIBS_EVENT_DATE;

  return (
    <motion.div
      initial={{y: 16, opacity: 0}}
      animate={{y: 0, opacity: 1}}
      transition={{delay: 0.25}}
      className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 px-2 pb-2 sm:px-4 sm:pb-3"
    >
      <div className="flex flex-col gap-2 rounded-lg border border-[#1f2937] bg-[#111827]/85 px-3 py-2.5 backdrop-blur sm:flex-row sm:items-center">
        {/* Imagery date scrubber */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#2dd4bf]">
              {t('timeline.imagery')}
            </span>
            <span className="font-mono text-[11px] text-[#2dd4bf]">
              {gibsDate} · VIIRS
            </span>
            {isEvent && (
              <span className="rounded bg-[#818cf8]/15 px-1.5 py-px font-mono text-[9px] text-[#a5b4fc]">
                {t('timeline.eventPass')}
              </span>
            )}
            {imergClipped && (
              <span className="rounded bg-[#f59e0b]/15 px-1.5 py-px font-mono text-[9px] text-[#f59e0b]">
                {t('layers.note.capped')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-[#6b7280]">{GIBS_DATES[0]}</span>
            <input
              type="range"
              min={0}
              max={GIBS_DATES.length - 1}
              value={dateIndex}
              onChange={(e) => onGibsDate(GIBS_DATES[Number(e.target.value)])}
              className="flex-1 accent-[#2dd4bf]"
              aria-label={t('timeline.imagery')}
            />
            <span className="font-mono text-[9px] text-[#6b7280]">
              {GIBS_DATES[GIBS_DATES.length - 1]}
            </span>
            <button
              type="button"
              onClick={() => onGibsDate(isEvent ? GIBS_DEFAULT_DATE : GIBS_EVENT_DATE)}
              className={`whitespace-nowrap rounded px-2 py-0.5 font-mono text-[9px] transition-colors ${
                isEvent
                  ? 'bg-[#2dd4bf] text-[#0a0e17]'
                  : 'bg-[#1f2937] text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              {t('timeline.eventPass')}
            </button>
          </div>
        </div>

        {/* Forecast horizon + prediction date */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#f59e0b]">
              {t('timeline.forecast7d')}
            </span>
            <div className="flex gap-1">
              {[1, 3, 5, 7].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`rounded px-2 py-0.5 font-mono text-[11px] transition-colors ${
                    horizon === h
                      ? 'bg-[#f59e0b] text-[#0a0e17]'
                      : 'bg-[#1f2937] text-[#9ca3af] hover:text-[#e5e7eb]'
                  }`}
                >
                  T+{h}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={PREDICTION_DATES.length - 1}
              value={timeIndex}
              onChange={(e) => setTimeIndex(Number(e.target.value))}
              className="flex-1 accent-[#f59e0b]"
              aria-label={t('timeline.forecast7d')}
            />
            <span className="font-mono text-[11px] text-[#f59e0b]">
              {PREDICTION_DATES[timeIndex]}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Re-export for external use if needed
export {PREDICTION_DATES};