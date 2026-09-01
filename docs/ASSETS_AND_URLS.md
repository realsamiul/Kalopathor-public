# KALOPATHOR — Assets & URLs (import + delivery reference)

Everything a surface needs to load, where it comes from, its size/format, and the exact
commands to make it public. Verified 2026-09-01 (live HTTP/S3 checks).

## 1. GIBS WMTS — public, no key (NASA)

Base endpoint: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{Layer}/default/{TIME}/{TileMatrixSet}/{z}/{y}/{x}.{ext}`

- `TIME` token = **`YYYY-MM-DD`** (day resolution). There is **no "latest" auto-token** —
  the app must pick a date (VIIRS → yesterday) and bake it into the URL.
- `TileMatrixSet`: epsg4326 uses **`250m`** (TrueColor, ~z0-9), **`2km`** (IMERG ~z6). epsg3857 uses **`GoogleMapsCompatible_Level9`**.
- REST only for epsg4326 250m + epsg3857; both **HTTP 200 verified**.

### Verified-working URL patterns

| Asset | URL pattern (verified 200) |
|---|---|
| **TrueColor epsg4326** | `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/2026-08-10/250m/{z}/{y}/{x}.jpg` |
| **TrueColor epsg3857** | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/2026-08-10/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg` |
| **IMERG Precipitation Rate** | `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/IMERG_Precipitation_Rate/default/2026-08-05/2km/{z}/{y}/{x}.png` |
| MODIS TrueColor (alternate) | `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{TIME}/250m/{z}/{y}/{x}.jpg` |

**MCDWD / VCDWD (NASA LANCE flood detection):** NOT exposed as ready WMTS layers under
`MCDWD_Surface_Water` / `VCDWD_Surface_Water` (returned 404 at verify time). The products
ship as HDF/GeoTIFF tiles from LANCE NRT servers:
- MODIS: `https://nrt3.modaps.eosdis.nasa.gov/archive/allData/61/MCDWD_L3_NRT` (DOI 10.5067/MODIS/MCDWD_L3_NRT.061, 250m, 10x10° tiles, 1/2/3-day composites + F1/F2/F3 GeoTIFFs)
- VIIRS: `https://nrt3.modaps.eosdis.nasa.gov/archive/allData/5200/VCDWD_L3_NRT` (DOI 10.5067/VIIRS/VCDWD_L3_NRT.002, daily; `VCDWDG` hourly)
- **Needs a free Earthdata login** (`urs.earthdata.nasa.gov`); 1-day latencies. GIBS
  availability API is the wire-in path for the date scrubber — **not yet wired** (only
  VIIRS + IMERG verified in `gibs.js`).
- File list API: `https://nrt3.modaps.eosdis.nasa.gov/api/v2/content/details?products=MCDWD_L3_NRT&archiveSets=61&temporalRanges={YYYY-DOY}`

**GIBS quirks (from FRONTEND_INTELLIGENCE_PIPELINE.md):**
- TrueColor maxzoom **9** (~250 m) · IMERG maxzoom **6** (~10 km).
- **IMERG ~5-day latency** — UI must grey out rainfall for dates < 5 days back.
- Verification command: `curl -s -o /dev/null -w "%{http_code}" "<url>"` (expect 200).
- Capabilities: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml`

---

## 2. GCS assets — bucket NOT public (monarqlabs-gemini-workspace)

Bucket: `gs://monarqlabs-gemini-workspace`  (project `project-300d4e0e-5c73-49bf-b8a`)

