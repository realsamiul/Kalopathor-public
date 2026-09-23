export type LayerId =
  | 'basemap'
  | 'mcdwd'
  | 'imerg'
  | 'gfm'
  | 'hillshade'
  | 'rivers'
  | 'flood'
  | 'exposure'
  | 'erosion'
  | 'erosion_banklines'
  | 'prediction'
  | 'uncertainty'
  | 'landslide'
  | 'tvdi'
  | 'gauges';

export type Coverage = 'global' | 'pilot' | 'national';

export type LayerGroup = 'satellite' | 'flood' | 'reference';

export interface LayerDef {
  id: LayerId;
  coverage: Coverage;
  group: LayerGroup;
  // e.g. "optical/cloud-limited" gap-filler layers
  noteKey?: string;
}

export const layers: LayerDef[] = [
  // Satellite
  {id: 'basemap',           coverage: 'global',   group: 'satellite'},
  {id: 'mcdwd',             coverage: 'global',   group: 'satellite', noteKey: 'layers.note.gapFiller'},
  {id: 'imerg',             coverage: 'global',   group: 'satellite', noteKey: 'layers.note.gapFiller'},
  {id: 'gfm',               coverage: 'global',   group: 'satellite', noteKey: 'layers.note.live'},
  // Flood & exposure
  {id: 'flood',             coverage: 'national', group: 'flood'},
  {id: 'exposure',          coverage: 'national', group: 'flood'},
  {id: 'prediction',        coverage: 'national', group: 'flood'},
  {id: 'uncertainty',       coverage: 'national', group: 'flood',     noteKey: 'layers.note.calibPending'},
  {id: 'erosion',           coverage: 'pilot',    group: 'flood'},
  {id: 'erosion_banklines', coverage: 'national', group: 'flood',     noteKey: 'layers.note.banklines'},
  // Reference
  {id: 'hillshade',         coverage: 'pilot',    group: 'reference'},
  {id: 'rivers',            coverage: 'national', group: 'reference'},
  {id: 'gauges',            coverage: 'national', group: 'reference'},
  {id: 'landslide',         coverage: 'national', group: 'reference', noteKey: 'layers.note.cached'},
  {id: 'tvdi',              coverage: 'national', group: 'reference', noteKey: 'layers.note.cached'},
];

// ---------------------------------------------------------------------------
// GIBS (NASA GIBS / EOSDIS) basemap + gap-filler layers.
// epsg4326 "250m" geographic grid; MapLibre requests WebMercator xyz, which the
// `gibs://` protocol translates to the nearest GIBS epsg4326 tile.
// ---------------------------------------------------------------------------

export type GibsLayer = 'basemap' | 'mcdwd' | 'imerg';

export const GIBS_LAYERS: Record<
  GibsLayer,
  {product: string; ext: 'jpg' | 'png'; maxDate: string | null}
> = {
  basemap: {
    product: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    ext: 'jpg',
    maxDate: null
  },
  // MCDWD = MODIS Combined Drought & Water index daily flood detection.
  // Palette: grey=no-water, red=flood, cyan=uncertain (GIBS native).
  mcdwd: {
    product: 'MODIS_Combined_Flood_2-Day',
    ext: 'png',
    maxDate: null
  },
  // IMERG Early (GIBS publish is capped 2025-10-22; later dates have no tiles).
  imerg: {
    product: 'IMERG_Precipitation_Rate',
    ext: 'png',
    maxDate: '2025-10-22'
  }
};

// Most recent date verified to have VIIRS TrueColor over Bangladesh.
export const GIBS_DEFAULT_DATE = '2026-09-22';
// SAR pass date of the national detection set (quick-jump target).
export const GIBS_EVENT_DATE = '2024-08-12';
// Haor and Jamuna events
export const GIBS_HAOR_DATE  = '2022-06-15';
export const GIBS_JAMUNA_DATE = '2022-06-16';

// Scrubber window: [START .. END], step 1 day.
export const GIBS_DATE_START = '2024-06-01';
export const GIBS_DATE_END   = '2026-09-22';

export function clampGibsDate(layer: GibsLayer, date: string): string {
  const cap = GIBS_LAYERS[layer].maxDate;
  if (!cap) return date;
  return date > cap ? cap : date;
}

export function gibsDatesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (cur <= last) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export const GIBS_DATES = gibsDatesBetween(GIBS_DATE_START, GIBS_DATE_END);

// Layer-specific tile matrix sets
// VIIRS basemap uses native WebMercator; MCDWD uses "250m" epsg4326 grid; IMERG uses "2km" grid
type TileMatrix = '250m' | '2km';
const LAYER_MATRIX: Record<GibsLayer, TileMatrix> = {
  basemap: '250m',
  mcdwd:   '250m',
  imerg:   '2km',
};

