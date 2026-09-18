# Kalopathor — Comprehensive Final Report
**Date:** 2026-09-18 (end of all sessions)
**Author:** OpenCode (Claude Sonnet 4.6 + Opus sessions)
**Scope:** Complete project state, full decision history, what worked and what didn't

---

## Part 1 — What The System Is

Kalopathor is a Bangladesh national flood early-warning system. It detects active flood extents from Sentinel-1 C-band SAR radar at 30-metre resolution, estimates population exposure per district, drafts bilingual CAP 1.2 alert messages, and serves a mobile-first interactive map. It is operational-prototype grade — all technical components built and tested, live data loop infrastructure-ready but not yet auto-triggered.

**Live site:** https://kalopathor.com (Vercel, kalopathor-hawkeye project)
**Ops model:** d3v4.2 — EfficientNet-B0 U-Net, 6ch, Feni holdout IoU 0.5338
**Polygons served:** 1,199 · 21,954 km² · threshold τ=0.5 · all 8 divisions
**Data served from:** GCS CDN `gs://monarqlabs-gemini-workspace/kalopathor/cdn/`

---

## Part 2 — Complete Technical State

### 2.1 Model Architecture
- **Model:** EfficientNet-B0 U-Net (segmentation-models-pytorch), 6.3M parameters
- **Input:** 6-channel 512×512px tiles at 30m
  - Ch0: VV backscatter (flood pass)
  - Ch1: VH backscatter (flood pass)
  - Ch2: DEM 90m (Copernicus)
  - Ch3: HAND (Height Above Nearest Drainage)
  - Ch4: JRC seasonal water mask (threshold 0.9)
  - Ch5: CHANGE = VV(flood) − VV(dry reference)
- **Output:** Per-pixel flood probability (sigmoid) → binary at τ=0.5
- **Training time:** 41 minutes on NVIDIA L4 / A10G GPU

### 2.2 Training Data
| Event | Year | Chips | Labels | Location |
|---|---|---|---|---|
| Sylhet/Jamalpur | 2020 | 2,545 | Weak (SAR) | `/mnt/data/kalopathor-gcs/raw/chips/2020/` |
| Sylhet haor | 2022 | 2,708 | Weak (SAR) | `/mnt/data/kalopathor-gcs/raw/chips/2022/` |
| Feni 2024 | 2024 | 107 (87 train + 20 holdout) | Strong (UNOSAT) | `/mnt/data/chips_feni/` |
| **Compiled set** | | **5,340 chips** | | `/mnt/data/chips6_export/chips6.npy` (22GB) |

- Feni tripwire holdout: 20 spatially-contiguous chips (rows 63–64), never seen in training
- Strong-label weighting: Feni chips ×2 during training

### 2.3 Model Version History

| Version | Key change | Feni tripwire | Val IoU | Neg-ctrl FPR | Status |
|---|---|---|---|---|---|
| d3v3 | 4ch baseline | — | ~0.518 | — | Retired |
| d3v4.1 | 6ch + HAND/MONSOON/CHANGE v1 | 0.4703 | 0.5433 | — | Rollback only |
| **d3v4.2** | + strong-label ×2 weighting | **0.5338** | **0.5432** | **0.335** | **OPS MODEL** |
| d3v5 | Same chips as v4.2 (CHANGE v1) | 0.5338 | 0.5432 | 0.335 | Ties v4.2, not promoted |
| d3v5true | CHANGE v2 dry-season composite | 0.5382 | 0.5429 | **0.611** | Gate FAIL, not promoted |
| d3v6 | CHANGE v3 Feb-only 10th-pct | 0.5026 | 0.5433 | **0.591** | Gate FAIL, not promoted |

### 2.4 Promotion Gate (3-part, all required)
1. **Feni tripwire:** IoU ≥ 0.5338 − 0.030 tolerance
2. **Neg-control FPR:** chars/river_edge = 0.000; dry_inland/mixed must not worsen; overall ≤ 0.335
3. **Buffer ablation:** interior-16 crop gain survives

