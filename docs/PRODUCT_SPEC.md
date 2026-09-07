# KALOPATHOR — Product Specification

**Version:** 2.0 · **Date:** 2026-09-01 · **Status:** VERTICAL-SLICE PILOT READY — v4.2 provisionally promoted as ops model; uncertainty-band calibration artifact under correction (bands not yet publishable); live-plumbing floor (Feni) in flight; Vercel demo live.
**Audience:** Bangladesh administration (MoDMR/DDM/FFWC context), engineering team, and program reviewers.
**Basis:** measured outputs only. Every metric below was measured on held-out events; nothing is predicted. Full evidence ledger: `docs/HONEST_ASSESSMENT.md`, `docs/CONTEXT.md`.

---

## 1. The product

KALOPATHOR is a bilingual (Bengali/English) flood-intelligence platform for the Government of Bangladesh. It turns satellite and gauge data into the thing an official actually needs: **a decision — which places are flooding, who is affected, what to do, where to go, which alert to issue, and how much to trust the answer.**

The pipeline is end-to-end and depth-first: **SAR flood detection → forecast → population exposure → evacuation routing → CAP 1.2 alert drafting**, delivered through three surfaces:

- **National Command** — the ops dashboard for MoDMR/DDM/FFWC (2D ops map, workflow rail, right-hand action card).
- **District Ops** — scoped view for district/upazila officers.
- **Field/Public** — instruction-first, Bengali-first, voice-capable, no GIS.

**The product thesis is depth before breadth:** one district fully real beats twenty half-real. The foundation (contracts, eval discipline, honesty doctrine) and the penthouse (a working detection → polygon → exposure → action-card → CAP-draft loop for the **Feni pilot region**, rendering honest states everywhere) are built. National breadth is deliberately pending but fully slotted.

---

## 2. Detection engine (the core)

EfficientNet-B0 U-Net, **6 input channels**, sigmoid binary head, SWA + OneCycleLR, TTA (+0.011 IoU) at inference:

- `VV`, `VH` — Sentinel-1 dB (granite-normalized)
- `DEM` — MERIT south + Copernicus GLO-30 north (full-country fix)
- `HAND` — MERIT Hydro
- `MONSOON` — Jun–Oct water recurrence (preserves haors)
- `CHANGE` — VV vs dry-reference dB

### 2.1 Measured metrics — event-split, both models

| Metric | v4.1 | **v4.2 (provisional ops)** | Δ |
|---|---|---|---|
| 2024-north val IoU (n=1,991, in-distribution, weak labels) | 0.5433 | **0.5432** | tie |
| **Feni 2024 — unseen southern event, strong labels (historical baseline)** | **0.485** | — | v4.1's record, locked when Feni entered training |
| **Feni tripwire** (n=20 contiguous spatially-blocked holdout, strong labels) | 0.4703 | **0.5338** | **+0.0636** |
| **Buffer ablation** (interior 16 chips, boundary excluded) | 0.5149 | **0.5590** | **+0.044** (deep-interior +0.042) |
| **Sirajganj 2019 — unseen event, cross-algorithm** (n=42, no TTA) | 0.5400 | **0.5526** | +0.0126 (better on 23/42) |
| False-positive gate (G3 multi-signal) | FPR 0.000 on no-flood scenes | FPR 0.000 | — |
| North-strip gain from DEM fix | — | +0.019 | — |

**Promotion status (2026-09-01):** v4.2 is **provisionally promoted** as the ops detection model. All three promotion gates passed — Feni tripwire (+0.064 on strong labels), negative-control FPR regression gate, and an unseen-event number. **v4.1 stays frozen as the one-command rollback.** Both remain provisional until one live national event with independent ground truth (field-verification backlog).

### 2.2 Evidence hierarchy (we never overclaim)