| Asset | Local source | Size | Format | Notes |
|---|---|---|---|---|
| Hillshade | `frontend_assets/hillshade_bgd.tif` | **30.8 MiB (32 MB)** | GeoTIFF, **DEFLATE COG** (internal overviews 2969x3786→186x237) | 5938×7571, ~90 m MERIT grid, EPSG:4326 |
| Hillshade (RGB) | `frontend_assets/hillshade_bgd_rgb.tif` | 31.9 MiB | GeoTIFF DEFLATE | pre-rendered RGB variant |
| Hillshade (PMTiles) | `frontend_assets/hillshade_bgd.pmtiles` | **824 MB** ⚠️ | PMTiles | **overbuilt** — see reformat §3 |
| Hillshade (repo, cut) | `frontend/public/data/hillshade_bgd.pmtiles` | 19.6 MB | PMTiles | downsampled subset already committed |
| Earth texture (dark) | `frontend_assets/earth-dark.jpg` | 92.6 KiB | JPEG | globe fallback basemap |
| Earth texture (blue marble) | `frontend_assets/earth-blue-marble.jpg` | 1.4 MiB | JPEG | globe basemap |
| Earth texture (night) | `frontend_assets/earth-night.jpg` | 884 KiB | JPEG | night variant |
| Earth topology | `frontend_assets/earth-topology.png` | 372 KiB | PNG | topology shading |
| Rivers | `frontend_assets/rivers_bgd.geojson` | 6.4 MiB | GeoJSON | centerlines |
| Prediction tiles | `frontend/public/data/pmtiles/` (51 files) | 7.9 MiB | PMTiles (PNG) | temporal flood tiles + manifest |
| Erosion layer | `frontend/public/data/erosion_layer.geojson` | 1.9 MiB | GeoJSON | 3,003 features |
| Fonts | `frontend_assets/fonts/` | 784 KiB | woff2/ttf | Inter, Noto Sans Bengali, JetBrains Mono |
| Flood polygons | `frontend/public/data/detection_polygons.geojson` | 12.4 MiB | GeoJSON | demo slice |
| Replay bundle | `frontend/public/data/feni_2024_replay.json` | 374 KiB | JSON | sample incident |

### The exact command to make a public assets prefix + resulting URLs

**Never make the whole bucket public.** Publish only `gs://monarqlabs-gemini-workspace/kalopathor/assets/`:

```bash
# 1. Upload (from the repo, matching this prefix)
gcloud storage cp -r \
  gs://...  # not used — upload from local:
# (equivalents)
gsutil cp -r frontend_assets/ gs://monarqlabs-gemini-workspace/kalopathor/assets/
gsutil cp -r frontend/public/data/earth-dark.jpg \
               frontend/public/data/hillshade_bgd.pmtiles \
               frontend/public/data/pmtiles/ \
           gs://monarqlabs-gemini-workspace/kalopathor/assets/

# 2. Make that prefix publicly readable (uniform bucket-level ACL):
gcloud storage buckets add-iam-policy-binding gs://monarqlabs-gemini-workspace \
  --member=allUsers --role=roles/storage.objectViewer \
  --condition="expression=resource.name.startsWith('projects/_/buckets/monarqlabs-gemini-workspace/objects/kalopathor/assets/')"
```

> Note: if the bucket uses fine-grained ACLs (legacy) instead of uniform IAM, use:
> `gsutil acl ch -u AllUsers:R gs://monarqlabs-gemini-workspace/kalopathor/assets/**`

**Resulting public URLs** (once readable, direct via storage.googleapis.com):

```
https://storage.googleapis.com/monarqlabs-gemini-workspace/kalopathor/assets/hillshade_bgd.pmtiles
https://storage.googleapis.com/monarqlabs-gemini-workspace/kalopathor/assets/hillshade_bgd.tif
https://storage.googleapis.com/monarqlabs-gemini-workspace/kalopathor/assets/earth-dark.jpg
https://storage.googleapis.com/monarqlabs-gemini-workspace/kalopathor/assets/rivers_bgd.geojson
https://storage.googleapis.com/monarqlabs-gemini-workspace/kalopathor/assets/pmtiles/prediction_t1_2024-08-05.pmtiles
https://storage.googleapis.com/monarqlabs-gemini-workspace/kalopathor/assets/fonts/Inter-Regular.woff2
https://storage.googleapis.com/monarqlabs-gemini-workspace/kalopathor/assets/fonts/NotoSansBengali-Regular.woff2
```

Verify: `curl -s -o /dev/null -w "%{http_code}" https://storage.googleapis.com/monarqlabs-gemini-workspace/kalopathor/assets/earth-dark.jpg` (expect 200).

> Existing bucket layout is NOT public: `kalopathor/{backups,chips4,chips6,raw,rtc-zips,serve,tiles,vault-2026-08}`.
> Only the `assets/` prefix should ever be exposed.

---

## 3. Reformat recommendations

