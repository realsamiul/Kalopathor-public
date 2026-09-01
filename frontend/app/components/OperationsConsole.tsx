'use client';

import {
  Map as MapLibreMap,
  NavigationControl,
  RasterTileSource,
  addProtocol,
  removeProtocol,
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type RequestParameters
} from 'maplibre-gl';
import {Protocol} from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import {useTranslations} from 'next-intl';
import {useCallback, useEffect, useRef, useState} from 'react';
import {motion} from 'framer-motion';
import {
  GIBS_DATE,
  gibsTileUrl,
  layers,
  type LayerId
} from '@/lib/map-config';
import {
  STATE_KEYS,
  bundleUrl,
  buildFloodGeoJSON,
  gaugeGeoJSON,
  routeGeoJSON,
  shelterGeoJSON,
  type Bundle,
  type StateKey
} from '@/lib/bundle';
import type {WorkflowItemId} from '@/lib/workflow';
import ActionCard from './ActionCard';
import WorkflowRail from './WorkflowRail';
import WorkflowListPanel from './WorkflowListPanel';
import DataQualityPanel from './DataQualityPanel';

const EMPTY_FC: GeoJSON.FeatureCollection = {type: 'FeatureCollection', features: []};

const DARK_BG = '#0a0e17';

// Which core layers each workflow view activates (user can override via the
// collapsible layer toggles afterwards).
const VIEW_LAYERS: Record<WorkflowItemId, Partial<Record<LayerId, boolean>>> = {
  now_flooding: {flood: true, prediction: false, erosion: false},
  next_72h: {prediction: true, flood: false, erosion: false},
  people_at_risk: {flood: true, prediction: false, erosion: false},
  routes_shelters: {flood: false, prediction: false, erosion: false},
  gauges: {flood: false, prediction: false, erosion: false},
  alerts: {flood: true, prediction: false, erosion: false},
  data_quality: {flood: true, prediction: false, erosion: false}
};

