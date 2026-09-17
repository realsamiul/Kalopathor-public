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
  | 'prediction'
  | 'gauges';

export type Coverage = 'global' | 'pilot' | 'national';

export interface LayerDef {
  id: LayerId;
  coverage: Coverage;
  // e.g. "optical/cloud-limited" gap-filler layers
  noteKey?: string;
}

export const layers: LayerDef[] = [
  {id: 'basemap', coverage: 'global'},
  {id: 'mcdwd', coverage: 'global', noteKey: 'layers.note.gapFiller'},
  {id: 'imerg', coverage: 'global', noteKey: 'layers.note.gapFiller'},
  {id: 'gfm', coverage: 'global', noteKey: 'layers.note.live'},
  {id: 'hillshade', coverage: 'pilot'},
  {id: 'rivers', coverage: 'national'},
  {id: 'flood', coverage: 'national'},
  {id: 'exposure', coverage: 'national'},
  {id: 'erosion', coverage: 'pilot'},
  {id: 'prediction', coverage: 'national'},
  {id: 'gauges', coverage: 'national'}
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
export const GIBS_DEFAULT_DATE = '2026-08-30';
// SAR pass date of the national detection set (quick-jump target).
export const GIBS_EVENT_DATE = '2024-08-12';

// Scrubber window: [START .. END], step 1 day. Default = GIBS_DEFAULT_DATE.
export const GIBS_DATE_START = '2026-08-01';
export const GIBS_DATE_END = '2026-08-31';

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

// epsg4326 "250m" matrix dimensions per level (cols, rows)
const DIMS: Record<number, [number, number]> = {
  0: [2, 1],
  1: [3, 2],
  2: [5, 3],
  3: [10, 5],
  4: [20, 10],
  5: [40, 20],
  6: [80, 40],
  7: [160, 80],
  8: [320, 160]
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
  // GIBS epsg4326 tiles at level L cover roughly twice the ground of a
  // WebMercator tile at zoom z -> use level = clamp(z-1, 1..8).
  const level = Math.min(8, Math.max(1, z - 1));
  const [cols, rows] = DIMS[level];

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

  return `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/${product}/default/${effective}/250m/${level}/${row}/${col}.${ext}`;
}

// 1x1 transparent PNG used when a GIBS tile 404s so the scrubber never breaks.
export const TRANSPARENT_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export function gibsProtocolUrl(layer: GibsLayer, date: string): string {
  return `gibs://${layer}/${date}/{z}/{x}/{y}`;
}

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