### Hillshade → COG / PMTiles
- **Current best for map use:** `hillshade_bgd.pmtiles` at **19.6 MB** (repo copy) is already
  browser-usable. The **824 MB** `frontend_assets/hillshade_bgd.pmtiles` is overbuilt —
  **do not ship it**; rebuild at zoom ≤9-10 (~20 MB) or keep only the repo cut.
- The `.tif` (30.8 MB) is **already a DEFLATE COG** with overviews — usable directly as a
  MapLibre raster source via the public GCS URL, or re-export to PMTiles with `rio-cogeo`
  / `tippecanoe`.
- Suggested production set: `hillshade_bgd.pmtiles` (~20 MB) for the map + keep the COG in
  GCS for server-side overrides.

### Fonts → Google Fonts CDN (recommended; drop self-hosted 784 KiB)
Current self-hosted fonts: Inter-Regular/Bold, NotoSansBengali-Regular/Bold, JetBrainsMono.

Replace with Google Fonts CDN URLs (no self-host, cache-friendly, `display=swap`):

```
https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap
https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap
https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=swap
```

WOFF2 file URLs (the css2 response points to these; stable via the css family param):
- Inter: `https://fonts.gstatic.com/s/inter/...` (versioned hash — always resolve via css2)
- Noto Sans Bengali: `https://fonts.gstatic.com/s/notosansbengali/...`

> Keep the self-hosted copies in `frontend/public/fonts/` as the offline fallback; use the
> CDN as the primary source for the live app. No license issue: all three are OFL / SIL.

### Earth textures → local
- `earth-dark.jpg` (92 KiB), `earth-blue-marble.jpg` (1.4 MiB), `earth-night.jpg` (884 KiB),
  `earth-topology.png` (372 KiB) are already committed under `frontend/public/data/` —
  **keep local** (they're small, globe is presentation-only, and GCS adds no benefit).

---

## 4. Importable-asset summary

| Asset | Source | Size | Format | URL pattern |
|---|---|---|---|---|
| GIBS TrueColor epsg4326 | NASA GIBS (public, no key) | tile | JPEG | `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/{TIME}/250m/{z}/{y}/{x}.jpg` |
| GIBS TrueColor epsg3857 | NASA GIBS | tile | JPEG | `…/wmts/epsg3857/best/…/default/{TIME}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg` |
| GIBS IMERG | NASA GIBS | tile | PNG | `…/wmts/epsg4326/best/IMERG_Precipitation_Rate/default/{TIME}/2km/{z}/{y}/{x}.png` |
| MCDWD (MODIS flood) | NASA LANCE NRT | HDF/GeoTIFF 250m | — | `https://nrt3.modaps.eosdis.nasa.gov/archive/allData/61/MCDWD_L3_NRT` (Earthdata login) |
| VCDWD (VIIRS flood) | NASA LANCE NRT | HDF 250m | — | `https://nrt3.modaps.eosdis.nasa.gov/archive/allData/5200/VCDWD_L3_NRT` (Earthdata login) |
| Hillshade COG | GCS assets (make public) | 30.8 MB | GeoTIFF DEFLATE COG | `https://storage.googleapis.com/monarqlabs-gemini-workspace/kalopathor/assets/hillshade_bgd.tif` |
| Hillshade PMTiles | GCS assets / repo | 19.6 MB | PMTiles | `…/assets/hillshade_bgd.pmtiles` |
| Earth dark | repo `frontend/public/data/` | 92.6 KiB | JPEG | served by frontend |
| Earth blue-marble / night / topology | repo | 1.4 MiB / 884 KiB / 372 KiB | JPEG/PNG | served by frontend |
| Rivers | GCS assets / repo | 6.4 MiB | GeoJSON | `…/assets/rivers_bgd.geojson` |
| Fonts (self-host) | repo `frontend/public/fonts/` | 784 KiB total | woff2/ttf | served by frontend |
| Fonts (CDN, recommended) | Google Fonts | — | woff2 | `https://fonts.googleapis.com/css2?family=…&display=swap` |
| Prediction PMTiles | repo `frontend/public/data/pmtiles/` | 7.9 MiB (51 files) | PMTiles PNG | served by frontend / `…/assets/pmtiles/…` |