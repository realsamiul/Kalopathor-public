export type LayerId =
  | 'hillshade'
  | 'rivers'
  | 'flood'
  | 'erosion'
  | 'prediction';

export const layers: {id: LayerId}[] = [
  {id: 'hillshade'},
  {id: 'rivers'},
  {id: 'flood'},
  {id: 'erosion'},
  {id: 'prediction'}
];

// Recent date with confirmed VIIRS TrueColor coverage over Bangladesh.
export const GIBS_DATE = '2026-08-10';

const GIBS_BASE =
  'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default';

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
  date: string,
  z: number,
  x: number,
  y: number
): string {
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

  return `${GIBS_BASE}/${date}/250m/${level}/${row}/${col}.jpg`;
}