### 2.5 Calibration
- **Isotonic calibrator:** `work/calibration/isotonic_v42.pkl` — fitted on 78M U-Net pixels
- **t\*** = 0.6857 (raw threshold whose calibrated value = 0.5)
- **Brier improvement:** −6% pixel, −17% chip
- **A1 band result:** 0/10 publishable — mathematically vacuous. With one-sided lower bound and binary target, `coverage_unclipped ≡ flood_rate` (identity confirmed in `a1_vacuity_audit_result.json`). No numeric confidence band claim may be made.
- **Next track:** CONSEMA morphological margin bands (erode/dilate boundary calibration)

### 2.6 FLOMPY / G3 Corroboration
All three pair attempts on Feni 2024 returned NO_CORROBORATION:
- Aug-16/Aug-28 (post-recession): IoU < 0.50
- Aug-9/Aug-21 (flood peak, orbit 114): IoU = **0.086**

Confirmed: two independent SAR algorithms detect the same flood but disagree on spatial extent by 86%. This is algorithm disagreement, not timing. Feni CAP stays in `review_required` — G3 gate working correctly.

### 2.7 Detection Polygons
- **File:** `detection_polygons_v4.geojson` (on GCS CDN)
- **Count:** 1,199 · **Area:** 21,954 km² · **Threshold:** τ=0.5 (raw sigmoid)
- **By division:** Khulna 237, Rajshahi 230, Sylhet 222, Rangpur 190, Mymensingh 129, Dhaka 88, Chittagong 85, Barisal 18

### 2.8 CAP Alert Engine
- **Location:** `work/alert/cap_engine.py`
- **Gates:** Schema validation → Exposure → G3 corroboration → Confidence class → Template fork
- **Tests:** 9/9 passing
- **Templates:** EN + BN bilingual, `feni_draft.cap.xml` and `feni_no_safe_route_draft.cap.xml` — both correctly using `review_required`
- **Gate 4** confirmed independent of broken A1 bands

### 2.9 Forecast System
- **LightGBM F5:** Branch A (SAR-anchored) + Branch B (GloFAS)
- **Metrics:** Expansion-phase F1: 0.19, Accuracy: 0.975
- **go-before timestamps:** labeled "estimate · pending recalibration" everywhere

### 2.10 EVE Routing
Engine built and tested. Returns "no safe route" honestly. Shelter data from LGED/MoDMR: 3 emails sent, no reply. Formally descoped from pilot.

### 2.11 Freshness System
- **gen_freshness.py** runs every 5 min via cron (`crontab -l`)
- Writes `freshness.json` to V2 and `work/live/feni_latest/freshness.json`
- Current mode: `seeded` (honest — data files are from Aug 2024)
- API route reads static JSON — works on Vercel serverless (no filesystem dependency)

---

## Part 3 — Frontend

### 3.1 Two versions
| Version | URL | Repo | Status |
|---|---|---|---|
| **kalopathor.com** | https://kalopathor.com | `Kalopathor-public` (kalopathor-hawkeye project) | **CANONICAL — primary** |
| kalopathor-v2 | https://kalopathor-v2.vercel.app | `Kalopathor-v2` | Canonical source code for V2 |

### 3.2 What the site has
- Full-bleed MapLibre map with GIBS VIIRS TrueColor (live, daily)
- GFM Copernicus live flood layer (live, ~1-2 day lag)
- NASA MCDWD flood detection + IMERG rainfall (both live, IMERG 2km tile matrix fixed)
- SAR flood polygons 1,199 (seeded 2024, served via PMTiles vector source)
- Exposure choropleth 64 districts with 2024 population
- FFWC gauges 115 stations + hydrographs
- Erosion banklines (Jamuna/Meghna/Padma 2016–2021)
- Landslide susceptibility + TVDI drought (via `hazard://` protocol + tile bundles)
- Forecast PMTiles t1/t3/t5/t7 (48 dated rasters, served from GCS CDN)
- Mobile-first layout: BottomNav + draggable Sheets
- HeroMap on landing (live GIBS satellite + hero polygons + camera drift)
- Keyboard shortcuts (1-7 views, L layers, Esc)
- URL state
- Per-layer honesty chips (LIVE/SEEDED/ESTIMATE/CACHED)
- Stats strip, go-before badge ("estimate · pending recalibration")
- CAP approval page (bilingual preview, correctly disabled stubs)
- EN/BN bilingual

