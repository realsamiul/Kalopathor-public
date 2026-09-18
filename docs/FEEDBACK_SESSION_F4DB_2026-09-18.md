# Session Feedback — ses_f4dbc4b1affeArApp31zk5mziy
**Reviewer:** OpenCode (Claude Sonnet 4.6)
**Session date:** 2026-09-18, 02:06–03:04
**Source:** `work/Opussession-ses_f4db.md`
**Purpose:** Honest evaluation of what was done, what was missed, what was wrong, and what remains.

---

## Overall Assessment

Strong session. The CAP engine work was the best part — diagnosing the `cap_tools` module gap, fixing `/root/` paths, and getting 9/9 tests passing is a meaningful operational achievement. The T1 vacuity audit is rigorous and the result file is correct. The Vercel project cleanup is the right permanent fix.

The significant gap: **all V2 changes are uncommitted local edits.** The most important work of the session exists only in `/tmp/kalopathor-v2/` and will be lost on server reboot.

---

## What Was Done Correctly

### CAP Engine — Best work of the session
- Installed `cap_tools`, `xsdata`, `lxml` — correctly identified that the "missing module" was the actual blocker, not a code bug
- Fixed 3 hardcoded `/root/` → `/home/ubuntu/` paths in `cap_engine.py` and `build_fixtures.py`
- All 9/9 tests pass including FAIL-4 which explicitly validates `review_required` confidence class
- This was genuinely unresolved before this session. The CAP engine was functionally untestable.

### A1 Vacuity Audit (T1)
- `a1_vacuity_audit_result.json` is correct and complete
- `delta_cov_minus_fr = 0.0` in 9/10 deciles (0.000307 rounding noise in [0.2,0.3)) — proves identity empirically
- One important observation from the result file: deciles [0.0,0.1) and [0.1,0.2) have `n_unclipped = 0` — meaning ALL 40.7M low-scored rows have lower=0. The clipping is almost total. The vacuity proof holds but the scale of clipping (93.6% of all rows) is more severe than previously documented. Worth noting explicitly.
- Brier −52.5% is real — the cross-model bug was genuine. Calibration of U-Net sigmoid is valid. Only the Band coverage claim is vacuous.

### Doc Hygiene (T3, T4)
- `d3v5true_report.json` header correctly updated
- `negative_control_report.md` ARCHIVED header correct

### Vercel Project Fix
- Deleted the `frontend` duplicate project — correct. The root cause of `kalopathor-v2.vercel.app` showing stale content was the `.vercel/project.json` pointing to the shared `frontend` project. Creating a dedicated `kalopathor-v2` Vercel project is the right permanent fix.
- `rootDirectory: null` note: the Vercel project was created with `rootDirectory: null`. Verify this is correct for the V2 repo structure — the frontend lives at `frontend/` subdirectory, so it should be `rootDirectory: "frontend"`. If null, Vercel may be trying to build from the repo root and failing silently.

### PMTiles Conversion
- `flood_polygons.pmtiles` generated (16MB → 5MB) ✅
- `source-layer: 'flood'` added to all `setFeatureState` calls ✅
- Build passes clean ✅
- The MapLibre vector source approach is correct. Using `promoteId` with vector tiles requires the feature ID to exist in the tile data — verify tippecanoe was called with `--generate-ids` or that polygon IDs are preserved. If not, `setFeatureState` for hover/select will silently fail.

---

## Gaps and Errors

### Gap 1 — CRITICAL: V2 changes not committed or pushed
`git -C /tmp/kalopathor-v2 status --short` shows:
```
 M frontend/.gitignore
 M frontend/app/api/freshness/route.ts
 M frontend/app/components/OperationsConsole.tsx
 M frontend/public/data/ops_meta.json
?? frontend/public/data/pmtiles/flood_polygons.pmtiles
```
**All V2 work is uncommitted local edits in `/tmp/`.** If the server reboots, all of it is gone. The session ended without a `git commit` + `git push` to `Kalopathor-v2`. This must be done immediately.

