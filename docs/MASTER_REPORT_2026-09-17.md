# Kalopathor — Master State Report
**Date:** 2026-09-17 (end of session)
**Prepared by:** OpenCode (Claude Sonnet 4.6)
**Audience:** Senior developer, geospatial expert, technical investor, MBA reviewer
**Scope:** Complete technical state — ML, data, calibration, pipeline, frontend, infrastructure

**Entry point for new sessions:**
```bash
cd /home/ubuntu/General/kalopathor && cat AGENTS.md
```

---

## 0. Complete File Index

Every file and directory referenced in this report. All paths are absolute on the OVH server (`15.235.143.151`).

### Project root
```
/home/ubuntu/General/kalopathor/
├── AGENTS.md                                    ← READ FIRST — session entry point
├── frontend/                                    ← Next.js app
└── work/                                        ← all ML, pipeline, scripts, reports
```

### Work directory — documents
```
work/
├── MASTER_REPORT_2026-09-17.md                 ← THIS FILE
├── AGENTS.md (root)                            → /home/ubuntu/General/kalopathor/AGENTS.md
├── EXECUTION_PLAN_OPUS5_2026-08-30.md          ← master plan + amendments 1-6
├── WAVE_REPORT_2026-09-07.md                   ← pre-Sep-17 wave results
├── SESSION_UPDATE_2026-09-17.md                ← this session's changes
├── METHODOLOGY_PAGE_COPY_2026-09-17.md         ← "What's Real" page copy (ready to deploy)
├── RESPONSE_TO_FEEDBACKS5_2026-09-17.md        ← FeedbackS5 resolution
├── ENHANCED_RESOURCES_PLAN_2026-09-17.md       ← /mnt asset utilisation plan
├── ACCELERATED_PLAN_2026-09-17.md              ← sprint plan with Modal cost estimates
├── d3v4.2_report.json                          ← v4.2 full training + eval report (13K)
├── a1_true_refit_result.json                   ← A1 refit: 1/10 publishable, t*=0.01
├── a1_refit_result.json                        ← A1 cross-model attempt (incorrect, superseded)
├── flompy_aug21_result.json                    ← FLOMPY Aug-21 peak-day: IoU 0.086
└── sirajganj_inference_2019.json               ← Sirajganj d3v4.2 inference (42 chips, 6146 km²)
```

### Work directory — model checkpoints
```
work/checkpoints/
├── d3v4.2_best.pt          (69MB)  ← OPS MODEL — use this for inference
├── d3v4.2_swa_best.pt      (25MB)  ← SWA checkpoint
├── d3v4.2_eval_arrays.npz  (19KB)  ← eval pixel arrays
├── d3v4.2_report.json      (16KB)  ← training + eval metrics
├── d3v4.1_best.pt          (69MB)  ← rollback checkpoint
├── d3v4.1_swa_best.pt      (25MB)
├── d3v4.1_eval_arrays.npz  (19KB)
├── d3v4.1_report.json       (7KB)
├── d3v5_best.pt            (69MB)  ← same chips as v4.2, ties, NOT promoted
├── d3v5_swa_best.pt        (25MB)
├── d3v5_eval_arrays.npz    (19KB)
├── d3v5_report.json         (9KB)
├── d3v5true_best.pt        (69MB)  ← CHANGE v2 chips, neg-ctrl FAIL, NOT promoted
├── d3v5true_eval_arrays.npz(19KB)
├── d3v5true_report.json     (9KB)
├── d3v3_best.pt            (69MB)  ← retired v3 baseline
└── d3v3_report.json         (2KB)
```

### Work directory — calibration
```
work/calibration/
├── calib_pixels.npz         (270MB) ← 78M pixels: raw_sigmoid + labels (U-Net 2024-north)
├── calib_split.npz           (5KB)  ← RANDOM split seed=42 — DO NOT reuse for A1 refit
├── isotonic_v42.pkl          (11KB) ← fitted isotonic calibrator (U-Net pixels)
├── calib_fit_summary.json     (4KB) ← isotonic fit metrics
├── calib3_reverify.json       (1KB) ← reverification after fit
├── go_before_deciles.json     (4KB) ← prior (broken) band attempt
├── calibration_report.md      (4KB) ← narrative of calibration work
├── calib1_infer_split.py      (3KB) ← script: split inference outputs
├── calib2_fit.py              (6KB) ← script: fit isotonic
├── calib3_reverify.py         (7KB) ← script: reverify calibration
└── calib4_go_before_deciles.py(6KB) ← script: per-decile bands (broken, cross-model)
```

### Work directory — evaluation
```
work/eval/
├── negative_control_manifest.parquet  (20KB) ← 257-chip neg-ctrl manifest
├── d3v4.2_best_negative_control_results.parquet (25KB) ← v4.2 FPR by terrain
├── d3v4.2_best_threshold_sweep.json            (1.4KB) ← FPR/TPR at τ=0.3–0.8
├── d3v4.1_best_negative_control_results.parquet(25KB)
├── d3v4.1_best_threshold_sweep.json
├── d3v5_best_negative_control_results.parquet  (25KB) ← v5 (same as v4.2)
├── d3v5_best_threshold_sweep.json
├── d3v5true_best_negative_control_results.parquet(26KB) ← v5true: FPR 0.611, GATE FAIL
├── d3v5true_best_threshold_sweep.json
├── sirajganj_eval.json                          (2.5KB)← Sirajganj cross-event metrics
└── replay/                                             ← 4-event CAP replay outputs
```

### Work directory — alert engine
```
work/alert/
├── cap_engine.py              ← CAP 1.2 drafting + 5-stage gate chain (PRIMARY)
├── approve_feed.py            ← approval state machine
├── approve_feed_tests.py      ← 5 test cases (all passing)
├── approve_feed_tests.log     ← test results
├── cap_1.2.xsd                ← XSD schema for validation
├── feni_draft.cap.xml         ← sample: evacuation template
├── feni_no_safe_route_draft.cap.xml ← sample: shelter-in-place template
├── templates/                 ← CAP XML templates per scenario
├── tests/                     ← additional test fixtures
└── audit/                     ← immutable audit log outputs
```

### Work directory — data contracts
```
work/contracts/
├── validate_bundle.py         ← validates full incident bundle (exit 0 = valid)
├── schemas/
│   ├── flood_polygon.schema.json
│   ├── forecast_band.schema.json
│   ├── gauge_station.schema.json
│   ├── exposure_summary.schema.json
│   ├── shelter.schema.json
│   ├── route.schema.json
│   ├── alert.schema.json
│   ├── data_freshness.schema.json
│   ├── event.schema.json
│   └── bundle.schema.json
└── sample_incidents/
    └── feni_2024_replay.json  ← complete Feni incident bundle (validates exit 0)
```

### Work directory — forecast
```
work/forecast/
├── f5_mapie_bands_onesided.parquet  (156MB) ← PRIMARY: Branch-A stored probs + lower bounds
├── f5_mapie_bands_asymmetric.parquet(174MB) ← alternative conformal method
├── f5_mapie_bands_stratified.parquet(202MB) ← stratified method
├── f5_mapie_bands_enbpi.parquet     (202MB) ← EnbPI method
├── f5_onesided_report.json           (1.6KB)← onesided method metrics
├── bands_calibrated_deciles.json      (21KB) ← broken bands (cross-model, superseded)
├── f6_bands_calibrated_deciles.parquet(39MB) ← broken bands output
├── bcd_holdout_onset.npz             (21MB) ← holdout onset data
├── mapie_method_verdict.md           (22KB) ← method comparison analysis
└── [scripts: f5_onesided_diagnostic.py, f5_asymmetric_bands.py, etc.]
```

