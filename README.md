# KALOPATHOR — Bangladesh Flood Intelligence Platform

**What it is:** A bilingual (Bengali/English) decision-support system for Bangladesh's flood season — SAR flood detection → forecast → population exposure → evacuation routing → CAP 1.2 alert drafting, built for the Government of Bangladesh (MoDMR/DDM/FFWC context).

**Honest status, in one paragraph:** The foundation (contracts, eval discipline, honesty doctrine) and a working vertical slice (detection → polygons → exposure → action card → CAP draft, rendering *honest* states end-to-end) are built and **live on Vercel**. The Feni district is the pilot region; national breadth is deliberately deferred but fully slotted (depth-first strategy: one district fully real beats twenty half-real). The interface distinguishes LIVE from SEEDED/DEMO data with an explicit banner — nothing is presented as live that isn't.

## The pipeline (pinned — see `config/model_journey.yaml`)

```
Sentinel-1 SAR → 6ch chips → d3v4.2 U-Net → G3-gated polygons → HRSL exposure
→ LightGBM forecast + one-sided conformal bands → EVE routes → CAP 1.2 alert drafts
```

## Repo file map

```
README.md                       ← this file: intro + map
config/
  model_journey.yaml             ← the pinned end-to-end pipeline (versioned, step by step)
  sources.yaml                   ← every data source: access method, license, usage
contracts/
  schemas/                       ← 9 canonical JSON schemas + bundle schema
  sample_incidents/feni_2024_replay.json  ← end-to-end replay (real + proxy-flagged)
  README.md                      ← contract rules (timezone, CRS, versioning)
data/
  flood/                         ← SAR detection polygons (v4 full national, v4.2, Feni samples)
  gauges/ffwc_gauges.geojson     ← 26 FFWC stations (public coords; 89 pending)
  exposure/flood_affected_population.json  ← affected population per polygon
  forecast/openmeteo_flood.parquet        ← 10-day discharge forecasts (6 stations)
  erosion/erosion_layer.geojson  ← 3,003 bankline features
  rivers/rivers_bgd.geojson      ← 716 river centerlines
  assets/                        ← hillshade COG, earth texture (see ASSETS_AND_URLS)
docs/
  PRODUCT_SPEC.md                ← the product: model, metrics, modules, surfaces
  DESIGN_SPEC.md                 ← interaction/visual spec: action card, layer stack, freshness
  DOCTRINE.md                    ← the non-negotiables: honesty rules, gates, do-not-do
  CONTEXT.md                     ← current-state snapshot (live / in-flight / blocked)
  FIELD_CATALOG.md               ← every field + measured min/max (responsive-design bible)
  HONEST_ASSESSMENT.md           ← our published risk register + fixes landed since
  SUBMISSION_READY.md            ← AWS Activate / GCP for Startups one-pager
  STAC_DESIGN.md                 ← sensor-agnostic catalog design (end-state)
  AOI_SMARTALERT_SPEC.md         ← district/AOI alert subscription spec
  COMMUNITY_INTELLIGENCE.md      ← CPP field-reports channel (n=1 closure path)
  NOW_VS_ALWAYS.md               ← "Now" (live) vs "Always" (historical) product framing
  VALHALLA_CLOSURES.md           ← EVE passability → Valhalla closure-schema mapping
  OPERATIONS_HARDENING.md        ← roles, monitoring, audit, backup checklist
  ASSETS_AND_URLS.md             ← asset import details: GIBS public URLs, GCS, formats
frontend/                        ← Next.js 14 + MapLibre ops console (live on Vercel)
```

## Quick start

```bash
cd frontend
npm install && npm run dev      # /en/operations · /bn/operations (seeded demo data)
npm run build                    # production build
```

## Key facts (measured, not claimed)

- Model: EfficientNet-B0 U-Net, 6 channels, event-split IoU 0.543 (2024-north); **unseen-event Feni 0.485**; cross-algorithm Sirajganj 0.553 (v4.2); G3 false-positive gate: FPR 0.000.
- Forecast: LightGBM dual-branch + one-sided conformal bands (go-before = lower bound; "historical range, not a guarantee").
- Exposure: HRSL × flood extent — 20.5M people within the national event extent.
- Alerting: CAP 1.2 drafts, human approval mandatory, bilingual, evidence trail with coverage numbers.
- Honesty is the differentiator: unknown ≠ safe, no fake numbers, LIVE vs SEEDED explicit.

## Status ledger

- **LIVE:** Vercel demo (kalopathor-hbgo) · repo · seeded penthouse
- **IN FLIGHT:** calibration integration · live Feni data loop · CHANGE-channel v2 · FLOMPY third signal · CAP approve-feed · event replays
- **BLOCKED (external):** official shelter data (3 institutional requests in flight) — until it lands, EVE honestly returns "no safe route"
- **Evidence hierarchy:** ONE independent unseen event (Feni) + ONE cross-algorithm agreement (Sirajganj); both models provisional until one live national event with ground truth

## Contact / roles

Built by the Kalopathor team (Sam — product/engagement; DeepSeek dispatcher — engineering swarm; Opus/Sonnet/Fable — external review). Government deployment context: MoDMR/DDM/FFWC.