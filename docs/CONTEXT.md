# KALOPATHOR — Current State Context

Extracted from the session snapshot (BigDeepseekFlashSwar_CLEANED.md).

## 2. Currently Active Resources (LIVE state)

## 3. Working Dev Techniques Snapshot (how it works TODAY)

- **6ch prep normalization:** 6 channels per chip with per-channel normalization; strong-labeled chips get 2× loss weighting (`strong_weight=2.0`, weak=1.0). Prep pipeline: `d3_6ch_prep_v2.py` → verify with `d3_6ch_verify.py`.
- **G3 false-positive gate (multi-signal):** `flood_px_frac > 0.01 AND vh_mean < 0.44 AND chg_mean < 0.40 AND max_prob > 0.9 AND strata ∉ {dry_inland, mixed}`. Achieves **strict-zero FPR (0.000)** on no-flood scenes, overall 0.008, Feni TPR 0.83. Root cause it fixes: model learned a "dark-SAR wet heuristic" (VH −0.52, CHANGE −0.32 corr) that thresholding alone cannot fix.
- **MONSOON perm-water mask:** applied so permanent water / monsoon channels aren't flagged as flood (part of strata + mask logic in prep/negative control).
- **TTA + SWA:** test-time augmentation at inference; stochastic weight averaging produced `d3vX_swa_best.pt` checkpoints.
- **Asymmetric / one-sided onset bands:** symmetric bands cap onset coverage (~0.72). One-sided lower-only band: **go-before = stored − 0.201** (w_up_1sided=0.2009), `lower = max(0, stored − 0.201), upper = +inf`. One-sided erases the flood-class miss (coverage 1.0000 vs 0.6083 two-sided).
- **EVE dry-edge two-segment routing:** snap origin to nearest NON-flooded graph node (evacuation starts at the flood edge, not centroid); route = boundary-egress segment + main-route segment; go-before = sum of both. Per-population-cluster, not per-polygon.
- **Contract validation:** every object validates against its schema; `validate_bundle.py` exit 0 = valid, exit 1 = tampered. Bundles carry per-object flags `real_data / derived_data / proxy_data / missing_data`.
- **CAP gate chain (template fork):** order = (1) schema gate → (2) exposure gate (no people → advisory may still draft, no public alert) → (3) G3 corroboration → (4) confidence class (→ human review queue, not dropped) → (5) **template fork** (safe route → evacuation; no safe route → shelter-in-place; flash valley <6h → nearest-shelter-vector) → (6) provenance stamping. Two alert types = separate gate profiles (Operational Advisory vs Public Evacuation Alert). **Re-evaluate freshness at Approve time** (drafts can sit for hours → force re-review if stale). Route status is a template fork, NOT a gate — people with no safe route need the alert most.
- **Negative-control regression gate:** `work/eval/run_negative_control_inference.py` + `negative_control_report.md`; runs on every future checkpoint (FPR by terrain, tiered thresholds viz τ0.5 / analyst queue τ0.6 / CAP-draft G3 only).
- **GEE read access:** works via ADC (asset-root 404 harmless); unlocks dry-season composite, CoastSat, MCDWD. Writes blocked (no asset root).

---

## 4. Product Specs

### Model specs (d3v4.1 / d3v4.2)
- **Arch:** EfficientNet-b0 U-Net, **6 channels** (in_channels=6), sigmoid head, `efficientnet-b0-unet-6ch`.
- **v4.1 (FROZEN):** trained 2020+2022; Feni 2024 is an **unseen** event → historical baseline **Feni 0.485**.
- **v4.2 (trained, not promoted):** train = 2020+2022 (5,253) + Feni-train (87, strong-weighted 2×) = 5,340; val = 2024-north (weak labels) + Feni contiguous tripwire (20) + Sirajganj 2019 (cross-algorithm).
- **Split:** 2024-north + Feni for val/eval; Sirajganj 2019 as independent unseen check.
- **Metrics:** see §6 table.

### Alert card IA order (9 items)
Status badge → critical window → affected people → action → shelter → route → gauge → CAP button → evidence trail (collapsed). Voice mode = items 2→4→5→6 only. "No safe route" carries same visual weight as a safe route + shelter-in-place fallback. Confidence badge style reference: spur.us.

## 5. Progress (phase-by-phase, what is DONE)

- **Research audit** — full ML/data/geo/pipeline audit → `RESEARCH_AUDIT_2026-08-29.md`. Headline: deployment-grade ML engine; frontend was the weak link (now built).
- **Data fixes** — DEM/GSW/CHANGE/HAND/TTA corrections (`work/fixes/`). Headline: 6ch pipeline clean.
- **Chips** — 6ch chip prep + verification; strong labels added (Feni + 2020/2022 SHP-derived). Headline: ~5,253 train chips + 87 Feni-train strong.
- **Retrains** — v3 → v4 → v4.1 → v4.2 (Lightning, 0.72 GPU-hr). Headline: v4.1 Feni 0.485 (unseen); v4.2 tripwire +0.064.
- **Polygonize** — v4 predictions → **1,461 polygons** (`detection_polygons_v4.geojson`).
- **Contracts** — 9 schemas + bundle schema + validator frozen & validated. Headline: 100% bundle validation pass.
- **CAP** — draft engine + 3 XSD-valid CAP 1.2 XMLs + failure-path tests. Headline: valid CAP output.
- **Bands** — 0.341 → 0.615 → 0.886 → one-sided onset coverage + flood-class 1.0. Headline: go-before = stored − 0.201.
- **Frontend slices** — scaffold (slice 1) + ops-console (slice 2) + action card. Headline: build passes, 2D default, freshness API live.
- **Sirajganj** — 2019 composite via GEE + 42 chips + both-model eval. Headline: v4.1 0.540 / v4.2 0.553 (cross-algorithm).
- **GEE** — read-auth unblocked. Headline: dry-season composite / CoastSat / MCDWD unlocked.