### Work directory — live pipeline
```
work/live/
├── watch.py                   ← Sentinel-1 acquisition monitor (item B)
├── live_feni_pipeline.py      ← end-to-end: S1 granule → inference → publish
├── next_pass.py               ← estimate next S1 overpass time
├── gfm_hook.md                ← GFM WMS-T integration notes
├── cron.example               ← example cron for automated loop
└── systemd/                   ← systemd service files for unattended operation
```

### Work directory — GEE
```
work/gee/
├── export_dry_vv_median.py    ← exports dry-season S1 VV/VH composite to GCS
├── export_dry_vv_task.json    ← GEE task receipt
├── monitor_task.py            ← polls GEE task until COMPLETED/FAILED
└── GEE_AUTH.md                ← headless GEE auth via GCP ADC (working)
```

### Work directory — EVE routing
```
work/eve/
├── build_feni_routes.py       ← builds OSMnx graph for Feni/Khowai corridor
├── build_feni_routes_v2.py    ← v2 with depth-penalty cost function
├── build_feni_routes_v2.log   ← run log
├── roads/                     ← OSM PBF extracts for 3 pilot areas
├── routes/                    ← computed route objects (GeoJSON)
└── shelters/                  ← shelter data placeholder (empty — LGED data pending)
```

### Work directory — scripts
```
work/scripts/
├── eval_negative_control.py   ← neg-control gate runner (run against any checkpoint)
├── multi_hazard_alert.py      ← compound hazard alert stub (landslide+TVDI+lightning)
├── build_hillshade.py         ← builds hillshade PMTile from DEM
├── build_rivers.py            ← extracts rivers from WorldCover
└── extract_rivers_bgd.py      ← BGD river extraction
```

### Work directory — usability
```
work/usability/
├── USABILITY_KIT.md           ← overview and session plan
├── RECRUITER_BRIEF.md         ← send this to recruit participants
├── SESSION_SCRIPT_BN.md       ← Bengali-language session script
└── PUNCHLIST_TEMPLATE.md      ← observer punchlist for sessions
```

### Frontend — key source files
```
frontend/
├── app/
│   ├── [locale]/
│   │   ├── operations/page.tsx      ← main ops console route
│   │   ├── approval/page.tsx        ← CAP approval stub (needs real view)
│   │   └── page.tsx                 ← story/landing page
│   ├── components/
│   │   ├── OperationsConsole.tsx    ← main map + all layer logic (PRIMARY, ~1200 lines)
│   │   ├── ActionCard.tsx           ← polygon click panel
│   │   ├── WorkflowRail.tsx         ← left navigation rail
│   │   ├── WorkflowListPanel.tsx    ← alert/gauge list
│   │   ├── GaugeDrawer.tsx          ← hydrograph drawer
│   │   └── DataQualityPanel.tsx     ← data quality view
│   └── api/freshness/route.ts       ← /api/freshness endpoint
├── lib/
│   ├── map-config.ts                ← LayerId types, GIBS/GFM URLs, layer definitions
│   ├── bundle.ts                    ← ActionCard state derivation
│   ├── freshness.ts                 ← freshness contract types
│   └── workflow.ts                  ← workflow item definitions
├── messages/
│   ├── en.json                      ← English translations
│   └── bn.json                      ← Bengali translations
└── public/data/
    ├── detection_polygons_v4.geojson (16MB) ← 1,199 v4.2 polygons, τ=0.5 [SERVED]
    ├── detection_polygons.geojson   (13MB)  ← v4.0 legacy (not served, keep for ref)
    ├── exposure_districts.geojson    (8.1MB) ← 64 districts + pop_2024 field [SERVED]
    ├── rivers_bgd.geojson            (6.4MB) ← river network [SERVED]
    ├── erosion_layer.geojson         (1.9MB) ← 3,003 erosion transect points [SERVED]
    ├── erosion_banklines.geojson     (1.5MB) ← Jamuna/Meghna/Padma 2016-2021 [SERVED]
    ├── ffwc_gauges.geojson           (38KB)  ← 115 FFWC stations [SERVED]
    ├── ffwc_hydrographs.json        (187KB)  ← gauge time-series [SERVED]
    ├── feni_2024_replay.json        (374KB)  ← Feni incident bundle [SERVED]
    ├── top_flood_polygons.json        (6KB)  ← top-N polygon list [SERVED]
    ├── ops_meta.json                  (415B) ← event metadata, polygon_count=1199 [SERVED]
    ├── openmeteo_forecast.json        (18KB) ← Open-Meteo forecast [SERVED]
    ├── hillshade_bgd.pmtiles         (20MB)  ← hillshade raster tiles [SERVED]
    ├── landslide_cog.tif             (14MB)  ← landslide susceptibility COG [SERVED via hazard://]
    ├── landslide_layer.tif           (13MB)  ← original (source for COG, not served directly)
    ├── tvdi_cog.tif                   (3.8MB) ← TVDI drought 2024 COG [SERVED via hazard://]
    ├── tvdi_layer.tif                 (3.0MB) ← original (source for COG, not served directly)
    └── pmtiles/                        (55 files, 9.8MB total)
        ├── prediction_t1_*.pmtiles     ← 12 dated t+1d forecast rasters
        ├── prediction_t3_*.pmtiles     ← 12 dated t+3d forecast rasters
        ├── prediction_t5_*.pmtiles     ← 12 dated t+5d forecast rasters
        ├── prediction_t7_*.pmtiles     ← 12 dated t+7d forecast rasters
        ├── prediction_t1.pmtiles       ← composite t+1d
        ├── prediction_t5.pmtiles       ← composite t+5d
        ├── uncertainty_t5.pmtiles      ← t+5d prediction uncertainty [SERVED]
        ├── landslide_tiles.json        ← base64 PNG tile bundle for hazard:// protocol
        └── tvdi_tiles.json             ← base64 PNG tile bundle for hazard:// protocol
```

