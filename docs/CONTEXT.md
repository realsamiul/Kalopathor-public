# KALOPATHOR — Current State Context (snapshot)

**Date-stamped:** 2026-09-01 · **Purpose:** the live working snapshot for the project. Companion to `docs/PRODUCT_SPEC.md` (stable product spec), `docs/HONEST_ASSESSMENT.md` (our own risk register), `docs/DOCTRINE.md` (non-negotiables), `docs/SUBMISSION_READY.md` (program one-pager).

---

## What is LIVE

- **Vercel demo:** `kalopathor-hbgo` (Next.js 14 + MapLibre) — the seeded Feni penthouse renders end-to-end: detection → polygons → exposure → action card → CAP draft, with honest seeded/live states. Live at `https://kalopathor-hbgo.vercel.app`.
- **Repository:** `github.com/realsamiul/Kalopathor` — contracts, doctrine, product specs, data, frontend scaffold.
- **Seeded penthouse:** the Feni vertical-slice loop (detection → exposure → action card → CAP-draft) built on the real Feni 2024 replay bundle. It is explicitly a demo of honest states, not a live monitoring system.
- **Live SAR age:** genuinely live (real acquisition timestamps). Everything else that isn't live is labeled SEEDED/DEMO — nothing presented as live that isn't.

## What is IN FLIGHT (the wave)

- **Calibration** — first isotonic fit on the v4.2 logits measured (Brier 0.086 → 0.081 per-pixel); decile curves + chip-level curves computed; re-threshold mapping (raw 0.50 → cal 0.37) derived; **verification + final lexicon update in flight**. Gate: no new government-facing confidence claims until the decile check passes and coverage is re-measured with calibrated probabilities.
- **Feni live-plumbing floor (Phase L)** — the real Sentinel-1 RTC → 6-channel prep → v4.2 inference → polygonize → freshness pipeline is running for the Feni bbox (`live/feni_latest/`: mask COG, polygons, freshness.json). First live granule processed (S1D, 2026-08-30 pass, ~62 s CPU); next-pass model built on measured constellation cadence. Corroboration hook (GFM WMS-T overlay) specified, third-signal wiring in flight.
- **FLOMPY third signal** — FLOMPY (dense time-series SAR flood mapping) evaluated as an independent third SAR signal for the G3 corroboration chain, alongside our model and the S1-Flood-Bangladesh reference.
- **CAP approve-feed** — persistent, append-only approval queue + audit layer on the CAP engine (`approve_feed.py`): enqueue → reviewed → approve/reject → export, with the approve-time freshness re-check (stale evidence forces re-review). Test suite passing.
- **Replay harness** — retrospective event replays (2022 haor, 2024 Feni, Jamuna riverine, coastal surge) with lead-time-at-issuance, shelter-assignment coverage, and the **would-have-been false-alarm count** (the trust-cost metric).
- **Dry-season composite (CHANGE v2)** — replacing the annual WorldCover median with a true dry-season S1 composite, now that GEE read access works. Directly improves the weakest input channel.

## What is BLOCKED (external)

- **Shelter data — 3 institutional asks in flight, all unanswered.** No official shelter inventory exists for Feni/Noakhali in any open dataset; no safe routes exist in Feni and the system says so. The three asks: MoDMR/ministry, LGED-framed (World Bank MDSP / GeoDASH leverage), UNDP Shelter Cluster. Until one lands: EVE honest NO_SAFE_ROUTE states persist, CAP evacuation-template branch stays parked, and the evacuation value proposition is hostage to a relationship that doesn't exist yet.
- **Cell broadcast / mass SMS** — national infrastructure (BTRC roadmap), external to the platform.

## Evidence hierarchy (the honest claim, exactly)

1. **ONE independent unseen event** — Feni 2024, UNOSAT/Charter strong labels: v4.1 **0.485** (locked as historical record when Feni entered v4.2 training); v4.2 tripwire **0.5338** (n=20 contiguous block, +0.064).
2. **ONE cross-algorithm agreement** — Sirajganj 2019: v4.1 0.540 / v4.2 0.553 (n=42). Explicitly NOT a second Feni — two SAR methods agreeing on a SAR-derived reference is partly self-consistency.
3. **ONE in-distribution val** — 2024-north 0.5432/0.5433, on labels proven unreliable (strong-covered 0.02 artifact).