---

## 6. Metrics

## 7. Items To Do (remaining queue, Sonnet priority order)

1. **Shelter acquisition (emails)** — Sam sends the 3 institutional emails (`eve/shelters/institutional_requests.md`). #1 long pole; nothing computed can replace it. DMB first, LGED second, UNDP third.
2. **EVE re-run on real shelters** — when data lands: `eve/shelters/import_official.py` (ingest → validate shelter schema → merge official>proxy, **demote not delete** proxies → re-run `build_feni_routes.py` v3 → update bundle + card). Expect passability to flip from "all blocked" to real routes.
3. **v4.2 promotion decision** — buffer ablation passed (Δ+0.044 interior), E delivered cross-algorithm number. Decide promote to ops (v4.1 = rollback) vs hold. If promoted: **re-run 6ch polygonize with v4.2** for next polygon refresh.
4. **CAP semantic review** (A1) — non-urgent; XSD-valid ≠ semantically valid; needs someone who has reviewed real CAP feeds; re-check after real EVE routes land.
5. **Field-verification workflow** (E1) — named backlog item (owner = Sam/MoDMR liaison); CPP volunteers photographing flood extent = the only path to closing the n=1 generalization gap; also verifies shelter data.
6. **Live data plumbing (slice 3)** — real FFWC ingest loop, real satmarg next-pass source, station-level stale counts, real alert queue. Currently freshness is seeded, not live.
7. **Frontend slice 3** — wire real routes/shelters into the action card; complete district + field surfaces; real freshness wiring.
8. **Dry-season S1 composite for CHANGE** — graduate from opportunistic to scheduled (better CHANGE channel ch5).
9. **v4.2 polygonize** — refresh polygon layer from v4.2 if promoted.
10. **Event replays** — 2022 haor, 2024 Feni, Jamuna riverine, coastal surge (`work/eval/replay/`); metric: lead-time-at-issuance + shelter-assignment coverage + **would-have-been false-alarm count**.
11. **User testing** — 3–5 Bengali speakers on action card + confidence wording, comprehension + shelter-selection under time pressure → punch-list.
12. **Tabletop + hardening** — with MoDMR/DDM/FFWC; roles (Viewer/Analyst/Approver/Admin), monitoring (freshness API), audit logs, backup/offline.

---

## 9. Warnings (honest caveats & known issues)

- **Flood-class band 0.608 → 1.0 story:** symmetric/asymmetric bands left flood-class-in-onset coverage at 0.608 (2024 flood rows scored 0.48–0.60 sat outside band). The **one-sided lower-only band fixes it (1.0)**, but the asymmetric direction was inverted vs theory (w_up narrower than |w_dn|) — confirmed a **sigmoid probability-clipping artifact** (residual capped by `1−stored`), not error structure.
- **Sirajganj is cross-algorithm agreement, NOT independent validation.** Both models compared against the S1-Flood-Bangladesh algorithm that also made the labels — two SAR methods seeing water in water is partly self-consistency. No independent 2019 BD labels exist publicly (DFO's only polygon unusable; no CEMS/UNOSAT). Do NOT present as "second Feni" or ground-truth accuracy. n=42 chips, single event.
- **Freshness = seeded, not live.** "Fresh" statuses derive from file mtimes/static JSON; SAR age is real (real acquisition), FFWC/forecast are seeded, next-pass is "est.", shelters/model are static. Any external demo must show the amber SEEDED/DEMO banner.
- **No safe route in Feni.** Zero shelters within 22.8 km; Feni roads inundated; only southern corridor + western highland links passable/marginal. EVE honestly returns NO_SAFE_ROUTE everywhere. A closer shelter dataset is the single highest-leverage fix.
- **Weak labels on 2024-north.** The 2024-north val uses weak labels; Feni tripwire uses strong labels (more credible); the 2024-north tie means no in-distribution gain claimed for v4.2.
- **Shelter data absent in Feni/Noakhali** in every open source; institutional asks are in flight and un-answered.
- **CAP happy path untested against real routes** — only tested on a synthetic fixture (real Feni has no safe route). XSD-valid ≠ semantically valid.
- **WMO / GoB external deps** — Google Flood API waitlist (v2 opportunistic), LGED/BWDB/UNDP shelter data (external), MoDMR/FFWC engagement (demo-driven, internally paced), cell-broadcast infra (external).

---