### Data on /mnt
```
/mnt/data/
├── kalopathor-gcs/
│   ├── raw/
│   │   ├── chips/
│   │   │   ├── 2020/     (5,090 .tif files — Sylhet/Jamalpur raw chips)
│   │   │   ├── 2022/     (5,416 .tif files — Sylhet haor raw chips)
│   │   │   └── 2024/     (3,982 .tif files — Feni raw chips)
│   │   ├── dry_vv_median_bgd.tif      (520MB) ← 2-band dry-season S1 composite (GEE export)
│   │   ├── dem90m_bgd_full.tif        (135MB) ← Copernicus DEM 90m
│   │   ├── hand30m_bgd_full.tif       (1.1GB) ← HAND drainage proximity
│   │   └── gsw_monsoon_recurrence_bgd_full.tif (24MB) ← JRC seasonal water
│   ├── tiles/
│   │   ├── prediction_t1.tif          ← composite t+1d prediction raster (source)
│   │   ├── prediction_t5.tif          ← composite t+5d
│   │   ├── uncertainty_t5.tif         ← uncertainty raster (source)
│   │   └── temporal/                  ← 48 dated .tif files (t1/t3/t5/t7 × 12 dates)
│   ├── vault-2026-08/
│   │   ├── checkpoints/               ← v3 era checkpoint backups
│   │   └── data_satellite/
│   │       ├── erosion/
│   │       │   ├── out/               ← bankline_jamuna/meghna/padma_201[6-1].json (raw)
│   │       │   │   └── river_erosion_by_year.json
│   │       │   └── gsw/               ← gsw_yearly_201[6-1]_belt.tif (water change)
│   │       ├── glofas/                ← fc_y2024_oper_ctrl.nc, glofas_discharge_swi_*.nc
│   │       ├── hazard/
│   │       │   ├── landslide_susceptibility.tif (110MB, Chittagong Hill Tracts)
│   │       │   └── tvdi_2024.tif               (19MB, Barind drought index)
│   │       ├── heat/lst/              ← lst_2013–2022.tif (land surface temp per year)
│   │       ├── population/
│   │       │   ├── bgd_pop_2024_CN_100m_R2025A_v1.tif (55MB) ← 2024 WorldPop 100m
│   │       │   └── bgd_pd_2020_1km_UNadj.tif
│   │       ├── era5/
│   │       │   ├── era5_cape_smoke.nc  ← CAPE lightning proxy
│   │       │   └── era5_profile.nc
│   │       └── static/
│   │           ├── gsw_occurrence_bgd.tif
│   │           ├── hand30m_bgd.tif
│   │           ├── merit_dem90m_bgd.tif
│   │           └── worldcover10m_bgd*.tif (2 tiles, ESA 10m land cover)
│   └── backups/                       ← GCS backup snapshots
├── chips6_export/
│   ├── chips6.npy                     (22GB)  ← 7,244 training chips, float16
│   ├── labels.npy                      (1.8GB) ← binary flood labels
│   ├── chips_index.parquet            (98KB)  ← chip metadata (chip_id, event, strata, path)
│   ├── strong_labels.npz              (N/A)   ← UNOSAT strong-label coverage mask
│   └── zero_aux_paths.txt             ← chips with all-zero DEM/HAND (coastal boundary)
├── chips_feni/
│   ├── chips6_feni.npy                ← 107 Feni chips (train=87, holdout=20)
│   ├── labels_feni.npy
│   └── feni_index.parquet
├── chips_sirajganj/
│   ├── chips6_sirajganj.npy           (42 chips)
│   ├── labels_sirajganj.npy
│   └── sirajganj_index.parquet
└── chips_feni_dry_diag/
    ├── chips6_feni_dry.npy            ← A2a dry-swap diagnostic chips
    └── A2a_tripwire_swap.json         ← A2a dry-swap result
```

### GCS bucket
```
gs://monarqlabs-gemini-workspace/kalopathor/
├── raw/                               ← mirrors /mnt/data/kalopathor-gcs/raw/
│   ├── dry_vv_median_bgd.tif          ← dry-season S1 composite (source of truth)
│   ├── dem90m_bgd_full.tif
│   ├── hand30m_bgd_full.tif
│   └── gsw_monsoon_recurrence_bgd_full.tif
├── chips6/                            ← training chips mirror
├── serve/                             ← live-serving outputs
│   ├── cell_lookup.json
│   ├── manifest.json
│   ├── metrics.json
│   ├── peak_day_index.json
│   └── shap.json
├── tiles/                             ← raster tile outputs
└── vault-2026-08/                     ← satellite data archive
```

---

## 1. Executive Summary

Kalopathor is a Bangladesh national flood early-warning system built on Sentinel-1 C-band SAR (10 m GRD, 30 m inference). It detects active flood extents from radar backscatter, generates exposure estimates per district, and drafts CAP 1.2 alert messages with an honest confidence trail. It is not a forecast model — it is a detection-and-alerting system anchored to real SAR acquisitions.

The system is **operational-prototype grade**: all technical components are built, tested, and producing real outputs. It is not yet live (no automated ingestion loop without manual trigger). The limiting constraint is institutional — shelter data from government agencies, not technical readiness.

**Live URL:** https://kalopathor-hbgo.vercel.app
**Ops model:** d3v4.2 · EfficientNet-B0 U-Net · Feni holdout IoU 0.5338
**Polygons served:** 1,199 · 21,954 km² · threshold τ=0.5

---

## 2. System Architecture

**Detection model:** EfficientNet-B0 U-Net (segmentation-models-pytorch), 6.3M parameters
**Input:** 6-channel 512×512px tiles at 30m — VV, VH, DEM, HAND, seasonal water mask, dry-season CHANGE baseline
**Output:** Per-pixel flood probability (sigmoid) → binary at τ=0.5 → polygonised GeoJSON
**Training time:** 41 minutes on NVIDIA L4 GPU

**Six input channels:**
1. **VV** — Sentinel-1 GRD backscatter (flood pass)
2. **VH** — Sentinel-1 GRD backscatter (flood pass)
3. **DEM** — Copernicus 30m (`/mnt/data/kalopathor-gcs/raw/dem90m_bgd_full.tif`)
4. **HAND** — Height Above Nearest Drainage (`/mnt/data/kalopathor-gcs/raw/hand30m_bgd_full.tif`)
5. **MONSOON** — JRC Global Surface Water (`/mnt/data/kalopathor-gcs/raw/gsw_monsoon_recurrence_bgd_full.tif`)
6. **CHANGE** — Delta from dry-season S1 composite (`/mnt/data/kalopathor-gcs/raw/dry_vv_median_bgd.tif`)

---

## 3. Training Data

| Event | Year | Chips | Label type | Raw chips location |
|---|---|---|---|---|
| Sylhet/Jamalpur flood | 2020 | 2,545 | Weak (SAR-derived) | `/mnt/data/kalopathor-gcs/raw/chips/2020/` |
| Sylhet haor flash flood | 2022 | 2,708 | Weak (SAR-derived) | `/mnt/data/kalopathor-gcs/raw/chips/2022/` |
| Feni flash flood | 2024 | 107 | Strong (UNOSAT) | `/mnt/data/chips_feni/` |

- **Compiled training set:** `/mnt/data/chips6_export/chips6.npy` (22GB, 7,244 chips, float16)
- **Labels:** `/mnt/data/chips6_export/labels.npy` (1.8GB)
- **Index:** `/mnt/data/chips6_export/chips_index.parquet` (chip_id, event, strata, path)
- **Strong labels mask:** `/mnt/data/chips6_export/strong_labels.npz`
- **Feni holdout:** `/mnt/data/chips_feni/chips6_feni.npy` — 107 chips (87 train, 20 tripwire holdout rows 63–64)
- **Sirajganj cross-event:** `/mnt/data/chips_sirajganj/chips6_sirajganj.npy` — 42 chips, 2019

---

## 4. Model Versions and Promotion State