export default function OperationsConsole() {
  const t = useTranslations();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hoveredRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [visible, setVisible] = useState<Record<LayerId, boolean>>({
    hillshade: true,
    rivers: true,
    flood: true,
    erosion: true,
    prediction: true
  });
  const [timeIndex, setTimeIndex] = useState(0);
  const [horizon, setHorizon] = useState(5);
  const [cardBundle, setCardBundle] = useState<Bundle | null>(null);
  const [activeState, setActiveState] = useState<StateKey>('feni');
  const [selectedPolygonId, setSelectedPolygonId] = useState<number | null>(null);
  const [cardVisible, setCardVisible] = useState(true);
  const [view, setView] = useState<WorkflowItemId>('now_flooding');
  const [hoveredPolygonId, setHoveredPolygonId] = useState<number | null>(null);

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
    (id: number) => {
      setSelectedPolygonId(id);
      setCardVisible(true);
      setActiveState('feni');
      loadBundle('feni');
    },
    [loadBundle]
  );

  const changeState = useCallback(
    (key: StateKey) => {
      setActiveState(key);
      setSelectedPolygonId(null);
      setCardVisible(true);
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

  const focusAt = useCallback((lat: number, lon: number) => {
    mapRef.current?.flyTo({center: [lon, lat], zoom: 10, duration: 900});
  }, []);

  const setLayerVisible = useCallback((id: LayerId, on: boolean) => {
    setVisible((v) => ({...v, [id]: on}));
    const map = mapRef.current;
    if (!map) return;
    const LAYER_IDS: Record<LayerId, string[]> = {
      hillshade: ['hillshade'],
      rivers: ['rivers'],
      flood: ['flood-fill', 'flood-glow'],
      erosion: ['erosion'],
      prediction: ['prediction']
    };
    for (const l of LAYER_IDS[id]) {
      if (map.getLayer(l)) map.setLayoutProperty(l, 'visibility', on ? 'visible' : 'none');
    }
  }, []);

  const applyView = useCallback(
    (id: WorkflowItemId) => {
      setView(id);
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
      (src as RasterTileSource).setTiles([
        `pmtiles:///data/pmtiles/prediction_t${horizonId}_${date}.pmtiles/{z}/{x}/{y}`
      ]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(bundleUrl('feni'))
      .then((r) => r.json())
      .then((b: Bundle) => {
        if (cancelled) return;
        setCardBundle(b);
      })
      .catch((err) => console.error('Feni bundle load failed', err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    const protocol = new Protocol();
    addProtocol('pmtiles', protocol.tile);

    // GIBS custom protocol: MapLibre requests WebMercator xyz; we translate
    // to the GIBS epsg4326 "250m" geographic grid which has full coverage.
    addProtocol('gibs', async (params: RequestParameters, abortController) => {
      const url = new URL(params.url);
      const [, zs, xs, ys] = url.pathname.split('/');
      const z = Number(zs);
      const x = Number(xs);
      const y = Number(ys);
      const res = await fetch(gibsTileUrl(GIBS_DATE, z, x, y), {
        signal: abortController.signal
      });
      if (!res.ok) throw new Error(`GIBS ${res.status}`);
      const data = await res.arrayBuffer();
      return {data};
    });

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: ['gibs://tiles/{z}/{x}/{y}'],
            tileSize: 512,
            minzoom: 0,
            maxzoom: 9
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
            data: EMPTY_FC
          },
          erosion: {
            type: 'geojson',
            data: '/data/erosion_layer.geojson'
          },
          prediction: {
            type: 'raster',
            tiles: ['pmtiles:///data/pmtiles/prediction_t5_2024-06-18.pmtiles/{z}/{x}/{y}'],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 7
          },
          gauges: {
            type: 'geojson',
            data: EMPTY_FC
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
            id: 'flood-fill',
            type: 'fill',
            source: 'flood',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hovered'], false],
                '#f87171',
                '#dc2626'
              ],
              'fill-opacity': 0.55
            }
          },
          {
            id: 'flood-glow',
            type: 'line',
            source: 'flood',
            paint: {
              'line-color': '#ef4444',
              'line-width': 2,
              'line-opacity': 0.9,
              'line-blur': 3
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
            id: 'prediction',
            type: 'raster',
            source: 'prediction',
            paint: {
              'raster-opacity': 0.5,
              'raster-fade-duration': 0
            }
          },
          {
            id: 'gauges',
            type: 'circle',
            source: 'gauges',
            layout: {visibility: 'none'},
            paint: {
              'circle-radius': 5,
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
              'circle-stroke-width': 1
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
      zoom: 6.5,
      minZoom: 1,
      maxZoom: 12,
      attributionControl: {
        compact: true,
        customAttribution: 'GIBS/NASA · Kalopathor'
      }
    });

    // 2D WebMercator is the operations default; the globe stays on the
    // landing page only.
    map.setProjection({type: 'mercator'});
    map.addControl(new NavigationControl({showCompass: false}), 'bottom-right');
    map.on('load', () => {
      setMapReady(true);
      map.on('click', 'flood-fill', (e: MapLayerMouseEvent) => {
        const pid = e.features?.[0]?.properties?.polygon_id;
        if (typeof pid === 'number') selectPolygon(pid);
      });
      map.on('mousemove', 'flood-fill', (e: MapLayerMouseEvent) => {
        const pid = e.features?.[0]?.properties?.polygon_id;
        if (typeof pid === 'number') setHoveredPolygon(pid);
      });
      map.on('mouseleave', 'flood-fill', () => setHoveredPolygon(null));
      map.on('mouseenter', 'flood-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
    });

    mapRef.current = map;
    return () => {
      removeProtocol('pmtiles');
      removeProtocol('gibs');
      map.remove();
      mapRef.current = null;
    };
  }, [selectPolygon, setHoveredPolygon]);

  // Keep bundle-derived sources in sync with the selected state bundle.
  useEffect(() => {
    if (!mapReady || !cardBundle) return;
    const map = mapRef.current;
    if (!map) return;
    (map.getSource('flood') as GeoJSONSource | undefined)?.setData(
      buildFloodGeoJSON(cardBundle) as GeoJSON.FeatureCollection
    );
    (map.getSource('gauges') as GeoJSONSource | undefined)?.setData(gaugeGeoJSON(cardBundle));
    (map.getSource('shelters') as GeoJSONSource | undefined)?.setData(
      shelterGeoJSON(cardBundle)
    );
    (map.getSource('routes') as GeoJSONSource | undefined)?.setData(routeGeoJSON(cardBundle));
  }, [mapReady, cardBundle]);

  // Apply the default view's layer preset once the map is up.
  useEffect(() => {
    if (mapReady) applyView('now_flooding');
  }, [mapReady, applyView]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="absolute inset-0" />

      {mapReady && (
        <>
          <TopStatusBar />
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
                labels={{
                  hillshade: t('layers.hillshade'),
                  rivers: t('layers.rivers'),
                  flood: t('layers.flood'),
                  erosion: t('layers.erosion'),
                  prediction: t('layers.prediction')
                }}
              />
            }
          />
          {view !== 'data_quality' && (
            <WorkflowListPanel
              view={view}
              bundle={cardBundle}
              hoveredPolygonId={hoveredPolygonId}
              onHoverPolygon={setHoveredPolygon}
              onSelectPolygon={selectPolygon}
              onFocus={focusAt}
            />
          )}
          <TimeSlider
            horizon={horizon}
            setHorizon={setHorizon}
            timeIndex={timeIndex}
            setTimeIndex={(i) => {
              setTimeIndex(i);
              const date = PREDICTION_DATES[i];
              setPrediction(horizon, date);
            }}
            labels={{
              now: t('timeline.now'),
              past: t('timeline.past30d'),
              forecast: t('timeline.forecast7d'),
              horizon: t('timeline.horizon')
            }}
          />

          {view !== 'data_quality' && cardVisible && cardBundle && (
            <div className="absolute bottom-20 right-3 top-14 z-10">
              <ActionCard
                bundle={cardBundle}
                polygonId={selectedPolygonId}
                onClose={() => {
                  setCardVisible(false);
                  setSelectedPolygonId(null);
                }}
              />
            </div>
          )}

          {view === 'data_quality' && <DataQualityPanel />}

          {view === 'now_flooding' && cardVisible && selectedPolygonId === null && (
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
      className="absolute left-1/2 top-12 z-10 -translate-x-1/2"
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

function TopStatusBar() {
  const t = useTranslations();
  return (
    <motion.div
      initial={{y: -16, opacity: 0}}
      animate={{y: 0, opacity: 1}}
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2"
    >
      <div className="flex items-center gap-2 rounded-lg bg-[#111827]/85 px-3 py-1.5 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-[#2dd4bf] shadow-[0_0_8px_#2dd4bf]" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#e5e7eb]">
          {t('ops.systemNominal')}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-[#111827]/85 px-3 py-1.5 backdrop-blur">
        <span className="font-mono text-[11px] text-[#9ca3af]">
          {t('ops.nextPass')}
        </span>
        <span className="font-mono text-[11px] text-[#818cf8]">2026-08-31 07:12Z</span>
      </div>
    </motion.div>
  );
}

function LayerSwitcher({
  visible,
  onToggle,
  labels
}: {
  visible: Record<LayerId, boolean>;
  onToggle: (id: LayerId, on: boolean) => void;
  labels: Record<LayerId, string>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {layers.map(({id}) => (
        <label
          key={id}
          className="flex cursor-pointer items-center gap-2 text-[12px] text-[#e5e7eb]"
        >
          <input
            type="checkbox"
            checked={visible[id]}
            onChange={(e) => onToggle(id, e.target.checked)}
            className="h-3.5 w-3.5 accent-[#818cf8]"
          />
          <span className={labels[id].length > 8 ? 'bn' : ''}>{labels[id]}</span>
        </label>
      ))}
    </div>
  );
}

function TimeSlider({
  horizon,
  setHorizon,
  timeIndex,
  setTimeIndex,
  labels
}: {
  horizon: number;
  setHorizon: (h: number) => void;
  timeIndex: number;
  setTimeIndex: (i: number) => void;
  labels: {now: string; past: string; forecast: string; horizon: string};
}) {
  return (
    <motion.div
      initial={{y: 16, opacity: 0}}
      animate={{y: 0, opacity: 1}}
      transition={{delay: 0.25}}
      className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-4 pb-3"
    >
      <div className="flex items-center gap-3 rounded-lg border border-[#1f2937] bg-[#111827]/85 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">
            {labels.horizon}
          </span>
          <div className="flex gap-1">
            {[1, 3, 5, 7].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`rounded px-2 py-0.5 font-mono text-[11px] transition-colors ${
                  horizon === h
                    ? 'bg-[#818cf8] text-[#0a0e17]'
                    : 'bg-[#1f2937] text-[#9ca3af] hover:text-[#e5e7eb]'
                }`}
              >
                T+{h}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3">
          <span className="font-mono text-[10px] text-[#9ca3af]">{labels.past}</span>
          <input
            type="range"
            min={0}
            max={PREDICTION_DATES.length - 1}
            value={timeIndex}
            onChange={(e) => setTimeIndex(Number(e.target.value))}
            className="flex-1 accent-[#818cf8]"
          />
          <span className="font-mono text-[10px] text-[#9ca3af]">{labels.now}</span>
        </div>
        <div className="font-mono text-[11px] text-[#2dd4bf]">
          {PREDICTION_DATES[timeIndex]}
        </div>
      </div>
    </motion.div>
  );
}

// Re-export for external use if needed
export {PREDICTION_DATES};