### Gap 2 — T6 Incomplete: CAP XML files still say `observed_medium`
The fix plan scorecard in the session claims T6 "DONE — 3 files → review_required." But on disk:
- `alert/feni_draft.cap.xml` — still `observed_medium` (5 occurrences)
- `alert/feni_no_safe_route_draft.cap.xml` — still `observed_medium`
- `eval/replay/configs/2024_feni.json` — correctly shows `review_required` ✅

Two of the three files were not actually updated. The session log says T6 was done; the files disagree. One possible explanation: the session changed `replay_configs` and ran CAP tests (which regenerates output XML via `run_tests.py`), but the static sample XML files in `alert/` were never edited directly.

### Gap 3 — SESSION_UPDATE.md not fully corrected
Two "1/10 publishable" references remain in `SESSION_UPDATE_2026-09-17.md` (lines 94, 177). Both are in contextually-correct positions (explaining what the old claim meant, not asserting it), but the T2 success criterion said "grep returns zero hits." Not met for this file.

### Gap 4 — MASTER_REPORT §7 still contains 0.852
Line 455 of `MASTER_REPORT_2026-09-17.md` has a `[VACUITY NOTE]` block that explains the 0.852 figure correctly. The note is accurate and honest. However, the T2 grep check counts this as a hit. Decision needed: is the note sufficient or should §7 be rewritten to remove the number entirely? Current state is defensible but inconsistent with the "zero hits" success criterion.

### Gap 5 — `a1_true_refit_result.json` reproducibility note needs verification
The session claims this was updated with `"reproducible": false, "producer": "inline Modal session"`. Verify this note is actually in the file — it was not confirmed in the final disk check.

### Gap 6 — ops_meta.json V2 copy
T5 fixed `ops_meta.json` in V1 (`/home/ubuntu/General/kalopathor/frontend/public/data/`). V2 copy (`/tmp/kalopathor-v2/frontend/public/data/ops_meta.json`) is in the uncommitted V2 changes — confirmed fixed but only if Gap 1 is resolved (commit + push).

### Gap 7 — Vercel rootDirectory may be wrong
The `kalopathor-v2` Vercel project was created with `rootDirectory: null`. The frontend code is at `frontend/` subdirectory in the Kalopathor-v2 repo. If Vercel is trying to build from the repo root it will fail or pick up the wrong `package.json`. Verify: `curl -s "https://api.vercel.com/v9/projects/kalopathor-v2" -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('rootDirectory'))"`. Should return `"frontend"`, not `null`.

### Gap 8 — T10 explicitly skipped
`GEMINI_TOOLS_README.md` update was skipped as "low priority." The FIX_PLAN says to remove any "45/100 tested, 42 passed" style legacy instruction. If this file exists and is read by future agents, it contains erroneous instructions. Should be checked and either deleted or corrected. Not urgent but not safe to leave indefinitely.

---

## One Error of Interpretation

The session log at line 553 says: "T7 CHANGE v6 retrain — BLOCKED. GCS SA needed. You mentioned IAM user available — revisit?"

There is no mention of an IAM user being "available" in the session. This appears to be a hallucination by the session agent — Sam had not indicated any GCS SA was created. The T7 block status is correct (GCS SA still needed); the parenthetical "you mentioned IAM user" is wrong and should not be acted on without confirmation from Sam.

---

## What Remains To-Do (ordered)

### Immediate (before next session opens)

| # | Action | File | Why |
|---|---|---|---|
| 1 | **Commit + push V2 changes** | `/tmp/kalopathor-v2/` → `github.com/realsamiul/Kalopathor-v2` | All session work lost on reboot otherwise |
| 2 | **Fix T6: edit both CAP XML files** | `alert/feni_draft.cap.xml`, `alert/feni_no_safe_route_draft.cap.xml` | `observed_medium` → `review_required` (5+4 occurrences each) |
| 3 | **Verify Vercel rootDirectory** | Vercel API check | `rootDirectory` should be `"frontend"`, not `null` |
| 4 | **Redeploy V2 after Gap 1+2 fixed** | `kalopathor-v2.vercel.app` | Currently serving pre-fix build |

### This week