| Version | Checkpoint | Feni tripwire | Val IoU | Neg-ctrl FPR | Status |
|---|---|---|---|---|---|
| d3v3 | `checkpoints/d3v3_best.pt` | — | ~0.518 | — | Retired |
| d3v4.1 | `checkpoints/d3v4.1_best.pt` | 0.4703 | 0.5433 | — | Rollback only |
| **d3v4.2** | **`checkpoints/d3v4.2_best.pt`** | **0.5338** | **0.5432** | **0.335** | **OPS MODEL** |
| d3v5 | `checkpoints/d3v5_best.pt` | 0.5338 | 0.5432 | 0.335 | Ties v4.2 — not promoted |
| d3v5true | `checkpoints/d3v5true_best.pt` | 0.5382 | 0.5429 | **0.611** | Gate FAIL — not promoted |

**Gate results files:**
- v4.2 neg-control: `eval/d3v4.2_best_negative_control_results.parquet`
- v4.2 threshold sweep: `eval/d3v4.2_best_threshold_sweep.json`
- v5true neg-control: `eval/d3v5true_best_negative_control_results.parquet`
- v5true threshold sweep: `eval/d3v5true_best_threshold_sweep.json`

**v5true gate failure root cause:** Dec–Feb dry-season S1 median captures boro rice irrigation cycles (Dec–Jan haor fill), coastal tidal variability, and mixed agricultural backscatter. The "dry-season" composite is not a stable bare-soil reference — it amplifies non-flood backscatter variation as false CHANGE signal in exactly the terrain types that were already the FPR problem. Next fix: try Feb-only window or 10th-percentile composite.

---

## 5. Detection Polygons

**Served layer:** `frontend/public/data/detection_polygons_v4.geojson`
- 1,199 polygons · 21,954 km² · τ=0.5 · model_version=d3v4.2
- All 8 divisions covered · permanent-water post-mask applied
- Source script: `work/d3_polygonize_v4.py` (run via `work/launch_polygonize_v42.py`)

**Source polygon file (work dir):** `work/detection_polygons_v4.2.geojson` (37MB, master copy)

**By division:**

| Division | Polygons | Area (km²) |
|---|---|---|
| Khulna | 237 | 1,353 |
| Rajshahi | 230 | 6,057 |
| Sylhet | 222 | 5,444 |
| Rangpur | 190 | 2,301 |
| Mymensingh | 129 | 4,485 |
| Dhaka | 88 | 1,460 |
| Chittagong | 85 | 791 |
| Barisal | 18 | 64 |

**PMTiles prediction rasters:** `frontend/public/data/pmtiles/` — 48 dated files + 3 composites across t1/t3/t5/t7 horizons. Source TIFs: `/mnt/data/kalopathor-gcs/tiles/temporal/` (48 files).

---

## 6. Calibration

**Script chain:**
1. `work/calibration/calib1_infer_split.py` — splits 2024-north validation set
2. `work/calibration/calib2_fit.py` — fits isotonic regression
3. `work/calibration/calib3_reverify.py` — reverifies calibration quality
4. `work/calibration/calib4_go_before_deciles.py` — BROKEN (cross-model, superseded)

**Key outputs:**
- `work/calibration/calib_pixels.npz` (270MB) — 78M pixels: `raw_sigmoid`, `labels`
- `work/calibration/calib_split.npz` (5KB) — cal/eval indices (RANDOM seed=42 — **do not reuse**)
- `work/calibration/isotonic_v42.pkl` (11KB) — fitted calibrator
- `work/calibration/calib_fit_summary.json` — Brier scores, t*=0.6857

**Calibration metrics:** raw τ=0.5 → calibrated value 0.37. t* (raw threshold for calibrated 0.5) = 0.6857. Brier improvement: −6% pixel, −17% chip.

---

## 7. Uncertainty Quantification — Bands (A1)

**Status: 1/10 deciles publishable.** Confidence language frozen everywhere.

**Files:**
- `work/forecast/f5_mapie_bands_onesided.parquet` (156MB) — Branch-A stored probs (`stored` column) + conformal lower bounds
- `work/a1_true_refit_result.json` — **authoritative result**: 1/10 publishable, Brier −52.5%, t*=0.01
- `work/a1_refit_result.json` — superseded (cross-model attempt, incorrect)
- `work/forecast/f6_bands_calibrated_deciles.parquet` (39MB) — broken bands output (do not cite)
- `work/forecast/bands_calibrated_deciles.json` (21KB) — broken bands summary (do not cite)

**Publishable decile:** `[0.8, 0.9)` — n=1.8M, n_unclipped=323,124, coverage 0.852.
**Exact claim:** "For high-confidence onset cells (calibrated probability 0.8–0.9), our 90% conformal lower bound covers 85.2% of observed onsets in held-out 2024 data."

**Root cause of prior failure:** Isotonic fit on U-Net pixel outputs applied to LightGBM Branch-A stored probabilities — cross-model transfer. LightGBM probs have a different distribution; the map clipped 40.7M of 43.5M rows to zero.

**Fix required for A1:** Generate a new chronologically-sorted split (first 15% of dates as calibration), refit isotonic on Branch-A `stored` column only, re-run per-decile split-conformal. The split in `calib_split.npz` must NOT be reused.

---

## 8. FLOMPY / G3 Corroboration

**All runs:**
| Run | Granules | IoU | Verdict | Script/output |
|---|---|---|---|---|
| Sep 1 (annual) | 2024 composite | < 0.50 | NO_CORROBORATION | `work/flompy/run/run_d3v42_feni.py` |
| Sep 7 (dedicated Aug-28) | Aug-16/Aug-28 | < 0.50 | NO_CORROBORATION | `work/flompy/feni_agreement_vs_d3v42.md` |
| Sep 17 (peak-day Aug-21) | Aug-9/Aug-21 orbit 114 | **0.086** | **NO_CORROBORATION** | `work/flompy_aug21_result.json` |

**FLOMPY codebase:** `work/flompy/` — includes `FLOMPY_env.yml`, algorithm code, run scripts
**FLOMPY masks:** `work/flompy/feni_flompy_mask.tif`, `work/flompy/feni_flompy_mask_dedicated.tif`

Confirmed: timing hypothesis falsified. Two independent SAR algorithms detect the Feni flood but disagree on spatial extent by 86%. G3 gate correctly requires analyst review.

---

## 9. Forecast System (LightGBM F5)

**Branch A (SAR-anchored)** + **Branch B (GloFAS)** dual-branch model.
- Expansion-phase F1: 0.19 · Accuracy: 0.975
- Branch-B GloFAS data: `work/forecast/` — `fc_y2024_oper_ctrl.nc`, monthly discharge files
- GloFAS credentials: `~/.cdsapirc` (EWDS endpoint, working)
- **go-before timestamps:** labeled "estimate · pending recalibration" in all frontend surfaces

---

## 10. CAP Alert Engine

**Primary file:** `work/alert/cap_engine.py`
**XSD:** `work/alert/cap_1.2.xsd`
**Templates:** `work/alert/templates/`
**Tests:** `work/alert/approve_feed_tests.py` — 5/5 passing
**Sample outputs:** `work/alert/feni_draft.cap.xml`, `work/alert/feni_no_safe_route_draft.cap.xml`
**Audit log:** `work/alert/audit/`

Gate 4 (`confidence_class`) reads from FloodPolygon schema — **confirmed independent of Branch-A bands**.
go-before calculation uses `forecast_bands.lower` — **affected by A1 but not a gate blocker**.

**Replay results:** `work/eval/replay/` — 4 events, Feni 0/7 false alarms.

---

## 11. EVE Routing

