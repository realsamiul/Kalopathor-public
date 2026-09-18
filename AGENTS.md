# Kalopathor — Project Context

## What This Project Is
Bangladesh national flood early-warning system. SAR-based detection (Sentinel-1 30m),
CAP 1.2 bilingual alerting, evacuation routing, live satellite overlay.

**Live:** https://kalopathor-v2.vercel.app

## Current Model State
- **Ops model:** `d3v4.2` — EfficientNet-B0 U-Net, 6ch, Feni tripwire IoU 0.5338
- **Polygons:** 1,199 flood detection polygons at τ=0.5
- **v5true:** failed neg-control gate (FPR 0.611), NOT promoted
- **v6:** failed all gates (FPR 0.591, Feni IoU regressed), NOT promoted
- v4.2 remains ops

## Architecture

```
Backend (OVH server):
  Sentinel-1 SAR → 6ch chip prep → d3v4.2 inference → polygonization
  → exposure calc → CAP 1.2 drafting → freshness.json generation

Frontend (Vercel):
  Next.js 14 + MapLibre GL + PMTiles + Tailwind
  → reads static geodata + freshness.json
  → bilingual EN/BN via next-intl
```

## Data Sources

| Source | Type | Access |
|---|---|---|
| Sentinel-1 IW GRD | SAR imagery | Copernicus Open (free) |
| MERIT DEM | Elevation 90m | Public |
| HAND | Height Above Nearest Drainage 30m | Derived from MERIT |
| JRC GSW | Monsoon water recurrence | Public |
| NASA GIBS | Satellite basemaps (VIIRS, MODIS) | Public |
| Copernicus GFM | Global Flood Monitoring tiles | Public |
| FFWC | Bangladesh water level gauges | Public charts, gated API |
| HRSL | Population density 100m | Meta (public) |
| GloFAS | River discharge forecasts | CDS API (free registration) |

## Frontend Development

See **[FRONTEND_ISSUES.md](FRONTEND_ISSUES.md)** for 38 prioritized issues.

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

No environment variables needed for local dev. All data is static in `public/data/`.

## Honesty Doctrine (non-negotiable)

- Every claim measured, scoped, disclosed
- Confidence bands: 0/10 publishable (structurally blocked; morphological approach under research)
- go-before timestamps labeled "estimate, pending recalibration"
- Polygon threshold τ=0.5 (raw sigmoid, not calibrated)
- FLOMPY corroboration: NO_CORROBORATION on Feni 2024 (IoU 0.086)
- Unknown ≠ safe. LIVE vs SEEDED explicit everywhere.

## Repos

| Repo | Purpose |
|---|---|
| [Kalopathor-public](https://github.com/realsamiul/Kalopathor-public) | Public — docs, frontend, data samples, contracts |
| Kalopathor (private) | Full backend — checkpoints, training scripts, raw data |
| Kalopathor-v2 (private) | V2 frontend canonical (Vercel-connected) |