| # | Action | File | Why |
|---|---|---|---|
| 5 | Verify `a1_true_refit_result.json` has reproducibility note | `work/a1_true_refit_result.json` | Gap 5 — claimed done, unverified |
| 6 | Decision on MASTER_REPORT §7 0.852 | `work/MASTER_REPORT_2026-09-17.md:455` | T2 success criterion technically not met |
| 7 | Add `ops.status.liveHealth` to EN+BN translations | `frontend/messages/en.json`, `bn.json` | Latent bug — fires when freshness mode = live; won't crash now but will when live loop is wired |
| 8 | Verify PMTiles feature IDs preserved | `flood_polygons.pmtiles` | If tippecanoe stripped IDs, hover/select silently broken |
| 9 | Check T10: `GEMINI_TOOLS_README.md` | Wherever it exists | Remove legacy erroneous instructions |
| 10 | Push V1 ops_meta.json fix to GitHub private repo | `kalopathor-hbgo.vercel.app` | V1 ops_meta was fixed locally but was it pushed? |

### Blocked on Sam

| # | Action | Blocks |
|---|---|---|
| S1 | GCS service account key | T7 CHANGE v6, live loop, GEE exports |
| S3 | E1 usability recruitment | User signal — longest-lead item |
| S4 | LGED shelter emails | EVE routing |
| S6 | AWS/GCP submission tags | Submission readiness |

---

## One Positive Finding Not in the Session Log

The `a1_vacuity_audit_result.json` reveals something important that neither the Fix Plan nor the session noted explicitly: **deciles [0.0,0.1) and [0.1,0.2) have n_unclipped = 0**. That means 40.65M of 43.5M total rows (93.4%) have lower=0. Only 6.6% of all onset predictions have any non-trivial lower bound at all. The one-sided conformal band is effectively useless for 93% of the forecast space — not because of the vacuity issue alone, but because the band collapses to zero for the vast majority of outputs. This makes the RAPS/APS alternative approach (mentioned in Fix Plan §22 as a future track) not just "better" but structurally necessary. The current conformal approach cannot produce publishable bands regardless of how the split or isotonic are improved.

---

## Summary Score

| Category | Score | Notes |
|---|---|---|
| CAP engine fix | 10/10 | Clean, tests pass, right diagnosis |
| Vacuity audit | 9/10 | Correct result; severity of clipping (93.4%) underappreciated |
| Doc hygiene | 7/10 | T3, T4 done; T6 incomplete (2/3 files); T2 technically incomplete |
| V2 infrastructure | 6/10 | Vercel project correct; code changes uncommitted |
| PMTiles | 7/10 | Converted correctly; feature ID preservation unverified |
| Session discipline | 6/10 | "IAM user mentioned" hallucination; T6 claimed done without verification |

---

## Appendix — Complete File & Folder Location Reference
*For any agent starting a new session — every location on this server.*

### Server
- **Host:** OVH Singapore, `15.235.143.151`, Ubuntu 24.04
- **User:** `ubuntu` (home: `/home/ubuntu/`)
- **Python venv:** `/opt/monarq-venv/` — has rasterio, torch, modal, lightning-sdk

---

### Project Root
```
/home/ubuntu/General/kalopathor/
├── AGENTS.md                          ← READ FIRST every session
├── frontend/                          ← V1 frontend source (ARCHIVED for new work)
└── work/                              ← all ML, pipeline, scripts, reports
```

**Stale files in root (do not use):**
`HANDOFF-2026-08-30.md`, `REVISED-PLAN-2026-08-30.md`, `INDEX-2026-08-29.md`,
`SONNET_INIT_PROMPT.md`, `202Opusw.txt`, `TwoResponses.txt`

---

### work/ — Top-Level Files (authoritative)

