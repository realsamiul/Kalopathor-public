# Kalopathor — Agent Context File
# Read this file at the start of every session.
# cd /home/ubuntu/General/kalopathor before starting any work.

## What This Project Is
Bangladesh national flood early-warning system. SAR-based detection (Sentinel-1 30m),
CAP 1.2 bilingual alerting, evacuation routing, live satellite overlay.
Live at: https://kalopathor-hbgo.vercel.app

## Canonical Directories

| Directory | Purpose |
|---|---|
| `/home/ubuntu/General/kalopathor/` | **Project root — cd here first** |
| `/home/ubuntu/General/kalopathor/work/` | All ML, pipeline, scripts, reports, calibration |
| `/home/ubuntu/General/kalopathor/frontend/` | Next.js app (MapLibre, EN/BN, Vercel) |
| `/mnt/data/kalopathor-gcs/raw/` | Raw Sentinel-1 chips + aux rasters (83GB) |
| `/mnt/data/chips6_export/` | Training chips v6 (25GB, 7,244 chips) |
| `/mnt/data/chips_feni/` | Feni 2024 event chips (348MB) |
| `/mnt/data/chips_sirajganj/` | Sirajganj 2019 cross-event chips (137MB) |

## Read These First (in order)

1. `work/MASTER_REPORT_2026-09-17.md` — **Complete state: model, data, calibration, pipeline, frontend, infra**
2. `work/EXECUTION_PLAN_OPUS5_2026-08-30.md` — Master plan + Amendments 1-6
3. `work/WAVE_REPORT_2026-09-07.md` — Wave results and known issues (pre Sep-17 session)

## Current Model State
- **Ops model:** `d3v4.2` — EfficientNet-B0 U-Net, 6ch, Feni tripwire IoU 0.5338
- **Checkpoint:** `work/checkpoints/d3v4.2_best.pt` (69MB)
- **Polygons:** `frontend/public/data/detection_polygons_v4.geojson` (1,199 polys, τ=0.5)
- **v5true:** failed neg-control gate (FPR 0.335→0.611), NOT promoted. v4.2 is ops.

## Top Open Items (as of 2026-09-17)

1. **A1 refit** — 1/10 deciles publishable. Needs time-blocked refit on Branch-A probs.
   Unblocks: confidence language, go-before timestamps, live loop (B).
2. **Live ingestion loop (B)** — scripts in `work/live/`. Blocked on A1.
3. **E1 usability** — zero real users. Kit in `work/usability/`.
4. **GCS service account** — personal ADC token will expire. Swap before live loop.
5. **Vercel deploy** — token: `VERCEL_TOKEN` in `.bashrc`. Redeploy: `cd frontend && vercel deploy --prod --token $VERCEL_TOKEN --yes`

## Key Credentials (all in ~/.bashrc)
- `LIGHTNING_API_KEY` — Lightning AI (11 credits remaining as of Sep 17)
- `VERCEL_TOKEN` — Vercel deploy
- `MODAL_TOKEN_ID` / `MODAL_TOKEN_SECRET` — Modal.com ($29 remaining)
- `GOOGLE_APPLICATION_CREDENTIALS` — GCS ADC (personal token, see above)
- `GITHUB_TOKEN` — GitHub API / push
- `DAHITI_API_KEY` — DAHITI gauge validation (endpoint returning 404, check before use)

## GitHub
- Private: https://github.com/realsamiul/Kalopathor (main, Vercel-connected)
- Public:  https://github.com/realsamiul/Kalopathor-public (no secrets)
- Git user: realsamiul / realsamiul@users.noreply.github.com
- Git remote auth: `https://$GITHUB_TOKEN@github.com/...`
- Push from: `/tmp/kalopathor-repo/` (cloned copy, not from work dir directly)

## Infrastructure
- **This server:** OVH Singapore, 15.235.143.151, Ubuntu 24.04
- **Python venv:** `/opt/monarq-venv/` (rasterio, torch, lightning-sdk, modal)
- **Lightning studio:** `flood-model-eval-devbox` in teamspace `sar-flood-response-project`
- **Modal workspace:** `mortuzamanisha`
- **WireGuard VPN:** running on port 51820, iPhone config at `General/iphone-ovh.conf`
- **GCP project:** `project-300d4e0e-5c73-49bf-b8a`
- **GCS bucket:** `gs://monarqlabs-gemini-workspace/kalopathor/`

## Honesty Doctrine (non-negotiable)
- Every claim must be measured, scoped, and disclosed
- All confidence language frozen until A1 refit with time-blocked split completes
- go-before timestamps labeled "estimate · pending recalibration" everywhere
- Polygon threshold: τ=0.5 (raw sigmoid, not calibrated) — documented in every feature property
- FLOMPY corroboration: NO_CORROBORATION on Feni 2024 (IoU 0.086 on Aug-21 peak pair)
- v5true: gate FAIL (neg-control FPR 0.335→0.611) — NOT promoted, v4.2 is ops
- A1 single publishable decile: [0.8,0.9) coverage 0.852 — cite with scope only, never generalize

## Files NOT to Trust
- `kalopathor-work/` (Linode legacy) — superseded, do not use as source of truth
- `HANDOFF.md` or `CONTEXT_FOR_AGENT.md` in old directories — contain legacy errors
- Any `.md` in root `General/kalopathor/` except this file — pre-Sep-17 planning docs