Net: ~1.5 events of genuine independent evidence. Research-grade generalization, not certification. The n=1 closure path is the field-verification program (CPP volunteers photographing the next live event) — named backlog item, owner = Sam/MoDMR liaison.

## v4.1 / v4.2 freeze rules

- **v4.2 = provisionally promoted ops model** (2026-09-01, decision by Sam). All three promotion gates passed: Feni tripwire +0.064, negative-control FPR 0.000, unseen-event number exists.
- **v4.1 = frozen one-command rollback.** Contracts read the frozen v4.1 output schema; v4.2 may never destabilize in-flight tracks.
- **Both provisional** until one live national event with ground truth. Buffer ablation confirms the tripwire gain survives boundary exclusion (interior Δ+0.044, deep-interior Δ+0.042) — not pure spatial leakage.
- Re-polygonized national 2024 layer from v4.2 (`detection_polygons_v4.2.geojson`, threshold 0.65 + G3 post-mask, same schema).

## Decile-check requirement

- Calibration is not "done" until the decile check passes: calibrated mean probability must track empirical frequency across all ten bins (per-pixel AND chip-level), and onset + flood-class coverage must be re-measured on the 2024 holdout with calibrated probabilities.
- First-pass deciles are computed and already close (e.g. bin [0.9,1.0]: cal 0.902 vs empirical 0.902). Re-threshold mapping derived: raw 0.50 → calibrated 0.37. Final gate = verification run + lexicon update.

## Working state (how it works TODAY)

- **6ch prep:** `d3_6ch_prep_v2.py` → `d3_6ch_verify.py`; strong-labeled chips 2× loss weight.
- **G3 false-positive gate:** `flood_px_frac > 0.01 AND vh_mean < 0.44 AND chg_mean < 0.40 AND max_prob > 0.9 AND strata ∉ {dry_inland, mixed}` → strict-zero FPR on no-flood scenes, Feni TPR 0.83. Wired as a permanent regression gate on every checkpoint.
- **MONSOON permanent-water mask:** channel > 0.90 → background (haors preserved).
- **TTA + SWA** at inference (+0.011 IoU).
- **One-sided lower-only onset band:** `lower = max(0, stored − 0.201)`, `upper = +inf`; onset coverage 0.822, flood-class-in-onset 1.000 (was 0.608 two-sided); lexicon "historical range, not a guarantee"; go-before reads the lower bound, never midpoint. Two-sided band dropped from government-facing text.
- **EVE dry-edge two-segment routing:** snap to nearest non-flooded node; boundary-egress + main-route; go-before = sum; per-population-cluster.
- **Contract validation:** every object validates against its schema; `validate_bundle.py` exit 0 = valid; per-object `real_data / derived_data / proxy_data / missing_data` flags.
- **CAP gate chain (template fork):** schema → exposure → G3 corroboration (≥2 signals) → confidence class (→ human review, never dropped) → template fork (evacuation / shelter-in-place / nearest-shelter-vector) → provenance stamping. Approve-time freshness re-check. Two alert types = separate gate profiles.
- **Freshness API:** per-layer contract with server-side staleness enums, `server_time`, absolute timestamps, `shelters.provenance`, `model.version`, `mode: seeded|live`; ~60 s cache.
- **GEE read access:** works via ADC (writes blocked — fine). Unlocks dry-season composite, CoastSat, MCDWD.

## Standing queue (post-wave)

1. Shelter acquisition — Sam sends/follows the 3 institutional emails (long pole; nothing computed replaces it).
2. Calibration verification + re-threshold + lexicon update (decile gate).
3. Feni live loop completion — scheduler (cron/systemd), GFM corroboration hook, truthful `mode: live`.
4. EVE re-run on real shelters when data lands (official > proxy merge, demote not delete).
5. Usability pass — 3–5 Bengali speakers / one officer on action card + confidence wording (cheapest foundation validation).
6. Event replays → would-have-been false-alarm counts.
7. Dry-season CHANGE v2 composite → re-prep/verify.
8. Tabletop + hardening with MoDMR/DDM/FFWC (roles, monitoring, audit, backup).