| File | Purpose |
|---|---|
| `MASTER_REPORT_2026-09-17.md` | Complete state — §25 is most current |
| `AGENTS.md` (root) | Session entry point |
| `AGENT_READING_MAP.md` | Token-budget reading guide |
| `FIX_PLAN_2026-09-18.md` | Active task list |
| `FEEDBACK_SESSION_F4DB_2026-09-18.md` | This file |
| `SESSION_UPDATE_2026-09-17.md` | Sep 17 session changelog |
| `METHODOLOGY_PAGE_COPY_2026-09-17.md` | Approved external-facing language |
| `RESPONSE_TO_FEEDBACKS5_2026-09-17.md` | FeedbackS5 resolutions |
| `a1_vacuity_audit.py` + `a1_vacuity_audit_result.json` | A1 vacuity proof (delta=0.0000) |
| `a1_true_refit_result.json` | A1 refit result (0/10 publishable, vacuous) |
| `flompy_aug21_result.json` | FLOMPY Aug-21 result (IoU=0.086) |
| `d3v4.2_report.json` | Ops model full training report |
| `sirajganj_inference_2019.json` | Sirajganj d3v4.2 inference results |
| `DeepseekFrontendFeedback.txt` | V2 bug list from independent review |
| `Opussession-ses_f4db.md` | Session log (reviewed in this file) |