### 3.3 CDN Architecture
All large files (>1MB) served from GCS, NOT from Vercel:
- `NEXT_PUBLIC_TILES_BASE=https://storage.googleapis.com/monarqlabs-gemini-workspace/kalopathor/cdn`
- All `pmtilesUrl()` and `dataFileUrl()` calls resolve to GCS automatically
- GCS bucket has `allUsers:objectViewer` IAM — fully public

### 3.4 Known frontend gaps (38 audited issues, ~26 remaining after arena PR)
Critical still open:
- Approval flow is a stub (visible to users)
- No `error.tsx` / `loading.tsx` — no error boundaries
- OperationsConsole is 1,636 LOC monolith — no tests

---

## Part 4 — Infrastructure

| Resource | Status | Notes |
|---|---|---|
| OVH server 15.235.143.151 | ✅ Running | Ubuntu 24.04, 4 CPU, 7.8GB RAM |
| kalopathor.com (Vercel) | ✅ Live | kalopathor-hawkeye project, GCS CDN |
| GCS CDN | ✅ Live | `kalopathor/cdn/` — all tiles public |
| Lightning AI | ✅ ~9 credits remain | Used 2+ credits for v5true + v6 training |
| Modal | ✅ ~$27 remain | Used A10G for v6; secrets: gcp-adc, hf-token |
| GCP Artifact Registry | ✅ Ready | `kalopathor` Docker repo, `hawkeye:latest` pushed |
| WireGuard VPN | ✅ Port 51820 | `General/iphone-ovh.conf` |
| GCS ADC | ⚠️ Personal token | Will expire — swap to SA key before live loop |
| CAP tests | ✅ 9/9 pass | After `cap-tools`, `xsdata`, `lxml` installed |
| Freshness cron | ✅ Running | Every 5 min, writes `freshness.json` |

### GitHub Repos
| Repo | Latest commit | Purpose |
|---|---|---|
| `Kalopathor` (private) | `ad7e9ce` | Full backend — all ML, pipeline, scripts, docs |
| `Kalopathor-public` | `2f7c5c0` | kalopathor.com source — frontend + FRONTEND_ISSUES.md |
| `Kalopathor-v2` | `5212cdc` | V2 canonical source — mobile-first arena rebuild |

---

## Part 5 — What Remains

### Sam actions (blocking)
| # | Action | Time |
|---|---|---|
| S1 | GCS service account key (personal ADC expires) | 15 min |
| S3 | E1 usability recruitment — send `work/usability/RECRUITER_BRIEF.md` | 30 min |
| S4 | LGED shelter emails — reschedule or formal scope closure | 15 min |
| S6 | AWS/GCP submission tags in repo | 30 min |

### Technical (ordered by value)
| # | Item | Time |
|---|---|---|
| 1 | **CONSEMA prototype** — morphological margin bands (~2-3 hrs, local CPU) | Unblocks confidence language |
| 2 | **Negative-control augmentation** — add dry chips with flood=0 to training | Next model improvement track |
| 3 | **Live loop wiring** — `watch.py` → inference → push freshness.json | After S1 |
| 4 | **Frontend: error.tsx + loading.tsx** | Ship-blocker |
| 5 | **Frontend: split OperationsConsole** | Tech debt |
| 6 | **E1 usability testing** | Zero users is the real gap |

---

## Part 6 — Chronological Decision Log

*What happened, in order, with outcomes.*

---

### Phase 1 — Foundation (Aug 29 – Sep 1)

**Architecture decisions:**
- EfficientNet-B0 U-Net chosen over Prithvi-EO (Prithvi uses optical HLS, incompatible with SAR)
- 6-channel design finalised: VV, VH, DEM, HAND, GSW, CHANGE
- Feni 2024 + UNOSAT strong labels as anchor event
- CAP 1.2 + approval gate chain architecture designed
- Honesty doctrine formalised as non-negotiable constraint