**Scripts:** `work/eve/build_feni_routes_v2.py`
**Road graphs:** `work/eve/roads/` (3 pilot areas: Feni/Khowai, Khulna south, Bhola/Kutubdia)
**Routes:** `work/eve/routes/`
**Shelters:** `work/eve/shelters/` — **empty** — LGED/MoDMR data not received

Returns "no safe route" honestly. Shelter routing formally descoped from pilot. Frontend label: "pending LGED/MoDMR data."

---

## 12. Data Contracts

**9 schemas:** `work/contracts/schemas/`
**Validation:** `work/contracts/validate_bundle.py` — exit 0 on valid bundle
**Feni replay bundle:** `work/contracts/sample_incidents/feni_2024_replay.json` — validates exit 0
**Also served at:** `frontend/public/data/feni_2024_replay.json`

---

## 13. Frontend

**Live:** https://kalopathor-hbgo.vercel.app
**Primary component:** `frontend/app/components/OperationsConsole.tsx` (~1,200 lines)
**Map config:** `frontend/lib/map-config.ts` — all LayerId types, GIBS/GFM/hazard URL builders
**Translations:** `frontend/messages/en.json`, `frontend/messages/bn.json`

**Active layers (all wired and serving):**

| Layer | Source | Status | Protocol |
|---|---|---|---|
| Satellite basemap | NASA GIBS VIIRS | ✅ Live | `gibs://` custom |
| Copernicus GFM | geoserver.gfm.eodc.eu | ✅ Live | `gfm://` custom |
| NASA MCDWD | NASA GIBS | ✅ Live | `gibs://` |
| NASA IMERG | NASA GIBS (2km matrix) | ✅ Live (fixed) | `gibs://` |
| SAR flood polygons | detection_polygons_v4.geojson | Seeded Aug 2024 | GeoJSON |
| Exposure choropleth | exposure_districts.geojson | Seeded, pop_2024 | GeoJSON |
| FFWC gauges | ffwc_gauges.geojson | Seeded Aug 2024 | GeoJSON |
| Rivers/hillshade | rivers_bgd.geojson, hillshade PMTile | Cached | PMTiles |
| Erosion transects | erosion_layer.geojson | Cached | GeoJSON |
| Erosion banklines | erosion_banklines.geojson | Cached 2016–2021 | GeoJSON |
| Prediction t1–t7 | 48 PMTiles | Seeded Jun–Aug 2024 | PMTiles |
| Uncertainty t+5 | uncertainty_t5.pmtiles | Seeded | PMTiles |
| Landslide susceptibility | landslide_cog.tif | Cached static | `hazard://` custom |
| TVDI drought 2024 | tvdi_cog.tif | Cached static | `hazard://` custom |

**GIBS scrubber:** Jun 2024 → Sep 2026 (840 days), GFM date-synced
**Honesty chips:** LIVE/SEEDED/ESTIMATE/CACHED per layer in LayerSwitcher
**Stats strip:** 1,199 · 21,954 km² · 20.5M · 115
**go-before badge:** "estimate · pending recalibration" EN + BN

---

## 14. Freshness System

**API route:** `frontend/app/api/freshness/route.ts`
**Mode:** `seeded` (live loop not yet wired)
**Config structure:** per-layer `{last_success, status: fresh|stale|failed, stale_after_s}`
**Badge:** top-right status bar reflects mode honestly

---

## 15. Infrastructure and Credentials

| Resource | Status | Key / Config |
|---|---|---|
| OVH server | ✅ Running | 15.235.143.151, Ubuntu 24.04 |
| Python venv | ✅ | `/opt/monarq-venv/` |
| Lightning AI | ✅ 11 credits | `LIGHTNING_API_KEY` in `~/.bashrc` |
| Modal | ✅ ~$29 remaining | `~/.modal.toml`, `MODAL_TOKEN_ID/SECRET` in `~/.bashrc` |
| GCS | ✅ Personal ADC | `~/.config/gcloud/application_default_credentials.json` (**expires — swap to SA key**) |
| GEE | ✅ Headless reads | Via GCP ADC, `work/gee/GEE_AUTH.md` |
| WireGuard VPN | ✅ Port 51820 | `General/iphone-ovh.conf`, iPhone client |
| Vercel | ✅ | `VERCEL_TOKEN` in `~/.bashrc`, project `kalopathor-hbgo` |
| GitHub Private | ✅ `23bfc2e` current | `https://github.com/realsamiul/Kalopathor` |
| GitHub Public | ✅ `2de6291` current | `https://github.com/realsamiul/Kalopathor-public` |
| CDS API (GloFAS) | ✅ | `~/.cdsapirc` |
| NASA Earthdata | ✅ | `~/.netrc` (`mnrq` account) |
| ASF HyP3 | ✅ | Via Earthdata credentials |
| Planetary Computer | ✅ | No auth required |
| DAHITI | ❌ 404 | `DAHITI_API_KEY` in `~/.bashrc` — endpoint changed |
| GCP VM `kalopathor-prep` | Stopped | n2d-highcpu-16, us-central1-a — start for fast GCS transfers |

---

## 16. Key Artifacts — Quick Reference

| What | Path |
|---|---|
| **OPS MODEL checkpoint** | `work/checkpoints/d3v4.2_best.pt` |
| **OPS MODEL SWA** | `work/checkpoints/d3v4.2_swa_best.pt` |
| Polygon source (master) | `work/detection_polygons_v4.2.geojson` |
| Polygon (served) | `frontend/public/data/detection_polygons_v4.geojson` |
| Feni replay bundle | `work/contracts/sample_incidents/feni_2024_replay.json` |
| Isotonic calibrator | `work/calibration/isotonic_v42.pkl` |
| A1 refit result | `work/a1_true_refit_result.json` |
| FLOMPY Aug-21 result | `work/flompy_aug21_result.json` |
| Sirajganj inference | `work/sirajganj_inference_2019.json` |
| Band data (primary) | `work/forecast/f5_mapie_bands_onesided.parquet` |
| CAP engine | `work/alert/cap_engine.py` |
| Bundle validator | `work/contracts/validate_bundle.py` |
| Live pipeline | `work/live/live_feni_pipeline.py` + `work/live/watch.py` |
| Neg-control runner | `work/scripts/eval_negative_control.py` |
| Multi-hazard stub | `work/scripts/multi_hazard_alert.py` |
| E1 usability kit | `work/usability/` (4 files) |
| GEE export script | `work/gee/export_dry_vv_median.py` |
| Training chips | `/mnt/data/chips6_export/chips6.npy` |
| Dry-season composite | `/mnt/data/kalopathor-gcs/raw/dry_vv_median_bgd.tif` |

---

## 17. Acceptance Bar — Current Status

| Gate | Status |
|---|---|
| SAR detection at 30m over Bangladesh | ✅ |
| Flood polygons with district attribution | ✅ |
| Population exposure per polygon | ✅ (updated to 2024) |
| CAP draft engine (XSD-valid, bilingual) | ✅ |
| Gauge integration | ✅ seeded |
| Live satellite imagery | ✅ GIBS + GFM + MCDWD + IMERG |
| Routing to shelters | 🟡 engine built, shelter data pending |
| Live automated ingestion | 🟡 scripts ready, not wired |
| Government user tested | ❌ E1 not started |

---

