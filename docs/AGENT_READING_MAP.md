# Kalopathor — Agent Reading Map
**Purpose:** Canonical reading list for any AI agent working on this project.
**Budget:** 90,832 tokens to read everything below. ~909K tokens remain for response.
**Rule:** No scripts. Docs, configs, results, schemas only.
**Entry point:** Always start with Tier 1 regardless of task.

---

## Budget Summary

| Tier | Domain | Tokens | Cumulative |
|---|---|---|---|
| T1 | Orientation | 16,247 | 16,247 |
| T2 | Model results | 10,352 | 26,599 |
| T3 | Calibration + forecast | 8,236 | 34,835 |
| T4 | Alert engine + contracts | 20,813 | 55,648 |
| T5 | Pipeline + corroboration | 12,806 | 68,454 |
| T6 | Usability + deployment | 11,342 | 79,796 |
| T7 | Frontend + context | 11,036 | 90,832 |

**Remaining for response:** 909,168 tokens

---

## Tier 1 — Orientation (16,247 tokens)
*Read these before touching anything. No exceptions.*

---

### `AGENTS.md` — 1,095 tokens
**Path:** `/home/ubuntu/General/kalopathor/AGENTS.md`
**What it encodes:**
- Current ops model (d3v4.2), checkpoint location, promotion status
- Top 5 open items in priority order
- All credential locations (Lightning, Modal, Vercel, GCS, GitHub)
- Directory map — where everything lives
- Honesty doctrine — 7 non-negotiables that govern every output
- What NOT to trust (legacy directories and files that contain errors)
- Deploy commands from memory

**If you skip it:** You will reference wrong file paths, attempt to use stale credentials, and may unknowingly violate the honesty doctrine (e.g., citing confidence bands that are frozen, showing v5true as the model, claiming 0.65 threshold).

**Key numbers to know after reading:**
- Ops model: `d3v4.2`, checkpoint at `work/checkpoints/d3v4.2_best.pt`
- Live URL: `https://kalopathor-hbgo.vercel.app`
- Feni tripwire IoU: 0.5338
- Confidence language: FROZEN until A1 refit completes

---

