# KALOPATHOR — Bangladesh Flood Intelligence Platform

**What it is:** A bilingual (Bengali/English) decision-support system for Bangladesh's flood season — SAR flood detection → forecast → population exposure → evacuation routing → CAP 1.2 alert drafting, built for the Government of Bangladesh (MoDMR/DDM/FFWC context).

**Live:** https://kalopathor-v2.vercel.app

**Honest status:** The foundation (contracts, eval discipline, honesty doctrine) and a working vertical slice (detection → polygons → exposure → action card → CAP draft) are built and deployed. The Feni district is the pilot region; national breadth is deliberately deferred (depth-first: one district fully real beats twenty half-real). The interface distinguishes LIVE from SEEDED/DEMO data with explicit amber banners — nothing is presented as live that isn't.

---

## The Pipeline

```
Sentinel-1 SAR → 6ch chips → d3v4.2 U-Net → G3-gated polygons → HRSL exposure
→ LightGBM forecast + uncertainty bands → EVE routes → CAP 1.2 alert drafts
```

**Ops model:** d3v4.2 — EfficientNet-B0 U-Net, 6 channels (VV, VH, DEM, HAND, monsoon recurrence, CHANGE), sigmoid output, τ=0.5, Feni tripwire IoU 0.5338, FPR 0.335 (257-chip negative control).

---

## Repo Structure

```
README.md                        ← this file
FRONTEND_ISSUES.md               ← 38 audited issues, prioritized, with fix instructions
AGENTS.md                        ← agent context file
config/
  model_journey.yaml             ← pinned end-to-end pipeline (versioned)
  sources.yaml                   ← every data source: access, license, usage
contracts/
  schemas/                       ← 9 canonical JSON schemas + bundle schema
  sample_incidents/              ← end-to-end replay data
  README.md                      ← contract rules (timezone, CRS, versioning)
data/
  flood/                         ← SAR detection polygons (v4, v4.2, Feni samples)
  gauges/                        ← FFWC station GeoJSON
  exposure/                      ← affected population per polygon
  forecast/                      ← discharge forecasts
  erosion/                       ← bankline features
  rivers/                        ← river centerlines
  assets/                        ← hillshade, textures
docs/
  PRODUCT_SPEC.md                ← model, metrics, modules, surfaces
  DESIGN_SPEC.md                 ← interaction/visual spec
  DOCTRINE.md                    ← honesty rules, gates, do-not-do
  CONTEXT.md                     ← current-state snapshot
  FIELD_CATALOG.md               ← every field + min/max
  HONEST_ASSESSMENT.md           ← risk register
  + 8 more spec docs (see docs/)
frontend/                        ← Next.js 14 + MapLibre GL + Tailwind
  app/components/                ← 13 React components
  lib/                           ← hooks, config, data loaders
  messages/                      ← EN/BN translations (next-intl)
  public/data/                   ← all served geodata (GeoJSON, PMTiles, JSON)
```

---

## Quick Start

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000/en/operations
npm run build      # production build
```

Requires Node.js 18+. No environment variables needed — all data is static in `public/data/`.

---

## Key Metrics (measured)

| Metric | Value | Source |
|---|---|---|
| Model | EfficientNet-B0 U-Net, 6ch, 6.3M params | `d3v4.2_report.json` |
| Val IoU (2024-north) | 0.543 | event-split validation |
| Feni tripwire IoU | 0.5338 | spatially-blocked holdout (20 chips) |
| Negative control FPR | 0.335 | 257 non-flood chips, 7 terrain strata |
| Sirajganj cross-event IoU | 0.553 | unseen 2019 event |
| Exposure | 20.5M people in national extent | HRSL × flood polygons |
| Polygons | 1,199 at τ=0.5 | `detection_polygons_v4.geojson` |
| CAP engine tests | 9/9 pass | `alert/tests/run_tests.py` |

---

## Contributing — Frontend

See **[FRONTEND_ISSUES.md](FRONTEND_ISSUES.md)** for 38 audited issues with:
- Priority tiers (P0 critical → P3 polish)
- Exact file paths and line numbers
- Specific fix instructions
- OperationsConsole decomposition plan

The frontend is the primary area where contributions are needed. The backend ML pipeline and data contracts are stable.

### What a contributor needs to know:
1. **next-intl** for i18n — all user-facing strings must go through `t()` with keys in `messages/en.json` + `messages/bn.json`
2. **Tailwind + CSS custom properties** — use design tokens (`--ink-*`, `--mist-*`, `--accent`, etc.), not raw hex colors
3. **Honesty doctrine** — never present seeded/demo data as live. Every claim must be measured and scoped.
4. **MapLibre GL** — map rendering with PMTiles protocol for vector tiles and GIBS protocol for NASA imagery

---

## Model History

| Version | Status | Notes |
|---|---|---|
| d3v3 | Retired | 5ch baseline |
| d3v4.1 | Retired | 6ch, no Feni-in-train |
| **d3v4.2** | **OPS** | 6ch, Feni-in-train, strong-weighted, tripwire holdout |
| d3v5 | Not promoted | Same chips as v4.2, tied performance |
| d3v5true | Not promoted | CHANGE v2 chips, neg-control FPR 0.611 (FAIL) |
| d3v6 | Not promoted | Feb-only 10th-pct CHANGE, all gates FAILED (FPR 0.591) |

---

## Honesty Doctrine (non-negotiable)

- Every claim measured, scoped, disclosed
- Confidence bands: 0/10 publishable (structurally blocked; CONSEMA morphological approach under research)
- go-before timestamps labeled "estimate, pending recalibration"
- Polygon threshold τ=0.5 (raw sigmoid, not calibrated) — documented in every feature property
- FLOMPY corroboration: NO_CORROBORATION on Feni 2024 (IoU 0.086)
- Unknown ≠ safe. No fake numbers. LIVE vs SEEDED explicit.

---

## Contact

Built by the Kalopathor team. Government deployment context: MoDMR/DDM/FFWC.