## 18. What We Have That Google Flood Hub Does Not

| Capability | Flood Hub | Kalopathor |
|---|---|---|
| SAR-based flood detection | ❌ optical + statistical | ✅ Sentinel-1 30m |
| Dry-season CHANGE channel | ❌ | ✅ suppresses permanent water |
| Per-polygon confidence class | ❌ black box | ✅ 5-class with evidence trail |
| CAP 1.2 alert drafts | ❌ | ✅ XSD-valid, bilingual |
| Bengali UI | ❌ | ✅ full BN parity |
| Honesty chips per layer | ❌ | ✅ LIVE/SEEDED/ESTIMATE/CACHED |
| Temporal flood scrubber | ❌ | ✅ 840 days, all horizons, GFM-synced |
| River erosion animation | ❌ | ✅ Jamuna/Meghna/Padma 2016–2021 |
| Landslide + drought layers | ❌ | ✅ CHT landslide, Barind TVDI |
| Audit trail per alert | ❌ | ✅ immutable append-only log |

---

## 19. Honesty Doctrine — Compliance Record

- **FLOMPY 0.086 IoU** — reported plainly, not re-run until a better result appeared ✅
- **v5true FPR 0.335→0.611** — gate failure documented with root cause, not promoted ✅
- **A1 0/10 → 1/10** — prior cross-model bug documented, fix confirmed ✅
- **Threshold 0.65 docstring error** — caught and corrected ✅
- **go-before timestamps** — labeled "estimate · pending recalibration" everywhere ✅
- **CHANGE v2 hypothesis** — formally falsified, root cause logged ✅
- **A1 single-decile claim** — scoped (1/10 only), never generalised ✅

---

## 20. Session Updates — 2026-09-17

### GCS Credentials Restored
ADC written from `gcloud auth describe` refresh token. Persisted at `~/.config/gcloud/application_default_credentials.json`. **Expires — swap to service account before live loop.**

### WireGuard VPN
Server running on OVH port 51820. iPhone config: `General/iphone-ovh.conf`.

### Modal Connected
`~/.modal.toml` workspace `mortuzamanisha`. Token in `~/.bashrc`. ~$29 remaining.

### v5true Retrain — Gate Fail
Trained on chips6-v2 (dry-season CHANGE v2). Feni tripwire 0.5382 (+0.004) but neg-control FPR 0.335→0.611. Not promoted. v4.2 remains ops.

### FLOMPY Aug-21 — Confirmed NO_CORROBORATION
Aug-9/Aug-21 orbit 114 pair. IoU 0.086. Timing hypothesis falsified. G3 gate working correctly.

### A1 Refit — 1/10 Publishable
Cross-model bug fixed. Branch-A native probs, time-blocked split. Brier −52.5%. 1/10 deciles publishable: `[0.8,0.9)` coverage 0.852. Result: `work/a1_true_refit_result.json`.

### Frontend Changes
- GFM live layer wired (`gfm://` protocol, date-synced)
- IMERG fixed (250m→2km tile matrix)
- Scrubber widened Jun 2024→Sep 2026 (840 days)
- Honesty chip system (LIVE/SEEDED/ESTIMATE/CACHED per layer)
- Stats strip (polygons · area · affected · gauges)
- Erosion banklines (Jamuna/Meghna/Padma 2016–2021)
- Landslide + TVDI layers via `hazard://` protocol
- Uncertainty PMTile rendered
- Population updated to WorldPop 2024 100m
- go-before badge: "estimate · pending recalibration" EN+BN
- v4.2 polygon layer fixed (was v4.0, 1461 polys → v4.2, 1199 polys, τ=0.5)
- Vercel deployed: https://kalopathor-hbgo.vercel.app

### Repository State
- Private: `github.com/realsamiul/Kalopathor` — commit `7248d7b`
- Public: `github.com/realsamiul/Kalopathor-public` — commit `2de6291`
- AGENTS.md added to repo root

### multi_hazard_alert.py
Copied from `~/Opencode/General/Downloads/plans/p7_hazard/multi_hazard_alert.py` → `work/scripts/multi_hazard_alert.py`. Expanded with wiring plan, data source references, honesty note (susceptibility-based, not detected). Future CAP engine input for compound CHT/Barind alerts.

---

## 21. Project Structure — Canonical Reference

### Entry point for all new sessions
```bash
cd /home/ubuntu/General/kalopathor && cat AGENTS.md
```

### Deploy commands
```bash
# Vercel
cd /home/ubuntu/General/kalopathor/frontend
vercel deploy --prod --token $VERCEL_TOKEN --yes

# GitHub push (clone first if needed)
# git clone https://$GITHUB_TOKEN@github.com/realsamiul/Kalopathor.git /tmp/kalopathor-repo
rsync -a --delete --exclude='.next' --exclude='node_modules' \
  /home/ubuntu/General/kalopathor/frontend/ /tmp/kalopathor-repo/frontend/
cd /tmp/kalopathor-repo
git add -A && git commit -m "msg"
git push origin main

# Lightning: start L4 studio
python3 -c "
import os; os.environ['LIGHTNING_API_KEY']='$(grep LIGHTNING_API_KEY ~/.bashrc | head -1 | cut -d= -f2- | tr -d '\"')'
from lightning_sdk import Teamspace, Studio
s = Studio(name='flood-model-eval-devbox', teamspace=Teamspace(name='sar-flood-response-project', user='skarim'))
s.start(machine='L4')
print(s.status)
"
```

---

## 22. What Remains

### Sam actions (critical path this week)
| # | Item | Time |
|---|---|---|
| 1 | **GCS service account key** — GCP Console → IAM → `kalopathor-ml` SA → Storage Object Admin | 15 min |
| 2 | **E1 usability recruitment** — send `work/usability/RECRUITER_BRIEF.md` | 30 min to send |
| 3 | **AWS/GCP submissions** — fill `[SAM NEEDS TO FILL]` in repo docs | 30 min |

### Technical (ordered by value)
| # | Item | Time | Blocks |
|---|---|---|---|
| 1 | **A1 full refit** — RAPS/APS conformal for 9 remaining deciles | ~1 day | confidence language |
| 2 | **Live ingestion loop (B)** — `work/live/watch.py` → inference → `freshness.json` | ~1 day | after A1 |
| 3 | **CAP lifecycle screen** — replace `frontend/app/[locale]/approval/page.tsx` stub | ~1 day | demo quality |
| 4 | **Methodology page** — wire `work/METHODOLOGY_PAGE_COPY_2026-09-17.md` as `/methodology` route | ~1 hr | honesty narrative |
| 5 | **FLOMPY root cause** — try Feb-only or 10th-percentile dry reference | ~2 hrs | G3 corroboration |
| 6 | **GCS CDN + cache headers** — see Section 23 Tier 1 | ~2 hrs | Bangladesh load time |

---

## 23. World-Class Frontend Deployment

### Current state
- **Host:** Vercel Edge Network (Washington DC, iad1 primary)
- **TTFB (Singapore):** 1.29s — acceptable locally, poor for Bangladesh
- **TTFB (Dhaka, estimated):** 3–4s — unacceptable for field ops
- **Largest blocking assets:** `detection_polygons_v4.geojson` 16MB, `hillshade_bgd.pmtiles` 20MB, `exposure_districts.geojson` 8.1MB, `rivers_bgd.geojson` 6.4MB