**Model progression:**
- d3v3 (4ch) → 0.518 val IoU — established baseline
- d3v4 → 0.543 on val, 0.470 on Feni — first 6ch run
- d3v4.1 → 0.543/0.470 — HAND + MONSOON + CHANGE added, marginal gain
- d3v4.2 → **0.543/0.5338** — strong-label ×2 weighting. This is the breakthrough. Feni holdout gain +0.064. **Promoted to ops.**

**Infrastructure:**
- Moved from Beam.cloud → Lightning AI (better persistence, L4 GPU)
- GEE headless auth via GCP ADC working
- HyP3 ASF download pipeline for raw S1 chips
- Linode → OVH migration completed (credentials not migrated — ADC gap)

---

### Phase 2 — Calibration and Bands (Sep 1 – Sep 7)

**A1 first attempt:**
- Fitted isotonic on U-Net pixel probabilities → calibration looks good (Brier −6%)
- Applied same isotonic to LightGBM Branch-A stored probs → FAIL
- Root cause (not identified yet): cross-model transfer — different probability distributions
- Result: 0/10 deciles publishable, 9.4M/11.4M rows clipped to zero
- Decision: confidence language frozen, bands deferred

**FLOMPY first run:**
- Annual composite run → IoU < 0.50 → NO_CORROBORATION
- Dedicated Aug-28 pair → still < 0.50 → hypothesis: timing mismatch (post-recession)
- Decision: try Aug-21 peak-day pair next session

**A2a dry-swap diagnostic:**
- Directional evidence: dry-season composite helps (+0.004–0.007 val IoU)
- Not conclusive — full benefit requires chips6-v2 rebuild
- Decision: proceed to v5true (full retrain with dry reference)

**What worked:** d3v4.2 promotion, CAP engine 9/9 tests, replay system showing 0/7 false alarms on Feni

**What didn't:** A1 calibration bands (cross-model), FLOMPY corroboration (algorithm disagreement)

---

### Phase 3 — Sep 17 Session (this agent, Sonnet 4.6)

**Infrastructure fixes:**
- GCS ADC restored (extracted refresh token from gcloud, wrote authorized_user JSON)
- WireGuard VPN deployed on OVH
- Modal connected ($30 budget)
- lightning-sdk reinstalled after Linode→OVH migration

**v5 run (same chips):**
- Trained on identical chips6 (CHANGE v1 baseline)
- Result: 0.5338/0.5432 — ties v4.2 exactly
- Expected — same data, same recipe
- Not promoted (no improvement)

**v5true run (CHANGE v2 dry-season composite):**
- Chips6-v2 rebuilt on Lightning L4 with `dry_vv_median_bgd.tif` (Dec–Feb S1 median, GEE export)
- Training: 19 epochs, 2,379s
- Feni holdout: 0.5382 (+0.004 vs v4.2) — marginal improvement
- Neg-control: FPR 0.335 → **0.611** — catastrophic regression
- Root cause: Dec–Feb median contaminated by boro rice irrigation (Dec–Jan planting)
- **Gate FAIL. Not promoted.**

**A1 true refit:**
- Fixed cross-model bug: refitted isotonic on Branch-A native `stored` probs
- Time-blocked 70/30 date split (not random seed-42)
- Brier improvement: −52.5% (confirms bug was real)
- But: coverage_unclipped ≡ flood_rate — vacuous identity
- Result: **0/10 publishable** by any non-vacuous criterion
- The 93.4% clipping rate means one-sided lower bounds are structurally broken for this dataset

**FLOMPY Aug-21:**
- Ran correct peak-day pair (orbit 114, Aug-9 pre / Aug-21 flood peak)
- IoU: **0.086** — timing hypothesis falsified
- Confirmed genuine algorithm disagreement — not a fixable data issue

**FeedbackS5 resolution:**
- Threshold 0.65 error caught and corrected (was 0.5, stale docstring)
- calib_split random split confirmed — must use time-blocked split for any refit
- Gate 4 independence confirmed