### `work/MASTER_REPORT_2026-09-17.md` — 10,457 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/MASTER_REPORT_2026-09-17.md`
**What it encodes:**
- Section 0: Complete file index — every file on disk with absolute path, size, and one-line purpose. This is the map of the entire codebase without running `ls`.
- Sections 1–5: Architecture, training data sources, all model versions with exact metrics, polygon layer specification, calibration state
- Sections 6–9: Uncertainty bands (A1) — what broke, the fix, current result; FLOMPY — all 3 runs with IoU; Forecast system — Branch A/B, GloFAS connection
- Sections 10–14: CAP engine gate chain, EVE routing, exposure data, frontend layer inventory, freshness system
- Sections 15–16: Infrastructure table (what works, what's broken), quick-reference artifact table
- Sections 17–20: Acceptance bar (6.5/8), Google Flood Hub comparison, honesty compliance record, session changelog
- Sections 21–23: Project structure + deploy commands, remaining work by priority, world-class deployment plan (Tier 1–3 with costs)

**If you skip it:** You have no reliable map of the project. You will reinvent context that exists, make decisions already made, and miss the file index which is the fastest way to locate any artifact.

**Cross-references:** Every other file in this reading list is referenced here. Read this first, then use it as an index.

---

### `work/SESSION_UPDATE_2026-09-17.md` — 2,936 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/SESSION_UPDATE_2026-09-17.md`
**What it encodes:**
- GCS credentials: restored, how, and the caveat (personal token, expires)
- WireGuard VPN: deployed on OVH, iPhone config location
- Modal: connected, workspace `mortuzamanisha`, ~$29 remaining
- v5 run (same chips): result — ties v4.2 exactly, expected, not promoted
- v5true run (CHANGE v2): result — Feni +0.004 BUT neg-control 0.335→0.611, gate FAIL
- v5true root cause hypothesis: boro rice irrigation cycles corrupt Dec-Feb dry-season median
- FLOMPY Aug-21: IoU 0.086, timing hypothesis falsified, confirmed NO_CORROBORATION
- A1 refit: cross-model bug confirmed, fix confirmed, Brier −52.5%, 1/10 publishable
- Frontend changes itemised: GFM, IMERG fix, scrubber width, honesty chips, stats strip, banklines, landslide, TVDI, pop2024, polygon fix (v4→v4.2), go-before badge
- GitHub commits: `95ba50c` private, `201b2cc` public
- multi_hazard_alert.py: copied and expanded with wiring plan

**If you skip it:** You'll have the master report's static state but miss the session decisions. Specifically: you won't know the v5true hypothesis for why CHANGE v2 failed, the correct Modal credentials, or the IMERG 250m→2km fix that was applied.

**Supersedes:** `work/WAVE_REPORT_2026-09-07.md` for anything after Sep 7.

---

### `work/METHODOLOGY_PAGE_COPY_2026-09-17.md` — 1,759 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/METHODOLOGY_PAGE_COPY_2026-09-17.md`
**What it encodes:**
- The exact language approved for external-facing honesty disclosure
- Live vs seeded layer table (what's genuinely live, what's August 2024 data)
- What the model was trained on, in plain language
- What confidence classes mean operationally
- The two negative results framed as engineering maturity (v5true falsified, A1 partial)
- Explicit "what is genuinely not done yet" section — shelter data, independent event validation, field user testing
- The pitch-proof sentence: "We'd rather say this plainly now than have a reviewer find it later"

**If you skip it:** You'll give technically correct answers that violate the approved disclosure framing. The language in this file is the calibrated output of multiple review rounds — don't paraphrase it from memory.

**Use case:** Any task involving external communication, demo prep, slide content, or government-facing text must pass through this framing.

---

## Tier 2 — Model Results (10,352 tokens)
*Read when the task touches model performance, promotion decisions, or evaluation.*

---

### `work/checkpoints/d3v4.2_report.json` — 3,847 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/checkpoints/d3v4.2_report.json`
**What it encodes:**
- Per-epoch training history: loss, val IoU, Feni holdout IoU for all 20 epochs
- Final metrics: best_val_iou=0.5432, best swa_val_iou, wall_time
- Feni holdout detail: n=20, per-chip IoU, mean=0.5338
- Sirajganj cross-event: 0.5526 (+0.013 vs v4.1)
- Negative control breakdown by terrain strata
- Buffer ablation results: interior-16 IoU=0.5382, deep-interior-12 IoU=0.5418
- Promotion gate evidence: all three gates documented with measured values

**If you skip it:** You'll cite summary numbers from memory. This file is the source of truth when any number is disputed.

**Key decision encoded:** v4.2 was promoted over v4.1 because: (1) Feni tripwire +0.064, (2) buffer ablation survived interior crop, (3) Sirajganj +0.013. All three gates are documented here.

---

### `work/checkpoints/d3v5true_report.json` — 2,264 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/checkpoints/d3v5true_report.json`
**What it encodes:**
- Per-epoch history for v5true (CHANGE v2 chips): shows Feni holdout climbed to 0.5382 at epoch 17 then declined
- Final best: val IoU 0.5429, Feni 0.5382 (report records 0.4562 because best is saved by val IoU, not Feni)
- Training wall time: 2,379s = 39.6 minutes
- The asymmetry that matters: val IoU ties v4.2 (good), Feni tripwire marginally better (+0.004), but neg-control FPR catastrophically worse

**If you skip it:** You won't have the epoch-level evidence for why the tripwire improvement doesn't warrant promotion. The key is that the improvement peaked at epoch 17 and the model that gets saved (by val IoU) is epoch 13 with Feni=0.4562.

---

### `work/eval/d3v4.2_best_threshold_sweep.json` — 335 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/eval/d3v4.2_best_threshold_sweep.json`
**What it encodes:**
- FPR and TPR at τ = 0.3, 0.4, 0.5, 0.6, 0.7, 0.8 for the ops model
- At τ=0.5: FPR=0.335, TPR=1.000 (perfect recall on Feni positives)
- The TPR=1.000 across all thresholds is the key fact: the model never misses a flooded chip

**If you skip it:** You'll answer threshold questions from memory. This file proves the recall=1.0 property which is the primary argument for the current τ=0.5 choice.

---

### `work/eval/d3v5true_best_threshold_sweep.json` — 335 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/eval/d3v5true_best_threshold_sweep.json`
**What it encodes:**
- Same sweep for v5true: at τ=0.5, FPR=0.611 vs v4.2's 0.335
- TPR still 1.000 across all thresholds — CHANGE v2 didn't hurt recall, only precision
- FPR only drops to 0.409 at τ=0.8, still worse than v4.2 at τ=0.5

**Key decision encoded:** You cannot threshold your way out of the v5true problem. Even at 0.8 threshold, FPR is worse than v4.2 at 0.5. Not promoted.

---

### `work/eval/negative_control_report.md` — 1,551 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/eval/negative_control_report.md`
**What it encodes:**
- The 257-chip neg-control manifest breakdown by terrain strata
- v4.2 per-terrain FPR: chars=0.000, coastal=0.000, river_edge=0.000, hill=0.033, dry_inland=0.800, mixed=0.727
- Root cause analysis of the dry_inland and mixed FPR: double-bounce from urban structures, mixed crop/water monsoon agriculture
- What the neg-control gate is testing and why it's a gate (not just a metric)
- The design decision: chars/coast/river failure = hard block; dry_inland/mixed failure = known pre-existing issue, not a promotion blocker

**If you skip it:** You'll confuse "the gate failed" (strict) with "the metric is imperfect" (expected). The neg-control gate is intentionally three-tier: clean terrain must be clean, problem terrain is tracked but tolerated for the current model generation.

---

### `work/eval/sirajganj_validation.md` — 893 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/eval/sirajganj_validation.md`
**What it encodes:**
- The n=1 independent validation gap — why Sirajganj 2019 counts as cross-event but NOT independent ground truth
- Labels source: S1-Flood-Bangladesh GEE algorithm — cross-algorithm agreement, not ground truth
- v4.2 IoU on Sirajganj: 0.5526 vs v4.1's 0.5400 (+0.013)
- Why DFO polygon was rejected as ground truth (too coarse)
- The honest framing: "generalization evidence, not validation"

**Key decision encoded:** We claim cross-event generalization, not cross-event validation. The distinction matters enormously for government-facing claims.

---

### `work/eval/sirajganj_eval.json` — 617 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/eval/sirajganj_eval.json`
**What it encodes:** Measured IoU values for v4.1 and v4.2 on Sirajganj chips. The numbers that back the validation narrative.

---

### `work/a1_true_refit_result.json` — 510 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/a1_true_refit_result.json`
**What it encodes:**
- `method`: "Branch-A native probs, time-blocked by date (70/30 split)" — the correct approach
- `brier_before`: 0.2513, `brier_after`: 0.1193, `brier_delta_pct`: -52.52 — confirms the cross-model bug was real
- `t_star`: 0.01 — Branch-A probs are already well-calibrated; isotonic is near-trivial
- `publishable_deciles`: 1 — only `[0.8,0.9)` passes
- `decile_results`: per-decile `n`, `n_unclipped`, `coverage`, `status`
- `cross_model_fixed`: true — marks this as the authoritative result

**The single most important result file.** Every calibration decision depends on this. Do not cite the prior `a1_refit_result.json` — it's the cross-model bug.

---

## Tier 3 — Calibration + Forecast (8,236 tokens)
*Read when the task touches confidence language, go-before timestamps, or band methodology.*

---

### `work/calibration/calibration_report.md` — 975 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/calibration/calibration_report.md`
**What it encodes:**
- Timeline of the calibration work: what was attempted in what order
- The split strategy: 15% of 2024-north val set (299 chips, 78M pixels), permanent-water excluded
- Why random split was used (convenience) and why it's a risk (temporal autocorrelation)
- What the isotonic calibrator actually does to the raw sigmoid output
- The t* derivation: raw τ for calibrated probability = 0.5 is 0.6857
- Why confidence language is frozen and what would unfreeze it

**Key decisions encoded:** The 15%/85% split choice, the permanent-water exclusion, the decision to use isotonic over Platt scaling. These are the architectural choices that any A1 refit work builds on.

---

### `work/calibration/calib_fit_summary.json` — 1,026 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/calibration/calib_fit_summary.json`
**What it encodes:**
- Brier score before/after: pixel and chip level improvements
- t* = 0.6857 (the most cited number in calibration work)
- Calibrated values at key thresholds: raw 0.5 → calibrated 0.37, raw 0.6857 → calibrated 0.50
- IoU at t* vs τ=0.5: -1.6pts IoU, -6pts FPR — the precision/recall tradeoff

---

### `work/calibration/calib3_reverify.json` — 326 tokens
**What it encodes:** Verification that the isotonic fit is monotone and the calibrated outputs are within expected range. Confirms no numerical pathologies.

---

### `work/forecast/f5_onesided_report.json` — 401 tokens
**What it encodes:** The one-sided conformal band method metrics — coverage before the cross-model bug was found. Do not cite these numbers externally; they're pre-fix artifacts. Useful for understanding the methodology chain.

---

### `work/forecast/mapie_method_verdict.md` — 5,421 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/forecast/mapie_method_verdict.md`
**What it encodes:**
- Comparison of 4 conformal methods: onesided, asymmetric, stratified, EnbPI
- Why onesided was chosen as the primary method: narrowest valid intervals, best computational cost
- The clipping-to-zero problem identified here first — the analysis that led to finding the cross-model bug
- Decision tree for which method to use for the A1 refit
- MAPIE version constraints and API changes

**If you skip it:** You'll re-derive the method comparison. This file documents 3 weeks of band experimentation. The key finding was that all 4 methods showed the clipping problem — proving the bug was in the data preparation, not the conformal method.

---

### `work/flompy_aug21_result.json` — 87 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/flompy_aug21_result.json`
**What it encodes:**
```json
{
  "pair": "Aug-9 (pre) / Aug-21 (flood peak)",
  "orbit": 114,
  "flompy_area_km2": 75.3,
  "d3v42_area_km2": 43.2,
  "intersection_km2": 8.9,
  "iou": 0.086,
  "corroboration_gate": false,
  "g3_verdict": "NO_CORROBORATION"
}
```
87 tokens. This is the definitive result that closes the FLOMPY story. Read it; don't reason about it from memory. The pair is correct (flood peak day, not post-recession), so the 0.086 IoU is the honest answer.

---

## Tier 4 — Alert Engine + Contracts (20,813 tokens)
*Read when the task touches CAP alerts, data schemas, gate logic, or replay.*

---

### `work/alert/README.md` — 2,191 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/alert/README.md`
**What it encodes:**
- 5-stage gate chain in full: schema validation → exposure → G3 corroboration → confidence class → template fork
- Gate independence analysis: which gates depend on what data
- State machine: Detected → Drafted → Reviewed → Approved → Exported → Archived
- Freshness re-check rule: if data goes stale between Draft and Approve, force re-review
- Human approval: required for any public-facing alert, logged with actor + timestamp
- Gate 4 independence from A1: confirmed, confidence_class comes from FloodPolygon schema not bands

---

### `work/alert/cap_1.2.xsd` — 2,524 tokens
**What it encodes:** The XSD schema that every CAP XML output is validated against. Read this to understand exactly what fields are required, what the CAP 1.2 spec mandates vs what we've added, and what "XSD-valid" means for our outputs.

---

### `work/alert/feni_draft.cap.xml` — 2,444 tokens
**What it encodes:** The real output of `cap_engine.py` on the Feni 2024 event with a safe route available. Read this to understand the bilingual structure, evidence trail encoding, confidence class field, and go-before timestamp format. The XML that any government system would consume.

---

### `work/alert/feni_no_safe_route_draft.cap.xml` — 2,526 tokens
**What it encodes:** Same event, no safe route — shelter-in-place template. The distinction between the two output templates is a design decision: we never fabricate routing when shelter data is absent.

---

### `work/alert/templates/en.json` + `bn.json` — 539 + 1,015 tokens
**What they encode:** The bilingual text templates per alert scenario: `public_evacuation`, `shelter_in_place`, `flash_valley`. These are the human-readable messages that appear in the CAP `description` field. Read before any localization or text-editing task.

---

### `work/contracts/README.md` — 843 tokens
**What it encodes:**
- The 9 canonical schemas and what each covers
- The `data_flag` field design: `real | derived | proxy | missing` — every field in every contract is tagged
- Schema versioning policy: `0.1.0` frozen
- The provenance rule: no field appears without its `data_flag`
- `validate_bundle.py` exit-code contract: 0 = valid, 1 = schema error, 2 = gate failure

---

### `work/contracts/schemas/*.json` — ~3,500 tokens total
**9 schema files.** Read all of them before any data contract work.

Key decisions encoded in each:
- **`flood_polygon.schema.json`** (536t): confidence_class enum (5 values), threshold field required, model_version required, data_flag on every field
- **`forecast_band.schema.json`** (462t): the `lower` field that the conformal bands populate — understanding why it's zero for 40M rows
- **`gauge_station.schema.json`** (438t): danger_level field structure, DAHITI validation badge
- **`alert.schema.json`** (613t): full CAP output schema — maps directly to XSD
- **`shelter.schema.json`** (406t): the empty schema — proves shelter routing was designed, not forgotten
- **`route.schema.json`** (487t): `is_safe_for_recommendation` boolean + `reason_codes` — the "unknown ≠ safe" decision
- **`bundle.schema.json`** (354t): how all components assemble into a single incident
- **`event.schema.json`** (420t): `confidence_class` field origin — confirms Gate 4 independence from A1
- **`data_freshness.schema.json`** (221t): the `mode: seeded|live` field that drives the frontend badge

---

### `work/eval/replay/replay_summary.md` — 1,273 tokens
**What it encodes:**
- 4-event replay results in narrative form: Feni (0 false alarms), Haor (70/100 false alarms), Jamuna (3/8), Coastal (data gaps)
- Why 70% false alarm on Haor is expected (permanent haor water) and what it diagnoses
- The lead times: all 4 replays are post-onset — SAR sees flood after it starts, not before
- What "false alarm" means in this context (polygon in non-flooded area) vs "false alarm" in weather forecasting

---

### Replay configs — 718 + 789 + 774 + 891 tokens
**4 files:** `2024_feni.json`, `2022_haor.json`, `jamuna_riverine.json`, `coastal_surge.json`
**What they encode:** The exact parameters used for each replay: event bbox, date range, gauge anomaly thresholds, expected outcome. Read before modifying the replay system or adding a new event.

---

## Tier 5 — Pipeline + Corroboration (12,806 tokens)
*Read when the task touches the live loop, routing, GEE, or FLOMPY.*

---

### `work/live/gfm_hook.md` — 932 tokens
**What it encodes:**
- The GFM WMS-T endpoint URL pattern and verified HTTP 200 status
- How GFM date-syncing works with the GIBS scrubber
- The GFM Feni miss — IoU below threshold on the Feni bbox — and why it's documented not hidden
- The `gfm://` custom protocol design and how it differs from `gibs://`

---

### `work/eve/shelters/shelter_data_request_log.md` — 888 tokens
**What it encodes:**
- 3 institutional email threads: LGED, MoDMR, UNDP Shelter Cluster
- Dates sent, what was requested, non-response status
- Decision: formally descope shelter routing from pilot; display "pending LGED/MoDMR data" in frontend
- No proxy shelters in any live-facing surface — design decision, not omission

---

### `work/eve/shelters/institutional_requests.md` — 1,241 tokens
**What it encodes:** The formal record of what was requested, from whom, and on what basis. Evidence trail for the institutional engagement claim in any submission.

---

### `work/eve/shelters/hdx/PROVENANCE.md` — 931 tokens
**What it encodes:** Why HDX shelter data was not used — too coarse, outdated, missing coordinates for ~40% of entries. The decision to wait for official LGED data rather than use a flawed proxy.

---

### `work/gee/GEE_AUTH.md` — 529 tokens
**What it encodes:**
- Headless GEE auth via GCP ADC — no browser step required
- `ee.Initialize(project='project-300d4e0e-5c73-49bf-b8a')` verified working
- Read access works, write (exports) requires GCS write access — currently blocked by personal token
- The auth fallback chain: no `~/.config/earthengine/` → falls through to GCP ADC

---

### `work/fixes/ds3_change/DRY_SEASON_REFERENCE.md` — 1,227 tokens
**What it encodes:**
- Why the dry-season composite was built — the CHANGE channel hypothesis
- The GEE export parameters: Dec-Feb, 2019-2024, VV+VH median, 30m, EPSG:4326
- The `dry_vv_median_bgd.tif` output specification (519MB, 2-band)
- Why this is an improvement over the annual WorldCover-based CHANGE channel

---

### `work/fixes/ds3_change/A2a_diagnostic_report.md` — 1,738 tokens
**What it encodes:**
- The A2a dry-swap diagnostic result: what happens when you swap the CHANGE channel baseline mid-training
- Directional evidence that dry-season composite helps: +0.004–0.007 IoU on val, +0.002 on Feni
- Why this was only "directional" — full benefit requires chips6-v2 rebuild (not a mid-run swap)
- The diagnostic chips are at `/mnt/data/chips_feni_dry_diag/`

---

### `work/flompy/feni_agreement_vs_d3v42.md` — 2,425 tokens
**What it encodes:**
- Full FLOMPY run history: annual composite (failed), dedicated Aug-28 pair (failed), dedicated Aug-21 peak-day (failed)
- The timing-mismatch hypothesis from the Aug-28 run — and why it wasn't confirmed even after getting the Aug-21 pair
- FLOMPY algorithm details: what it computes, what "t-score" means, why it disagrees with U-Net
- The mechanistic explanation for the 86% disagreement: different representations of "flooded"
- The G3 gate design: why 0.50 IoU was chosen as the threshold
- The honest framing approved for external use: "two algorithms agree on event, disagree on extent"

---

### `work/RESPONSE_TO_FEEDBACKS5_2026-09-17.md` — 2,895 tokens
**What it encodes:**
- Authoritative resolution of 5 external review items
- **Item 1 threshold**: confirmed 0.5 not 0.65, how the error propagated (docstring → report), process fix proposed
- **Item 2 FLOMPY**: Aug-21 pair identified and run; result still NO_CORROBORATION; timing hypothesis falsified
- **Item 3 calib_split**: confirmed random seed-42, confirmed temporal autocorrelation risk, confirmed fix required
- **Item 4 v5true gates**: discipline held; three-gate requirement stated regardless of tripwire number
- **Item 5 Gate 4 independence**: confirmed FloodPolygon schema origin, not Branch-A bands
- One explicit disagreement with the feedback: the random-split finding is a reason to redo the split, not to distrust the cross-model diagnosis

**Read this before any calibration, threshold, or Gate 4 work.** It contains the most precise published reasoning on each of these topics.

---

## Tier 6 — Usability + Deployment (11,342 tokens)
*Read when the task touches field testing, recruitment, or the deployment plan.*

---

### `work/usability/USABILITY_KIT.md` — 3,631 tokens
**What it encodes:**
- Full usability testing plan: objectives, participant profile, session structure
- 5 test scenarios with exact tasks and success criteria
- Known issues to probe: BN text truncation on mobile, long district names, CAP draft screen
- Ethical guidelines for testing with government officials
- How to record sessions without recording sensitive information
- The minimum viable usability evidence for government deployment

---

### `work/usability/RECRUITER_BRIEF.md` — 1,651 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/usability/RECRUITER_BRIEF.md`
**What it encodes:** The document to send to recruit participants. Specifies: role criteria (district disaster management officers, FFWC gauge readers, NGO field staff), compensation, time commitment, and what the session involves. Send this, don't paraphrase it.

---

### `work/usability/PUNCHLIST_TEMPLATE.md` — 766 tokens
**What it encodes:** Observer checklist for each session — what to note, what's a critical vs minor failure, how to score the 5 test scenarios.

---

### `work/usability/SESSION_SCRIPT_BN.md` — 5,294 tokens
**What it encodes:** The full Bengali-language session script — word-for-word prompts for the facilitator, task instructions in Bangla, probe questions. This is the longest usability file because it's bilingual and unambiguous. Do not translate this on the fly; use it as written.

---

## Tier 7 — Frontend + Context (11,036 tokens)
*Read when the task touches translations, frontend config, or pre-Sep-17 product decisions.*

---

### `frontend/messages/en.json` — 1,914 tokens
**What it encodes:** Every EN translation key in the app. Essential before adding any new UI text — check existing keys, maintain naming convention (`ops.card.*`, `layers.*`, `timeline.*`), avoid duplication.

---

### `frontend/messages/bn.json` — 3,111 tokens
**What it encodes:** Every BN translation. Longer than EN because Bengali Unicode is verbatim. Read before any BN-facing change — the BN strings have been reviewed for cultural appropriateness, not just literal translation.

---

### `frontend/public/data/ops_meta.json` — 103 tokens
**What it encodes:** The live event metadata served to the frontend: `polygon_count=1199`, `threshold=0.5`, `model_version=d3v4.2`, `total_affected=20491387`. If this file is wrong, the stats strip shows wrong numbers. 103 tokens — always worth checking.

---

### `frontend/package.json` — 165 tokens
**What it encodes:** Next.js version (14.2.35), MapLibre GL version, pmtiles library version, next-intl version. Read before any dependency change or before diagnosing a library compatibility issue.

---

### `work/WAVE_REPORT_2026-09-07.md` — 1,856 tokens
**What it encodes:**
- Pre-Sep-17 state: what was attempted in the Sep 7 wave
- A1 failure (0/10 deciles) — the first failure before the cross-model bug was identified
- A2a composite sanity: directional gain confirmed
- A3 FLOMPY dedicated pair: Aug-28 post-recession, below threshold
- Why the Aug-21 pair wasn't run until Sep 17 (not identified as available)
- Known issues carried into Sep 17: calibration clipping, FLOMPY timing, no confident live loop

**Read this if:** You need to understand why something is the way it is and the master report doesn't explain the prior attempt.

---

### `work/KALOPATHOR_PRODUCT_SPEC_BLUEPRINT_2026-08-30.md` — 3,887 tokens
**What it encodes:**
- The original product specification: 8 acceptance gates, 3-tier deployment, stakeholder map
- Why each component exists — the causal chain from "Bangladesh floods" to "CAP alert"
- The non-functional requirements: mobile-first at 375px, BN-first, 3G-accessible
- The explicit decision to build for district DDM officers, not ministry level
- The "honesty-first" design principle origin and its non-negotiability

**Read this if:** You're making a product decision (what to build, what to defer) and want the founding rationale. The spec is the constitution; the master report is the current case law.

---

## Quick-Reference: What to Read for Each Task Type

| Task | Minimum reading |
|---|---|
| New session / general orientation | T1 only (16K tokens) |
| Model training or retraining | T1 + T2 (26.6K tokens) |
| Calibration / confidence bands / A1 | T1 + T2 + T3 (34.8K tokens) |
| CAP engine / alerts / schemas | T1 + T4 (37K tokens) |
| Live loop / FLOMPY / GEE | T1 + T5 (29K tokens) |
| Usability / field testing | T1 + T6 (27.6K tokens) |
| Frontend / translations | T1 + T7 (27.3K tokens) |
| Deployment / CDN / infrastructure | T1 (master report Sec 23) |
| Demo prep / external pitch | T1 + T5 (RESPONSE_TO_FEEDBACKS5) |
| Full comprehension | All tiers (90.8K tokens) |

---

## Files Explicitly Excluded and Why

| File | Tokens | Reason |
|---|---|---|
| `work/strong_labels/FL*/SHP/*.shp.xml` | ~75K | UNOSAT shapefile metadata — raw XML, not readable |
| `work/alert/tests/fixtures/*.json` | ~570K | 5 copies of the same incident bundle — one is enough |
| `work/eve/routes/*.json` | ~1.9M | Raw route geometry — never strategic |
| `frontend/public/data/pmtiles/*_tiles.json` | ~510K | Base64 tile bundles — raw raster data |
| `work/prediction/flood-forecasting/` | ~300K | External submodule test data |
| `work/geophysics/coastsat/` | ~80K | Third-party library internals |
| `work/checkpoints/v4_eval_meta.json` | ~113K | Per-chip IoU dump |
| `work/checkpoints/d3v3_report.json` | ~600 | Retired model, no decisions pending |
| `work/checkpoints/d3v4_report.json` | ~1.2K | Superseded by v4.1 then v4.2 |
| `work/checkpoints/d3v4.1_report.json` | ~1.9K | Rollback only — decision in master report |
| `work/checkpoints/d3v5_report.json` | ~2.3K | Same chips as v4.2, identical result |
| `work/a1_refit_result.json` | ~100 | Superseded by `a1_true_refit_result.json` |
| `work/calibration/go_before_deciles.json` | ~1K | Broken bands output — do not cite |
| `work/forecast/f5_stratified_*.json` | ~430 | Superseded method |
| `work/forecast/rebrand_enbpi_*.json` | ~250 | Superseded method |
| `work/eval/v4_1_threshold_sweep.json` | ~340 | Rollback model |
| `work/eval/d3v5_best_threshold_sweep.json` | ~335 | Identical to v4.2 (same chips) |
| `work/eval/replay/reports/*.cap.xml` | ~9.8K | Sample outputs — feni_draft.cap.xml covers this |
| `work/probs_v4/meta.json`, `work/probs_v42/meta.json` | ~816 | Internal inference metadata |
| `work/multi_prong_manifest.json` | ~1.5K | Old inference manifest |
| `work/dahiti_geoglows_validation.json` | ~1.9K | Gauge validation, endpoint is 404 |
| `work/live/feni_latest/freshness.json` | ~555 | Stale seeded state |
| `frontend/public/data/ffwc_hydrographs.json` | ~47K | Raw gauge time-series data |
| `frontend/public/data/openmeteo_forecast.json` | ~4.6K | Raw forecast data |
| `frontend/public/data/top_flood_polygons.json` | ~1.6K | UI convenience, not strategic |
| `frontend/public/data/pmtiles/manifest.json` | ~3.2K | Auto-generated, covered by master report |
| `HANDOFF-2026-08-30.md`, `REVISED-PLAN-2026-08-30.md`, `INDEX-2026-08-29.md` | ~8K | Pre-Sep-17, superseded |
| `SONNET_INIT_PROMPT.md`, `work/SONNET5_*`, `work/ARENA_*` | ~12K | Review round artifacts |
| `work/GPU_PIPELINE_AUDIT_2026-08-30.md` | ~4.4K | Superseded |
| `work/HIGH_LEVEL_BRUTAL_ASSESSMENT_2026-09-01.md` | ~2K | Superseded |
| `work/NEXT_SESSION_HANDOFF_2026-09-01.md` | ~3.7K | Superseded by master report |
| All `.vercel/project.json`, `.eslintrc.json`, `.claude/settings.local.json` | ~355 | Config noise |
| All GDAL `.aux.xml` files | ~292 | Raster metadata, not decisions |
| `package-lock.json`, `tsconfig.tsbuildinfo`, `next-env.d.ts` | ~63K | Auto-generated |