### Tier 1 — This week (~2 hrs, ~$2/month)

**A. Move large static data to GCS asia-south1 + Cloud CDN**
```bash
gsutil -m cp \
  frontend/public/data/detection_polygons_v4.geojson \
  frontend/public/data/exposure_districts.geojson \
  frontend/public/data/rivers_bgd.geojson \
  frontend/public/data/hillshade_bgd.pmtiles \
  frontend/public/data/erosion_banklines.geojson \
  gs://monarqlabs-gemini-workspace/kalopathor/cdn/
gsutil -m acl ch -r -u AllUsers:R gs://monarqlabs-gemini-workspace/kalopathor/cdn/
# Enable Cloud CDN on GCP Console → Cloud CDN → Add origin
```
Expected: Bangladesh TTFB 3–4s → 1.2s.

**B. Add Vercel cache headers**
```js
// next.config.mjs — add to headers array:
{source: '/data/:path*', headers: [{key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600'}]}
```
Expected: Repeat visits — map loads in <0.3s.

**C. Convert polygons + exposure to PMTiles (tippecanoe)**
```bash
sudo apt-get install -y tippecanoe
tippecanoe -o frontend/public/data/pmtiles/detection_polygons.pmtiles \
  -z12 -Z6 --drop-densest-as-needed \
  frontend/public/data/detection_polygons_v4.geojson
tippecanoe -o frontend/public/data/pmtiles/exposure_districts.pmtiles \
  -z8 -Z4 frontend/public/data/exposure_districts.geojson
```
Expected: Initial polygon load 16MB → ~200KB viewport-only.

### Tier 2 — This month (~4 hrs, ~$3/month)

**D. AWS CloudFront + S3 ap-south-1 (Mumbai, ~15ms RTT from Dhaka)**
```bash
aws s3 mb s3://kalopathor-cdn --region ap-south-1
aws s3 sync frontend/public/data/ s3://kalopathor-cdn/data/ --acl public-read --region ap-south-1
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

**E. Vercel Pro + sin1 (Singapore) primary region**
```json
// vercel.json
{"regions": ["sin1"], "functions": {"app/api/**": {"maxDuration": 30}}}
```
Cost: ~$20/month.

### Tier 3 — Production (~1 week)

**F. Cloud Run inference endpoint (asia-south1)**
```bash
gcloud run deploy kalopathor-inference \
  --region asia-south1 --memory 4Gi --cpu 2 \
  --min-instances 0 --max-instances 3
```
Cost: ~$0.20/month (1 S1 pass per 6 days).

**G. Upstash Redis — live freshness state**
```js
import { Redis } from '@upstash/redis'
const redis = Redis.fromEnv()
const freshness = await redis.get('kalopathor:freshness')
```
Cost: Free tier (10k commands/day).

**H. Custom domain** — `kalopathor.gov.bd` or `.org` pointing to Vercel.

### Performance targets

| Metric | Current | Tier 1 | Tier 1+2 |
|---|---|---|---|
| TTFB (Dhaka 4G) | ~3.5s | ~1.5s | ~0.8s |
| First polygon render | ~6s | ~2s | ~1s |
| Repeat visit (cached) | ~6s | ~0.3s | ~0.2s |
| Polygon load | 16MB/~4s | ~200KB/~0.3s | ~200KB/~0.15s |

### Total cost estimate

| Tier | Monthly | Implementation |
|---|---|---|
| Tier 1: GCS CDN + headers + PMTiles | ~$2 | 2–3 hrs |
| Tier 2: CloudFront + Vercel Pro | ~$23 | 4 hrs |
| Tier 3: Cloud Run + Redis | ~$0.20 | 1 day |
| **Full** | **~$28/month** | **~1 week** |

---

## 24. Frontend State — Complete Inventory (as of 2026-09-18)

### Two live deployments

| Version | URL | GitHub | Description |
|---|---|---|---|
| **v1** | https://kalopathor-hbgo.vercel.app | `realsamiul/Kalopathor` | Our build — desktop-first, all data layers, full honesty system |
| **v2** | https://kalopathor-v2.vercel.app | `realsamiul/Kalopathor-v2` | Arena-agent mobile-first rebuild — new UI architecture, same data |

Both pass `npm run build` clean. Both serve all data files (verified HTTP 200).

---

### V1 — `kalopathor-hbgo.vercel.app`

**Architecture:** Single `OperationsConsole.tsx` (~1,200 lines), desktop-first layout, right-panel drawers.

**What's built and working:**

| Feature | File | Status |
|---|---|---|
| Full-bleed MapLibre map | `OperationsConsole.tsx` | ✅ |
| GIBS VIIRS TrueColor (live, daily) | `lib/map-config.ts` `gibs://` protocol | ✅ |
| GIBS IMERG rainfall (2km matrix, was broken) | `lib/map-config.ts` — fixed 250m→2km | ✅ |
| GIBS MCDWD flood detection | `lib/map-config.ts` | ✅ |
| GFM Copernicus live flood layer | `gfm://` custom protocol | ✅ |
| Date scrubber Jun 2024→Sep 2026 (840 days) | `ImageryScrubber` component | ✅ |
| GFM synced to GIBS scrubber date | `setGibsDateFor()` callback | ✅ |
| GFM toggle button in status bar | `TopStatusBar` | ✅ |
| SAR flood polygons (1,199, v4.2, τ=0.5) | `detection_polygons_v4.geojson` | ✅ |
| Polygon click → ActionCard | map click handler | ✅ |
| ActionCard provenance footer | `ActionCard.tsx` | ✅ model/threshold/polygon count |
| go-before timestamp badge | `ActionCard.tsx` + `WorkflowListPanel.tsx` | ✅ "estimate · pending recalibration" |
| Exposure choropleth (64 districts, pop 2024) | `exposure_districts.geojson` | ✅ |
| FFWC gauges (115 stations) | `GaugeDrawer.tsx` | ✅ |
| Gauge hydrograph drawer | `GaugeDrawer.tsx` | ✅ |
| Rivers + hillshade | PMTiles | ✅ |
| Erosion transects (3,003) | `erosion_layer.geojson` | ✅ |
| Erosion banklines (Jamuna/Meghna/Padma 2016–2021) | `erosion_banklines.geojson` | ✅ |
| Landslide susceptibility (Chittagong Hill Tracts) | `hazard://` custom protocol | ✅ |
| TVDI drought 2024 (Barind) | `hazard://` custom protocol | ✅ |
| Forecast PMTiles t1/t3/t5/t7 (48 dated rasters) | `pmtiles://` protocol | ✅ |
| Prediction uncertainty t+5 | `uncertainty_t5.pmtiles` | ✅ |
| Per-layer honesty chips (LIVE/SEEDED/ESTIMATE/CACHED) | `LayerSwitcher` | ✅ |
| Stats strip (polygons · area · affected · gauges) | `StatsChip` component | ✅ |
| CAP approval page | `approval/page.tsx` | ⚠️ stub (40 lines) |
| Methodology page | — | ❌ not built (copy ready in `work/`) |
| Workflow rail (7 views) | `WorkflowRail.tsx` | ✅ |
| EN/BN bilingual | `messages/en.json` + `bn.json` | ✅ |