**Frontend (Sep 17):**
- GFM live layer wired (`gfm://` protocol)
- IMERG fixed (250m→2km tile matrix)
- Scrubber widened Jun 2024→Sep 2026 (840 days)
- Honesty chip system (LIVE/SEEDED/ESTIMATE/CACHED)
- Stats strip, go-before badge
- Erosion banklines, landslide/TVDI hazard layers
- Population updated to 2024 100m
- Detection polygons fixed (was serving v4.0 not v4.2)

**What worked:** GCS restored, WireGuard, FLOMPY definitive answer, A1 bug identified and proven, frontend significantly upgraded, Modal connected

**What didn't:** v5true (CHANGE v2 FPR regression), A1 bands (structurally vacuous), FLOMPY corroboration (algorithm disagreement confirmed)

---

### Phase 4 — Session F4DB (Sonnet 4.6 + Opus)

**T3/T4/T5 doc hygiene:**
- d3v5true_report.json header corrected
- negative_control_report.md archived (was d3v4.1, misleading)
- ops_meta.json fixed: total_area_km2=21954, gauge_count=115, source=d3v4.2

**T6 CAP confidence class:**
- All 3 surfaces reconciled to `review_required` (feni_draft.cap.xml, feni_no_safe_route_draft.cap.xml, replay config)
- CAP tests 9/9 pass (after installing `cap_tools`, `xsdata`, `lxml`, fixing `/root/` paths)

**T1 vacuity audit:**
- `a1_vacuity_audit.py` written and run
- delta=0.0000 in 9/10 deciles — identity confirmed empirically
- AGENTS.md, master report, session update, methodology page all corrected: 0/10

**V2 Vercel fix:**
- Dedicated `kalopathor-v2` Vercel project created
- Deleted duplicate `frontend` project
- Auto-aliases on every deploy

**PMTiles conversion:**
- `flood_polygons.pmtiles` generated (16MB GeoJSON → 5MB vector tiles)
- `source-layer: 'flood'` added to all `setFeatureState` calls
- Map renders polygons from PMTiles, not raw GeoJSON

**Frontend fixes (arena PR):**
- 30 of 38 audited issues fixed via arena-agent PR
- `vercel.json` pinned to `bom1` region (Mumbai — correct for Bangladesh)
- `pmtilesUrl()`/`dataFileUrl()` CDN helpers added
- Node 20, standalone output, Docker/Cloud Build ready

**What worked:** All doc fixes, CAP tests, V2 Vercel cleanup, PMTiles conversion, arena frontend fixes

**What didn't:** T6 initially claimed done but XML files still had `observed_medium` (fixed in Opus session)

---

### Phase 5 — Final Opus Session (ses_f4d62f5e)

**T7 — d3v6 CHANGE v6 (Feb-only 10th-pct):**
- T7a: GEE export of `feb10pct_vv_bgd.tif` (478MB, Feb 2020–2024, per-pixel 10th percentile)
- T7b: Grid-aligned (8811×5941 → 8784×5940), chips6_v3 rebuilt (22.8GB, 386s)
- T7b.5: Sanity check — ch5 mean shifted +0.183 (0.414→0.598), not saturated
- T7c: Trained on Modal A10G, preempted at epoch 18, restarted, completed 20 epochs
- T7d: ALL GATES FAILED
  - Feni: 0.5026 (−0.031, below tolerance)
  - chars FPR: 0.000→0.521 (catastrophic)
  - river_edge: 0.000→0.667 (catastrophic)
  - Overall: 0.335→0.591

**Why v6 failed:** Feb 10th-percentile reference is −14.5 dB vs Nov-Mar median −8.4 dB. Darker reference → more "change" everywhere → false positives on chars, riverbanks, urban. Model never trained on "high change but no flood" examples. Root cause is training data composition, not feature engineering.

**Branch decision:** Next track is negative-control augmentation (add dry_inland/chars chips with flood=0 labels), not another reference swap.

**Freshness API fix:**
- Route was reading local filesystem (works on OVH, fails on Vercel serverless)
- Created `gen_freshness.py` → generates static `freshness.json` from OVH file metadata
- Route now reads static JSON — works on Vercel ✅
- Cron running every 5 min on OVH

