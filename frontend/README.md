# Kalopathor — Frontend

Bilingual (EN/BN) flood intelligence console: Next.js 14 (App Router) + MapLibre GL + Tailwind + next-intl + framer-motion. All data is static under `public/data/` — no backend and no environment variables required.

## Local development

```bash
npm install          # or: npm ci
npm run dev          # http://localhost:3000/en (redirects by middleware)
npm run build        # production build
```

Requires **Node.js ≥ 20**.

## Deploy to Vercel (recommended: GitHub import)

1. In Vercel: **Add New → Project → Import** this repository.
2. **Root Directory = `frontend`** ← this is the setting that matters. The repo root contains backend/data pipeline code; the Next.js app lives here.
3. Leave the rest as detected: Framework **Next.js**, Build `npm run build`, Install `npm ci`, Output `.next` (default). These are pinned in `vercel.json`.
4. **Environment variables:** none required.
5. **Node.js version:** 20.x or 22.x (both pass; enforced as `>=20` via `engines`).

Everything except the large optional tile archives then deploys straight from `main`:

- ✅ Landing page, operations console, data-quality panel, approval review, bilingual UI
- ✅ GIBS basemap/gap-fillers, GFM WMS, GeoJSON layers (rivers, exposure, erosion, gauges), hazard JSON tiles
- ⚠️ The heavy `*.pmtiles` archives (hillshade, flood vector polygons, prediction/uncertainty rasters) are **deliberately git-excluded** (see repo `/.gitignore`, `*.pmtiles`) and won't exist on a GitHub import. The app tolerates this: forecast chips read "forecast tiles not in public build", hillshade simply renders nothing, flood-vector clicks find no features. Nothing crashes.

### Full-fidelity deploy (with the PMTiles archives)

Two options:

1. **External tile host (cleanest for CI/CD):** upload `public/data/**/*.pmtiles` to any static host/R2/S3+CDN, then set the project env var
   `NEXT_PUBLIC_TILES_BASE=https://your-tile-host` (no trailing slash) and redeploy. The app builds all tile URLs from it (`lib/map-config.ts#pmtilesUrl`).
2. **CLI upload deploy:** from the data machine, `cd frontend && vercel --prod`. Add nothing else — untracked-but-present files are uploaded unless excluded (and there is no `.vercelignore`). Note this bypasses Git deployments.

## Self-host (Docker / Cloud Run)

The `Dockerfile` builds the standalone server output (`BUILD_STANDALONE=true`) and runs `node server.js` on port 3000 — used by `cloudbuild.yaml` for the GCP `hawkeye` image. When built this way the repo's `*.pmtiles` files must be present in the build context (they are, on the data machine).

## Project layout

```
app/[locale]/         routes: / landing, /operations console, /approval review
app/components/       UI (OperationsConsole, ActionCard, GaugeDrawer, …)
lib/                  map config/protocols, loaders, breakpoints, logger
i18n/ + messages/     next-intl routing + EN/BN strings
public/data/          served geodata (GeoJSON/JSON; pmtiles only if present)
public/lib/           MapLibre worker (served locally, avoids CDN flakiness)
```

## Notes

- `output: 'standalone'` in `next.config.mjs` applies ONLY when `BUILD_STANDALONE=true` (Docker). Vercel builds use the default output.
- `/api/freshness` is a thin static-export route over `public/data/freshness.json` with CDN cache headers.
- All user-facing strings go through `t()` — see `messages/en.json` + `messages/bn.json`.