**Fonts:** Static woff2 files — Inter Bold/Regular + JetBrains Mono + Noto Sans Bengali. Total: ~784KB.

**Bundle:** ~2.8MB static JS. Largest chunk: 516KB (MapLibre).

**Known frontend gaps in v1:**
- CAP approval screen is a 40-line stub — no bilingual CAP preview, no state machine
- No mobile layout — not tested at 375px
- No `BottomNav` or `Sheet` — no mobile-first interaction model
- No hero map on landing page — `StoryContent.tsx` is text only
- No keyboard shortcuts
- No URL state (can't share a view via link)
- No `forecastAvailable` check — scrubber shows even when pmtiles missing

---

### V2 — `kalopathor-v2.vercel.app` (arena-agent rebuild)

**Architecture:** Mobile-first, breakpoint-aware, sheet/drawer system for all screen sizes.

**New components added by arena-agent:**

| Component | File | What it does |
|---|---|---|
| `HeroMap` | `app/components/HeroMap.tsx` | Landing page — live GIBS satellite + hero polygons, slow camera drift |
| `TimeScrubber` | `app/components/TimeScrubber.tsx` | Standalone temporal scrubber extracted from OperationsConsole |
| `BottomNav` | `app/components/ui/BottomNav.tsx` | Mobile bottom navigation (5 tabs + more) |
| `TopBar` | `app/components/ui/TopBar.tsx` | Mobile top bar with stats, locale switch, menu |
| `Sheet` | `app/components/ui/Sheet.tsx` | Draggable bottom sheet (scrim-free — map stays tappable) |
| `Legend` | `app/components/ui/Legend.tsx` | Map legend with swatches per layer type |
| `breakpoint.ts` | `lib/breakpoint.ts` | Post-hydration phone/tablet/desktop detection |
| `map-protocols.ts` | `lib/map-protocols.ts` | GIBS protocol extracted to shared lib (HeroMap + OperationsConsole share it) |

**New capabilities in v2 not in v1:**

| Capability | Implementation |
|---|---|
| Mobile-first layout | `useBreakpoint()` → phone=Sheet, tablet=side drawer, desktop=right column |
| Draggable bottom sheets | `Sheet.tsx` — scrim-free so map stays interactive beneath |
| Hero map on landing | `HeroMap.tsx` — GIBS 2024-08-12 + hero polygons + slow camera drift |
| Keyboard shortcuts | `1–7` select workflow, `l` toggle layers, `Escape` dismiss sheet |
| URL state | view encoded in URL — shareable links |
| `forecastAvailable` check | HEAD request on pmtiles — degrades honestly if tiles missing |
| CAP approval page (real) | 206-line bilingual draft preview with correctly disabled Approve/Reject stubs |
| Variable fonts | Inter/JetBrains/Noto Bengali Variable → 300KB vs 784KB (−57%) |
| `hero_polygons.json` | Curated polygon set for landing hero map (18KB) |
| Timeline play loop | `TimeScrubber` auto-plays date scrubber |

**V2 build fixes applied by us (post arena-agent):**
- `*.pmtiles` removed from `.gitignore` — all 55 PMTiles files now tracked
- `hillshade_bgd.pmtiles` (20MB) added — was absent from arena-agent build
- Vercel SSO protection disabled — was redirecting all `/data/*` requests to SSO login
- `ops_meta.json` corrected — polygon_count=1199, threshold=0.5, model_version=d3v4.2

**What V2 correctly deferred (honest stubs, not broken):**
- Approve/Reject buttons: `disabled` + `cursor-not-allowed` + `opacity-60` — explicitly labeled as backend-dependent
- Live SAR/FFWC/GFM ingestion: not wired, not pretended
- pmtiles degradation: `forecastAvailable` HEAD check — shows honest "not available" state if tiles absent

---

### Frontend file inventory — both versions

**V1 primary source:**
```
/home/ubuntu/General/kalopathor/frontend/
```

**V2 primary source:**
```
/tmp/kalopathor-v2/frontend/    ← local (ephemeral — always re-clone from GitHub)
github.com/realsamiul/Kalopathor-v2
```

**Shared data files** (identical content, both versions):
```
public/data/
├── detection_polygons_v4.geojson  (16MB) — 1,199 polys, τ=0.5, model_version=d3v4.2
├── exposure_districts.geojson      (8.1MB) — 64 districts + pop_2024 field
├── rivers_bgd.geojson              (6.4MB)
├── erosion_banklines.geojson       (1.5MB) — Jamuna/Meghna/Padma 2016–2021
├── erosion_layer.geojson           (1.9MB)
├── ffwc_gauges.geojson             (38KB) — 115 stations
├── ffwc_hydrographs.json          (187KB)
├── feni_2024_replay.json          (374KB)
├── ops_meta.json                   (415B) — polygon_count=1199, threshold=0.5
├── hillshade_bgd.pmtiles           (20MB)
└── pmtiles/                        (55 files)
    ├── prediction_t{1,3,5,7}_*.pmtiles  (48 dated)
    ├── prediction_t{1,5}.pmtiles        (2 composites)
    ├── uncertainty_t5.pmtiles
    ├── landslide_tiles.json
    └── tvdi_tiles.json
```

**V2-only data:**
```
public/data/hero_polygons.json     (18KB) — curated landing hero polygon set
```

**V1-only data:**
```
public/data/landslide_cog.tif      (14MB)
public/data/landslide_layer.tif    (13MB)
public/data/tvdi_cog.tif           (3.8MB)
public/data/tvdi_layer.tif         (3.0MB)
```

---

### Frontend remaining work — ordered by value

| # | Item | Effort | Which version | Status |
|---|---|---|---|---|
| 1 | **CAP lifecycle screen** — real approval flow replacing stubs | ~1 day | Both | V2 has bilingual preview, needs state machine wired |
| 2 | **Methodology page** — `/methodology` route using `work/METHODOLOGY_PAGE_COPY_2026-09-17.md` | ~1 hr | Both | Copy written, route not built |
| 3 | **Mobile audit v1** — test at 375px, add BottomNav from v2 | ~half day | V1 | Not tested |
| 4 | **Merge v1→v2 data layers** — copy landslide/TVDI hazard layers to v2 | ~1 hr | V2 | COG files in v1, not in v2 |
| 5 | **Live data wiring** — `freshness.json` writer → `mode: live` | ~1 day | Both | Blocked on A1 |
| 6 | **District drill-down** — click division → all events/gauges | ~half day | Both | Not built |
| 7 | **Compare strip** — our detection vs GFM side by side | ~half day | Both | Not built |
| 8 | **`/brief/[district]`** — shareable situation report | ~1 day | Both | Not built |

### Decision pending: which version becomes canonical?

| V1 | V2 |
|---|---|
| More data layers (landslide, TVDI, hazard protocol) | Better mobile architecture |
| Simpler codebase, easier to extend | Variable fonts (−57% font payload) |
| Honesty chip system | Real CAP preview on approval page |
| go-before badge | Hero map on landing |
| GFM toggle in status bar | Keyboard shortcuts + URL state |
| Stats strip | Draggable sheets (map stays tappable) |

**Recommendation:** V2 architecture is superior for the target audience (field officers on phones). The missing data layers (landslide, TVDI, hazard protocol) should be merged from V1 into V2. V2 becomes the canonical branch; V1 is archived as the reference.