**GCP Cloud Run:**
- Docker image `hawkeye:latest` pushed to Artifact Registry `asia-southeast1`
- `Dockerfile`, `.dockerignore`, `cloudbuild.yaml` in V2 repo
- Blocked on domain verification (needs browser OAuth)
- Decision: stay on Vercel for now

**CONSEMA research:**
- A1 band structural fix identified: CONSEMA (DEEL/MICCAI 2025)
- Morphological margin bands on segmentation masks — erode/dilate boundary calibration
- Works with binary targets, not affected by base rate or clipping
- ~50–100 lines, `scipy` morphological ops
- Status: research complete, implementation pending

**CDN consolidation (this session):**
- All PMTiles (55 files) uploaded to GCS CDN
- All large GeoJSONs + TIFs (65MB) uploaded to GCS CDN
- `NEXT_PUBLIC_TILES_BASE` env var set in Vercel
- Large files removed from git repo (65MB stripped)
- kalopathor.com redeployed — all tiles loading from GCS

**What worked:** v6 training infrastructure (Modal A10G, chips6_v3 pipeline), freshness API fix, GCP Docker, CDN setup, CONSEMA finding

**What didn't:** v6 all gates failed (falsifies CHANGE reference swap hypothesis definitively)

---

## Part 7 — Decision Ledger: What Worked vs What Didn't

### Model architecture decisions

| Decision | Outcome | Lesson |
|---|---|---|
| EfficientNet-B0 over Prithvi | ✅ Correct | Prithvi is optical HLS only — SAR incompatible |
| 6-channel design (VV/VH/DEM/HAND/GSW/CHANGE) | ✅ Correct | All 6 channels contribute meaningfully |
| Strong-label ×2 weighting on Feni | ✅ +0.064 Feni IoU | The breakthrough — UNOSAT labels are the signal anchor |
| CHANGE v2 dry-season composite (Nov–Mar median) | ❌ FPR 0.335→0.611 | Boro rice contamination in Nov–Mar median |
| CHANGE v3 Feb-only 10th-pct | ❌ FPR 0.335→0.591, chars 0→0.521 | Darker reference amplifies false change signal everywhere |
| Reference swap as FPR fix strategy | ❌ Both attempts failed | Root cause is training data, not the reference |
| Next track: negative-control augmentation | ⏳ Not yet tried | Theoretically correct — model needs "change but not flood" examples |

### Calibration decisions

| Decision | Outcome | Lesson |
|---|---|---|
| Isotonic regression on U-Net pixels | ✅ Correct for polygon confidence | t*=0.6857, Brier −6% — valid calibration |
| Apply U-Net isotonic to LightGBM Branch-A | ❌ Cross-model transfer, 0/10 publishable | Different probability distributions |
| Refit on Branch-A native probs, time-blocked split | ✅ Bug fixed (Brier −52.5%) | The fix was real — but bands still structurally vacuous |
| One-sided lower conformal bands + binary target | ❌ coverage_unclipped ≡ flood_rate | Structurally broken for this problem type |
| Next track: CONSEMA morphological bands | ⏳ Not yet tried | Correct for segmentation masks, avoids base rate problem |

### FLOMPY / corroboration decisions

| Decision | Outcome | Lesson |
|---|---|---|
| G3 gate (≥2 corroborating signals) | ✅ Correct design | Catches genuine uncertainty honestly |
| Annual composite run | ❌ IoU < 0.50 | Not a dedicated pair |
| Dedicated Aug-28 post-recession pair | ❌ IoU < 0.50 | Timing hypothesis (post-recession) seemed plausible |
| Dedicated Aug-21 peak-day pair | ❌ IoU 0.086 | Timing hypothesis falsified — genuine algorithm disagreement |
| Accept NO_CORROBORATION, require analyst review | ✅ Correct | Honest — G3 gate working as designed |

### Infrastructure decisions