// epsg4326 "250m" matrix dimensions per level (cols, rows)
const DIMS_250m: Record<number, [number, number]> = {
  0: [2, 1],   1: [3, 2],   2: [5, 3],   3: [10, 5],
  4: [20, 10], 5: [40, 20], 6: [80, 40], 7: [160, 80], 8: [320, 160]
};
// epsg4326 "2km" matrix dimensions per level
const DIMS_2km: Record<number, [number, number]> = {
  0: [1, 1], 1: [2, 1], 2: [3, 2], 3: [5, 3],
  4: [10, 5], 5: [20, 10], 6: [40, 20], 7: [80, 40]
};

export function gibsTileUrl(
  layer: GibsLayer,
  date: string,
  z: number,
  x: number,
  y: number
): string {
  const {product, ext} = GIBS_LAYERS[layer];
  const effective = clampGibsDate(layer, date);

  // Basemap VIIRS TrueColor uses native EPSG:3857 WebMercator
  if (layer === 'basemap') {
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${product}/default/${effective}/GoogleMapsCompatible_Level9/${z}/${y}/${x}.${ext}`;
  }

  const matrix = LAYER_MATRIX[layer];
  const DIMS = matrix === '2km' ? DIMS_2km : DIMS_250m;
  const maxLevel = matrix === '2km' ? 7 : 8;
  const level = Math.min(maxLevel, Math.max(1, z - 1));
  const [cols, rows] = DIMS[level] ?? DIMS[1];

  const n = Math.pow(2, z);
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const north = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const south =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;

  const lonCenter = (west + east) / 2;
  const latCenter = (south + north) / 2;
  const col = Math.floor(((lonCenter + 180) / 360) * cols);
  const row = Math.floor(((90 - latCenter) / 180) * rows);

  return `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/${product}/default/${effective}/${matrix}/${level}/${row}/${col}.${ext}`;
}

// 1x1 transparent PNG used when a GIBS tile 404s so the scrubber never breaks.
export const TRANSPARENT_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export function gibsProtocolUrl(layer: GibsLayer, date: string): string {
  return `gibs://${layer}/${date}/{z}/{x}/{y}`;
}

// Shared basemap grade — vivid, crisp satellite reality with natural contrast
export const BASEMAP_RASTER_PAINT = {
  'raster-saturation': 0.1,
  'raster-contrast': 0.08,
  'raster-fade-duration': 200
} as const;

// ---------------------------------------------------------------------------
// GFM — Copernicus Global Flood Monitoring (Sentinel-1 SAR, ~20 m, daily)
// No auth required. WMS-T with TIME parameter.
// Verified live: HTTP 200 from geoserver.gfm.eodc.eu
// ---------------------------------------------------------------------------
export const GFM_WMS_BASE = 'https://geoserver.gfm.eodc.eu/geoserver/gfm/wms';

/** Build a GFM WMS tile URL for a given date and WebMercator {z}/{x}/{y}. */
export function gfmTileUrl(date: string, z: number, x: number, y: number): string {
  const n = Math.pow(2, z);
  const west  = (x / n) * 360 - 180;
  const east  = ((x + 1) / n) * 360 - 180;
  const north = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const south = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  const size  = 256;
  // GFM accepts EPSG:4326 bounding boxes
  return (
    `${GFM_WMS_BASE}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap` +
    `&LAYERS=observed_flood_extent&STYLES=` +
    `&CRS=EPSG:4326&BBOX=${south},${west},${north},${east}` +
    `&WIDTH=${size}&HEIGHT=${size}` +
    `&TIME=${date}&FORMAT=image/png&TRANSPARENT=TRUE`
  );
}

/** Most recent date to default GFM to (known event with flood pixels over BD). */
export const GFM_DEFAULT_DATE = '2024-08-21';

// ---------------------------------------------------------------------------
// Data-file / PMTiles URL helpers.
// The heavy *.pmtiles archives are deliberately NOT committed to this repo
// (.gitignore) — they live on the data machine. For GitHub-import deploys the
// app runs same-origin and simply degrades honestly when a bundle 404s
// (forecast chips/hillshade/flood-vector features hide or render empty).
// To serve the full tile set from any static host/CDN, set NEXT_PUBLIC_TILES_BASE
// (e.g. https://tiles.example.com) in the Vercel project env BEFORE building.
// ---------------------------------------------------------------------------
const TILES_BASE = (process.env.NEXT_PUBLIC_TILES_BASE ?? '').replace(/\/+$/, '');

/** Public URL for a served data file, honoring the optional tiles base. */
export function dataFileUrl(path: string): string {
  return `${TILES_BASE}${path}`;
}

/** PMTiles protocol URL for a served .pmtiles archive. */
export function pmtilesUrl(path: string): string {
  return `pmtiles://${TILES_BASE}${path}`;
}