1. **One independent unseen event** — Feni 2024, UNOSAT/Charter strong labels, v4.1 at **0.485** (historical record).
2. **One cross-algorithm agreement** — Sirajganj 2019, 0.54–0.55, explicitly **NOT** a second Feni (two SAR methods agreeing on a SAR-derived reference is partly self-consistency).
3. **One in-distribution val** — 2024-north, ~0.54, measured on labels we have proven unreliable.

That is the honest hierarchy we present to partners: roughly **1.5 events of genuine independent evidence**, a research-grade generalization result, not a certification. The field-verification program (community volunteers photographing flood extent on the next live event) is the named path to closing the gap.

---

## 3. Forecast, hydrology & uncertainty

- **Flood forecast** — LightGBM dual-branch (SAR-anchored 87M rows + GloFAS), validated against DAHITI satellite altimetry: Brahmaputra **R² 0.88**, Padma **R² 0.93**.
- **Gauges** — FFWC 196 stations (115 observed + 81 forecast) with danger levels; GloFAS v5 (EWDS); Open-Meteo Flood API (no-key); UTide harmonics (M2 0.695 m).

### 3.1 Uncertainty band — calibration artifact found, correction in progress

The band journey is documented and honest, and external review has now exposed a calibration artifact in it. The **two-sided band was a sigmoid-clipping artifact** — an uncalibrated sigmoid in the 0.6–0.9 stored-value zone mechanically capped residuals at `1 − stored`, so the danger-side width (w_up = +0.218) was not validated error structure. The one-sided aggregate that followed was **decile-carried**: aggregate onset coverage 0.822 was held up by clipped-to-zero rows, with only 1–28% coverage across the 0.5–0.9 deciles. **Those band numbers are withdrawn and are not publishable.**

- **Correction in progress:** split-conformal **per-decile** bands on calibrated probabilities. The bands are **not yet publishable**; onset and flood-class coverage will be re-measured on the 2024 holdout with calibrated probabilities before any number is republished.
- **Confidence thresholds and confidence language are frozen** until the rebuild verifies. **Gate:** no new government-facing confidence claims until the per-decile verification passes.
- Calibration basis is being built on calibrated probabilities (first isotonic fit measured: Brier 0.086 → 0.081 per-pixel; re-threshold mapping derived: raw 0.50 → cal 0.37).
- Lexicon stays **"historical range, not a guarantee"** — an empirical statement, never a statistical certification — shared verbatim between the action card and the CAP evidence trail.

---

## 4. Exposure

HRSL/WorldPop population × flood polygons → affected population per polygon and district. Feni district ≈ 184k affected; a national event extent ≈ **20.5M people (11.9% of Bangladesh)**. Alert-ready district counts, per the utility matrix.

---

## 5. EVE — evacuation vector engine

- National OSM road graph + 3 pilot graphs (Feni/Khowai, Khulna south, Bhola); temporal router with edge states **Passable / Marginal / Likely-blocked / Blocked / Unknown**.
- Shelter layer = 346 proxy points (OSM + HDX). **The honest state:** zero official shelters within ~20 km of the Feni floods in any open dataset — **the system says so explicitly. No safe routes currently exist in Feni, and it refuses to fabricate one.** This is the honesty layer doing its job.
- Route objects are two-segment (flood-boundary egress + main route); **unknown ≠ safe** is formal in the Route contract.
- **Shelter data is the single longest-lead dependency.** Three institutional requests are in flight (MoDMR/ministry, LGED-framed, UN/Shelter-Cluster). When data lands: official > proxy merge (demote, never delete) → re-run routing → expect passability to flip from "all blocked" to real routes.

---

## 6. Alerting

CAP 1.2 drafting (XSD-valid) via cap-tools, two gate profiles through one engine:

