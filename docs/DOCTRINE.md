# KALOPATHOR — Doctrine (the non-negotiables)

> These rules are structural, not decorative. Any agent touching the product must obey them. Violations are bugs, not opinions.

## 1. Honesty-first

- **Unknown ≠ safe.** A route with `passability: unknown` is `is_safe_for_recommendation: false` with a reason code (`NO_RECENT_PASSABILITY_DATA`). The UI never renders an unknown route as usable.
- **Unknown ≠ zero.** A shelter with unknown capacity renders "Capacity: unknown — verify locally", never a blank or a fake number.
- **No hidden uncertainty.** The user must always be able to distinguish: observed by SAR / forecast by model / inferred from gauges / stale / low-confidence / manually confirmed.
- **No fabricated coverage.** "LIVE PILOT: Feni" vs "DESIGN PREVIEW" is a feature of the pitch, not a footnote.
- **Seeded ≠ fresh.** Any data not produced by a live pipeline shows the SEEDED/DEMO banner and neutral "seeded <date>" chips.

## 2. The honesty lexicon (one language everywhere)

- Bands are **"historical range, not a statistical guarantee"** — with raw `{coverage, n, method}` in the evidence trail (numbers republished only after the in-progress band rebuild verifies; confidence language is frozen until then).
- **go-before reads the LOWER bound, never the midpoint.** (The former `stored − 0.201` one-sided offset is withdrawn — its aggregate coverage was decile-carried. Band offsets are republished only after the split-conformal per-decile rebuild verifies.)
- Cross-algorithm checks are called **"cross-algorithm agreement"**, never "validation" or "second Feni".

## 3. Gates (merge-blocking)

1. **Alert safety**: negative-control FPR measured; G3 multi-signal gate in place; no SAR-only auto-alerts (human confirmation required).
2. **Contract integrity**: `validate_bundle.py` exit 0; no mocked alert/shelter/route fields; timestamps timezone-explicit (+06:00 or Z).
3. **EVE reality**: route has a source graph; shelter has source + verification status; passability has a reason code; unknown ≠ safe; no-safe-route renders correctly.
4. **CAP validity**: CAP 1.2 validates; BN + EN generated together; human approval; evidence trail; regenerable on data change.

## 4. CAP alerting rules

- Two alert types: **Operational Advisory** (officials, lower bar) vs **Public Evacuation Alert** (public, full gate chain).
- Gate order: schema → exposure (no people → no public alert) → multi-signal corroboration (≥2) → confidence class (`review_required` → human queue, never dropped) → **template fork**:
  - safe route → evacuation template (shelter, route, go-before)
  - **no safe route → shelter-in-place / highest-ground template** (route availability is a content selector, NEVER a gate — people with no safe route need the alert most)
  - flash-valley zone → nearest-shelter-vector template, never predictive-evacuation language
- **Approve-time freshness re-check**: if SAR/gauge data crossed staleness between Draft and Approve, force re-review.
- Lifecycle: Detected → Drafted → Reviewed → Approved → Exported → Archived (audit log). Never auto-send.

## 5. Confidence classes (5-tier, multi-signal)

`observed_high / observed_medium / possible / forecast_only / review_required` — derived from SAR confidence + area + shape + gauge + forecast + rainfall + water-mask + double-bounce flag + SAR age. A class is never a bare number in the UI.

## 6. Model governance

- **v4.1 = frozen demo baseline. v4.2 = provisionally promoted ops model** (rollback = one command). Both provisional until one live national event with ground truth.
- Confidence-class thresholds freeze ONLY after calibration lands (in flight).
- Every checkpoint passes: event-split IoU, per-event metrics, negative-control FPR gate, strong-label tripwire (if applicable).
- Calibration is monotonic → IoU decisions don't wait on it; confidence claims DO.

## 7. Do-not-do

- No spectacle-first (globe/particles/cinematics are presentation-only, and only against LIVE data after the Feni floor).
- No auto-send alerts. No hidden uncertainty. No GIS-first public surface.
- No waiting for perfect data before improving EVE (proxy + honest flags are fine).
- No claiming national coverage that isn't live.
- No inventing file contents for the repo — only measured numbers and real data.

## 8. External dependencies (documented, not tasks)

Cell broadcast/BTRC (MoDMR roadmap) · Google Flood Forecasting API (waitlist) · LGED/BWDB shelter data (3 institutional requests in flight) · CPP volunteer field verification (the path to closing the n=1 generalization gap).