**Stale/superseded (keep, don't cite):**
`a1_refit_result.json` (cross-model bug version), `WAVE_REPORT_2026-09-07.md` (pre Sep-17),
all `SONNET5_*`, `ARENA_*`, `GPU_PIPELINE_AUDIT_*`, `HIGH_LEVEL_BRUTAL_ASSESSMENT_*`

---

### work/ — Subdirectories

| Directory | Contents |
|---|---|
| `alert/` | `cap_engine.py`, `approve_feed.py`, XSD, CAP XML samples, `tests/`, `templates/` |
| `calibration/` | `isotonic_v42.pkl`, `calib_pixels.npz` (270MB), `calib_split.npz`, scripts |
| `checkpoints/` | All model `.pt` files — d3v3, d3v4, d3v4.1, **d3v4.2** (ops), d3v5, d3v5true |
| `contracts/` | 9 schemas, `validate_bundle.py`, `feni_2024_replay.json` |
| `eval/` | Threshold sweeps, neg-control results, `replay/`, `sirajganj_*.json` |
| `eve/` | Routing engine, road graphs, shelter data (empty — LGED pending) |
| `fixes/` | Aux raster build scripts (DEM, HAND, GSW, CHANGE channel) |
| `flompy/` | FLOMPY algorithm, run scripts, result MDs |
| `forecast/` | `f5_mapie_bands_onesided.parquet` (156MB), band scripts |
| `gee/` | GEE export scripts, `GEE_AUTH.md` |
| `live/` | `watch.py`, `live_feni_pipeline.py`, `next_pass.py` |
| `scripts/` | `eval_negative_control.py`, `multi_hazard_alert.py` |
| `strong_labels/` | UNOSAT source shapefiles (FL20200713BGD, FL20220525BGD, FL20240825BGD) |
| `usability/` | E1 kit: `RECRUITER_BRIEF.md`, `SESSION_SCRIPT_BN.md`, punchlist |

---

### frontend/ (V1 — ARCHIVED, not for new development)
```
/home/ubuntu/General/kalopathor/frontend/
├── app/components/OperationsConsole.tsx   ← V1 map component
├── lib/map-config.ts                      ← GIBS/GFM/hazard URL builders
├── messages/en.json + bn.json             ← translations
└── public/data/                           ← all served data files
    ├── detection_polygons_v4.geojson  (16MB) — 1,199 polys τ=0.5 d3v4.2
    ├── exposure_districts.geojson      (8.1MB)
    ├── rivers_bgd.geojson              (6.4MB)
    ├── erosion_banklines.geojson       (1.5MB)
    ├── ffwc_gauges.geojson             (38KB)
    ├── hillshade_bgd.pmtiles           (20MB)
    ├── landslide_cog.tif               (14MB)
    ├── tvdi_cog.tif                    (3.8MB)
    ├── ops_meta.json                   ← polygon_count=1199, total_area_km2=21954, gauge_count=115
    └── pmtiles/                        ← 55 files (prediction t1/t3/t5/t7, uncertainty, hazard bundles)
```

---

### /tmp — Ephemeral Git Clones (LOST ON REBOOT)

```
/tmp/kalopathor-repo/       ← Private repo clone (realsamiul/Kalopathor)
                              Current commit: 0397f8d
                              Use for: pushing docs/work/ changes to private repo

/tmp/kalopathor-v2/         ← V2 repo clone (realsamiul/Kalopathor-v2)  ⚠️ HAS UNCOMMITTED CHANGES
                              Current commit: 8aff124 (but 5 files modified locally)
                              Uncommitted: route.ts, OperationsConsole.tsx, ops_meta.json,
                                           .gitignore, flood_polygons.pmtiles
                              MUST commit+push before any server reboot
                              Use for: V2 canonical frontend development

/tmp/kalopathor-public/     ← Public repo clone (realsamiul/Kalopathor-public)
                              Current commit: 50d55a9
                              Use for: pushing public-safe docs
```

**Re-clone commands if /tmp is cleared:**
```bash
source ~/.bashrc
git clone https://$GITHUB_TOKEN@github.com/realsamiul/Kalopathor.git /tmp/kalopathor-repo
git clone https://$GITHUB_TOKEN@github.com/realsamiul/Kalopathor-v2.git /tmp/kalopathor-v2
git clone https://$GITHUB_TOKEN@github.com/realsamiul/Kalopathor-public.git /tmp/kalopathor-public
```

---

### /mnt/data — Large Data (persistent, mounted volume)

```
/mnt/data/
├── chips6_export/                  ← Training chips v6 (25GB)
│   ├── chips6.npy                  (22GB) — 7,244 chips float16
│   ├── labels.npy                  (1.8GB)
│   ├── chips_index.parquet
│   └── strong_labels.npz
│
├── chips_feni/                     ← Feni 2024 event chips (348MB)
│   ├── chips6_feni.npy             — 107 chips (87 train + 20 tripwire holdout)
│   ├── labels_feni.npy
│   └── feni_index.parquet
│
├── chips_sirajganj/                ← Sirajganj 2019 cross-event (137MB)
│   ├── chips6_sirajganj.npy        — 42 chips
│   ├── labels_sirajganj.npy
│   └── sirajganj_index.parquet
│
├── chips_feni_dry_diag/            ← A2a diagnostic chips
│   ├── chips6_feni_dry.npy
│   └── A2a_tripwire_swap.json
│
├── chips5_export/                  ← Training chips v5 (20GB, older)
│
├── kalopathor-gcs/
│   ├── raw/
│   │   ├── chips/
│   │   │   ├── 2020/  (5,090 raw S1 GRD chips)
│   │   │   ├── 2022/  (5,416 raw S1 GRD chips)
│   │   │   └── 2024/  (3,982 raw S1 GRD chips)
│   │   ├── dry_vv_median_bgd.tif       (520MB) ← dry-season S1 composite
│   │   ├── er_s1_dry_*.tif             (36 files) ← per-year dry tiles 2019–2024
│   │   ├── er_s2_ndwi_*.tif            ← Sentinel-2 NDWI tiles
│   │   ├── gsw_occurrence_bgd.tif
│   │   ├── gsw_yearly_201[6-1]_belt.tif  ← water extent by year
│   │   ├── hand30m_bgd.tif
│   │   ├── merit_dem90m_bgd.tif
│   │   ├── static_features.tif
│   │   └── worldcover10m_bgd*.tif
│   ├── tiles/
│   │   ├── prediction_t1.tif / prediction_t5.tif / uncertainty_t5.tif
│   │   └── temporal/  (48 dated prediction TIFs: t1/t3/t5/t7 × 12 dates)
│   ├── vault-2026-08/
│   │   ├── checkpoints/  ← v3-era checkpoint backups
│   │   └── data_satellite/
│   │       ├── erosion/out/  ← bankline_jamuna/meghna/padma_201[6-1].json (raw)
│   │       ├── glofas/       ← fc_y2024_oper_ctrl.nc, monthly discharge .nc files
│   │       ├── hazard/       ← landslide_susceptibility.tif, tvdi_2024.tif
│   │       ├── heat/lst/     ← lst_2013–2022.tif
│   │       ├── population/   ← bgd_pop_2024_CN_100m_R2025A_v1.tif (55MB)
│   │       └── static/       ← worldcover, hand, DEM, static_features
│   └── backups/
│
├── kalopathor-work/                ← OLD Linode structure — largely superseded
│   ├── beam_jobs/                  ← Old Beam.cloud training scripts (superseded by Lightning)
│   ├── front/                      ← Old frontend specs and mockdata
│   └── recovered/                  ← Recovery artifacts from Linode migration
│
├── modal_env/                      ← Modal Python environment
├── Chatbot/                        ← Unrelated project
└── DocRag/                         ← Unrelated project
```

---

### /home/ubuntu — Other

```
/home/ubuntu/
├── General/
│   ├── kalopathor/          ← THIS PROJECT (canonical)
│   ├── iphone-ovh.conf      ← WireGuard iPhone client config
│   └── AGENTS.md            ← workspace-level agent instructions
├── beam_jobs/               ← Old Beam.cloud scripts (d3_train_unet.py etc.) — superseded
├── Opencode/General/
│   └── Downloads/plans/p7_hazard/multi_hazard_alert.py  ← compound hazard alert stub
└── .bashrc                  ← all credentials exported here
```

---

### Credentials (all in ~/.bashrc, sourced at login)

| Variable | Purpose | Status |
|---|---|---|
| `LIGHTNING_API_KEY` | Lightning AI (11 credits remaining) | ✅ Working |
| `VERCEL_TOKEN` | Vercel deploy | ✅ Working |
| `MODAL_TOKEN_ID` / `MODAL_TOKEN_SECRET` | Modal.com (~$29 remaining) | ✅ Working |
| `GOOGLE_APPLICATION_CREDENTIALS` | GCS ADC → `/home/ubuntu/.config/gcloud/application_default_credentials.json` | ⚠️ Personal token, expires |
| `GOOGLE_CLOUD_PROJECT` | `project-300d4e0e-5c73-49bf-b8a` | ✅ |
| `GITHUB_TOKEN` | GitHub API + push | ✅ Working |
| `DAHITI_API_KEY` | DAHITI gauge validation | ❌ Endpoint returning 404 |
| `HF_TOKEN` | HuggingFace | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter | ✅ |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS Bedrock | ✅ |
| `MODAL_PROXY_TOKEN` | Modal shared endpoints (Kimi K3) | ✅ |

**CDS API (GloFAS):** `~/.cdsapirc` — not in bashrc, file-based config
**NASA Earthdata:** `~/.netrc` — `mnrq` account
**Modal config:** `~/.modal.toml` — workspace `mortuzamanisha`

---

### GitHub Repositories

| Repo | URL | Purpose | Last commit |
|---|---|---|---|
| Private | `github.com/realsamiul/Kalopathor` | Main, Vercel-connected to V1 | `0397f8d` |
| Public | `github.com/realsamiul/Kalopathor-public` | No secrets | `50d55a9` |
| V2 | `github.com/realsamiul/Kalopathor-v2` | Arena-agent mobile rebuild, canonical | `8aff124` ⚠️ has uncommitted local changes |

### Live URLs

| URL | Source | Status |
|---|---|---|
| `kalopathor-hbgo.vercel.app` | V1, `Kalopathor` repo | 🗄️ Archived — no new development |
| `kalopathor-v2.vercel.app` | V2, `Kalopathor-v2` repo | ✅ Canonical live frontend |

---

## Addendum — T7 Execution Plan Review (`T7_EXECUTION_PLAN.md`)
**Date added:** 2026-09-18

### Overall verdict: Proceed — plan is sound. 8 specific adjustments below.

---

### What's correct, proceed as-is

- **Hypothesis is well-formed.** Feb-only 10th-percentile as dry baseline is the right mechanical fix for the v5true failure. Nov–Mar window contamination from boro rice Oct–Nov transplanting backscatter is the correct root cause. 96 Feb images × 5 years = ~480 images → stable 10th percentile.
- **Gate discipline is correct.** "No existing files modified until gates pass, v4.2 stays ops" — maintain this.
- **Resource budget is accurate.** $0.50–2.00 for full run is realistic against $29 Modal balance.

---

### 8 Issues and Adjustments

**1. Check T7a status before doing anything**
The plan says "T7a RUNNING (PID 44920)." GEE runs on Google's servers — it may already be done or failed while the session was running. First command of any T7 work:
```bash
gsutil ls -l gs://monarqlabs-gemini-workspace/kalopathor/raw/feb10pct_vv_bgd.tif 2>/dev/null
```
If non-zero size → T7a done, skip to T7b. If missing → check GEE task log via `work/gee/monitor_task.py`.

**2. Chip upload vs rebuild — rebuild on Modal is faster**
Uploading 22GB chips6_v3 at ~25 MB/s from OVH ≈ 15 min and ties up the connection. Better: build chips6_v3 on Modal directly from GCS. Raw chips are already in `gs://monarqlabs-gemini-workspace/kalopathor/raw/chips/` — Modal pulls from GCS at Google-internal speeds (~200 MB/s). Upload only aux rasters (DEM, HAND, GSW, strong_labels.npz, feni chips — ~1.5GB total). Saves ~10 min and avoids network saturation.

**3. GPU tier — use A10G, not A100. Also: model param count is wrong**
Plan says "26M params." The model is EfficientNet-B0 U-Net with **6.3M params** — not 26M. At 512×512 batch=4, A10G (24GB VRAM) is plenty. A100 is 3× the cost for zero benefit on a model this size. Use `gpu="A10G"` in Modal config.

**4. Gate 2 dry_inland criterion is too weak**
Plan says `dry_inland FPR < 0.800`. v4.2's dry_inland IS 0.800 — this gate just says "don't be worse." The entire motivation for v6 is improvement. Recommended threshold: **`dry_inland FPR < 0.600`** — meaningful 25% relative improvement, not demanding. If v6 passes at 0.799 the experiment produced no useful signal.

**5. Add channel 5 sanity check between T7b and T7c**
Risk #2 ("10th percentile too dark → CHANGE saturates") is listed as a mitigation but not as a required step. It should be. A 2-minute check:
```python
import numpy as np
v3 = np.load('/mnt/data/chips6_v3/chips6_v3.npy', mmap_mode='r')
v2 = np.load('/mnt/data/chips6_export/chips6.npy', mmap_mode='r')
print('v4.2 ch5:', v2[:,5].mean(), v2[:,5].std())
print('v6   ch5:', v3[:,5].mean(), v3[:,5].std())
```
If `std(v6 ch5) >> std(v4.2 ch5)`, the reference is too aggressive — halt and investigate before burning $1.50 on a doomed training run.

**6. GEE auth blocker may be resolved — update master docs**
The plan says "Auth: Confirmed working with existing `authorized_user` ADC. No service account needed." The FIX_PLAN and AGENTS.md still list T7 as "BLOCKED on S1 (GCS SA)." If GEE exports work with the personal ADC, that's a meaningful status change. After T7a confirms, update AGENTS.md top open items and master report §22 accordingly.

**7. `/root/` path bug — fix ALL four paths, not just REF_PATH**
The plan correctly identifies `REF_PATH: /root/General/...` needs fixing. But DEM_PATH, HAND_PATH, and GSW_PATH also have `/root/` prefixes in `d3_6ch_prep_v2.py`. The v5true run hit exactly this bug (chips built with zero aux data, n_unclipped explosion). When writing `d3_6ch_prep_v3.py`, grep for every `/root/` and replace with the correct path before running.

**8. Decision 4: auto-promote vs Sam review — hold for Sam**
Correct answer per honesty doctrine: run all gates automatically, but **require Sam review before polygon regeneration and frontend update**. Model weights can be labelled "ops candidate" internally, but swapping the live polygon layer (1,199 polygons on the frontend) without human sign-off is higher risk than the 10-minute delay. The CAP engine and exposure calcs all key off the polygon layer. Any silent swap has downstream effects.

---

### Branch decision if Gate 2 fails again on dry_inland

The plan says "document what was learned, keep v4.2." Correct. But it should also specify the next experiment: if v6 fails dry_inland FPR after Feb-only 10th-pct, the hypothesis shifts from "the reference causes the FPR" to "the model architecture or negative-control chip composition causes the FPR." In that case, the next track is **not another reference swap** — it's targeted negative-control augmentation: add dry_inland chips (urban non-flood) to the training set with flood=0 labels, retrain at same architecture. Worth noting as the explicit branch before spending another Lightning run.