- **Operational Advisory** (officials) vs **Public Evacuation Alert** (public).
- Lifecycle: Detected → Drafted → Reviewed → Approved → Exported → Archived, with an append-only audit log. **Human approval is mandatory — nothing auto-sends.**
- Gate chain: schema → exposure (people present) → multi-signal corroboration (≥2 of SAR/gauge/rainfall/forecast) → confidence class (review-required routes to the human queue, never dropped) → **template fork** — safe-route → evacuation template; no-safe-route → shelter-in-place/highest-ground; flash-valley <6h → nearest-shelter-vector (never predictive language).
- **Approve-time freshness re-check:** stale SAR/gauge between Draft and Approve forces re-review.
- Evidence trail carries provenance and coverage: `{coverage, n, method}`.

---

## 7. Modules & surfaces

**Modules:** KALOPATHOR Detect · Forecast · Exposure · EVE · Alert · Monitor.

**Surfaces:** National Command (2D ops map, workflow left rail — Now Flooding · Next 72h · People at Risk · Routes & Shelters · Gauges · Alerts · Data Quality — right action card) · District Ops · Field/Public (instruction-first, Bengali-first, voice).

**Action card IA (the product):** status badge → critical window (largest text) → affected people → action (BN-first) → shelter (capacity status) → route (passability + valid-until) → gauge → CAP draft button (never one-click) → evidence trail (collapsed). "No safe route" carries the same visual weight as a safe route, with shelter-in-place fallback. Voice mode reads: critical window → action → shelter → route. Bilingual EN/BN from day one; Noto Sans Bengali bundled.

---

## 8. Platform & delivery

- **Vercel deployment live:** `kalopathor-hbgo` (Next.js 14 + MapLibre ops console) — the seeded Feni penthouse is demonstrable end-to-end today.
- **Repository:** `github.com/realsamiul/Kalopathor` — contracts, doctrine, product specs, data, frontend.
- **Live-plumbing floor in flight (Phase L):** a real Sentinel-1 RTC → 6-channel prep → v4.2 inference → polygonize → freshness pipeline is running for the Feni bbox, publishing `flood_mask_cog.tif / polygons.geojson / freshness.json` with measured constellation revisit cadence. **Freshness is honest by design:** the UI distinguishes `mode: seeded | live` with an explicit amber banner — nothing is presented as live that isn't. SAR age is genuinely live (real acquisition timestamps); forecast/next-pass are seeded/estimated until the live ingest loop completes.
- **The 9-track completion wave** (Rounds 2–3) has landed: CAP engine + gates (A), asymmetric→one-sided band diagnostic (B/B1), freshness contract + honesty relabel (C/C1), v4.2 retrain + promotion gates (D), buffer ablation (D1), Sirajganj second unseen event (E), GEE read access (G), negative-control regression gate, and the seeded/live split. All measured, all labeled honestly.

---

## 9. Honesty doctrine (unchanged — this is the feature)

- **No hidden uncertainty:** every number is measured; every caveat is stated; cross-algorithm agreement is labeled as such.
- **Unknown ≠ safe, unknown ≠ nonexistent:** route passability and shelter capacity are distinct states, never silently assumed.
- **No fake numbers:** seeded data is labeled seeded; "historical range" is never called a guarantee; no safe route is never rendered as one.
- **No auto-send:** human approval is structurally mandatory.
- **We publish our own risk register** (`docs/HONEST_ASSESSMENT.md`) — the gaps, the thin metrics, the outsourced blocker, the untested claims — in the same document set we show to partners and reviewers.

---

## 10. Known limitations (deployment honesty)

- **S1 revisit 6-day** (restored with S1D) → detection is nowcast-to-2-day, not same-day; flash-flood valleys (6–12h rise) are unclosable with today's data — handled by nearest-shelter messaging, not by pretending otherwise.
- **Weak labels** on 2024-north remain the val-set ceiling (strong-covered = 0.02 artifact).
- **CHANGE channel** is an annual median (weak vs a true dry-season composite) — the dry-season S1 composite (CHANGE v2) is in flight now that GEE reads work.
- **Cell broadcast / mass SMS** are national-infrastructure gaps (BTRC roadmap), not solvable in-platform.
- **No live national event has yet produced ground truth** — the reason v4.1/v4.2 remain provisional and the reason the field-verification program exists.