# KALOPATHOR — Product Spec (condensed, product-facing)

## Detection model (the core)

- EfficientNet-B0 U-Net, **6 input channels**: `VV`, `VH` (granite-normalized Sentinel-1 dB), `DEM` (MERIT+Copernicus full-country), `HAND` (MERIT Hydro), `MONSOON` (Jun–Oct water recurrence — preserves haors), `CHANGE` (VV vs dry-reference dB).
- Sigmoid binary head; SWA + OneCycleLR training; TTA (+0.011 IoU) at inference.
- **Measured metrics (event-split, honest):**

| Metric | Value |
|---|---|
| 2024-north val IoU (v4.1 / v4.2) | 0.5433 / 0.5432 |
| Feni 2024 — unseen event, strong labels (v4.1) | **0.485** |
| Feni tripwire holdout (v4.2, strong labels) | **0.5338** (+0.064 vs v4.1) |
| Sirajganj 2019 — cross-algorithm agreement | v4.1 0.540 / v4.2 0.553 |
| False-positive gate (G3 multi-signal) | FPR 0.000 on no-flood scenes, Feni TPR 0.83 |
| North-strip gain from DEM fix | +0.019 |

- **Evidence hierarchy (never overclaim):** ONE independent unseen event (Feni, UNOSAT labels) + ONE cross-algorithm agreement (Sirajganj) + in-distribution weak-label val. Both v4.1/v4.2 are provisional until one live national event with ground truth.

## Forecast & hydrology

- LightGBM dual-branch (SAR-anchored + GloFAS) with **one-sided lower-only conformal bands** — go-before timestamps read `stored − 0.201` (lower bound, never midpoint). Bands labeled "historical range, not a statistical guarantee"; flood-onset coverage 1.0 on the onset stratum (n=403k).
- GloFAS v5 (EWDS), Open-Meteo Flood API (no-key), FFWC (115 observed + 81 forecast stations scraped), UTide harmonics (M2 0.695 m).

## Exposure

- HRSL/WorldPop × flood polygons → affected population per polygon/district. Feni district: ~184k; national event extent: 20.5M (11.9% of BD).

## EVE (evacuation vector engine)

- National OSM road graph + 3 pilot graphs (Feni/Khowai, Khulna south, Bhola). Shelter layer = 346 proxy points (OSM + HDX), Feni gap = zero official shelters within 20 km (honest: **no safe routes currently exist in Feni; the system says so explicitly**). Institutional shelter requests in flight (LGED/MoDMR, UNDP Shelter Cluster, DMB).
- Route objects: two-segment (flood-boundary egress + road route), passability states Passable/Marginal/Likely-blocked/Blocked/Unknown — **unknown ≠ safe**.

## Alerting

- CAP 1.2 drafts (XSD-valid) via cap-tools. Two types: **Operational Advisory** (officials) vs **Public Evacuation Alert** (public). Lifecycle: Detected → Drafted → Reviewed → Approved → Exported → Archived; **human approval mandatory**; approve-time freshness re-check; evidence trail with `{coverage, n, method}`.
- Gate chain: schema → exposure (people present) → multi-signal corroboration (≥2 of SAR/gauge/rainfall/forecast) → confidence class → **template fork** (safe-route / no-safe-route / flash-valley), never auto-send.

## Modules & surfaces

- Modules: Detect · Forecast · Exposure · EVE · Alert · Monitor.
- Surfaces: National Command (2D ops map, workflow rail, right action card) · District Ops · Field/Public (instruction-first, Bengali-first, voice).
- Bilingual EN/BN from day one; Noto Sans Bengali bundled; voice mode reads only: critical window → action → shelter → route.