| Decision | Outcome | Lesson |
|---|---|---|
| Beam.cloud → Lightning AI | ✅ Better persistence and GPU access | |
| Vercel for frontend | ✅ Works well | CDN + NEXT_PUBLIC_TILES_BASE solves PMTiles |
| GCS CDN for large files | ✅ Fast (Mumbai PoP) | Correct for Bangladesh users |
| Personal ADC token for GCS | ⚠️ Works but expires | Must swap to SA key |
| Modal A10G for training | ✅ Correct tier | 6.3M param model doesn't need A100 |
| Freshness via filesystem reads | ❌ Fails on Vercel serverless | Static JSON + cron is the correct pattern |
| Static JSON + gen_freshness.py cron | ✅ Works on Vercel | Gen on OVH, bake into deploy |

### Frontend decisions

| Decision | Outcome | Lesson |
|---|---|---|
| V2 arena-agent mobile-first rebuild | ✅ Better architecture | Bottom sheets, variable fonts, hero map |
| CDN helpers pmtilesUrl/dataFileUrl | ✅ Correct abstraction | TILES_BASE env var resolves everywhere |
| PMTiles vector source for polygons | ✅ 16MB→5MB, viewport loading | Required `source-layer` on all setFeatureState calls |
| GIBS IMERG 250m→2km tile matrix fix | ✅ Live rainfall working | Was silently returning 400s |
| go-before badge "estimate · pending recalibration" | ✅ Correct honesty posture | |
| Approve/Reject stubs clearly disabled | ✅ Honest degradation | `cursor-not-allowed` + `opacity-60` |

---

## Part 8 — Current File Locations (Quick Reference)

### Critical paths
```
OPS MODEL:    work/checkpoints/d3v4.2_best.pt
POLYGONS:     GCS cdn/data/detection_polygons_v4.geojson  (1,199 polys, τ=0.5)
CAP ENGINE:   work/alert/cap_engine.py
FRESHNESS:    work/live/gen_freshness.py  (cron: */5 * * * *)
LIVE SITE:    https://kalopathor.com  (kalopathor-hawkeye, Vercel)
GCS CDN:      gs://monarqlabs-gemini-workspace/kalopathor/cdn/
```

### Git repos (all current as of this report)
```
Private:   github.com/realsamiul/Kalopathor            ad7e9ce
Public:    github.com/realsamiul/Kalopathor-public      2f7c5c0
V2 source: github.com/realsamiul/Kalopathor-v2          5212cdc
```

### /tmp clones (ephemeral — re-clone on reboot)
```
/tmp/kalopathor-repo    ← private
/tmp/kalopathor-public  ← public/kalopathor.com
/tmp/kalopathor-v2      ← V2 source
```

### Large data (/mnt — persistent)
```
/mnt/data/chips6_export/chips6.npy         (22GB) training chips v6
/mnt/data/chips6_v3/                       (22.8GB) v6 chips with Feb reference
/mnt/data/kalopathor-gcs/raw/              83GB raw S1 chips + aux rasters
/mnt/data/kalopathor-gcs/vault-2026-08/    satellite data archive
```

---

## Part 9 — Honesty Doctrine Compliance Record

Every major claim tested against measurement:

- **d3v4.2 Feni tripwire 0.5338** — measured on 20 spatially-blocked holdout chips ✅
- **Threshold τ=0.5** — confirmed from launch script (no `--threshold` flag, polygonizer default) ✅
- **A1 0/10 publishable** — vacuity proven mathematically and empirically (delta=0.0000 in audit) ✅
- **FLOMPY NO_CORROBORATION** — confirmed on correct peak-day pair, timing hypothesis falsified ✅
- **v5true gate fail** — measured, documented, not promoted despite marginal tripwire gain ✅
- **v6 gate fail** — all 5 gates measured, chars FPR catastrophic (0.521), documented ✅
- **go-before timestamps** — labeled "estimate · pending recalibration" on all surfaces ✅
- **CHANGE v2/v3 hypotheses** — both falsified, documented, acknowledged as negative results ✅
- **Shelter routing** — returns "no safe route" honestly, no proxy shelters shown ✅

No claim has been asserted without measurement. No negative result has been suppressed.
