# Kalopathor — Agent Reading Map
**Revised:** 2026-09-18 · Reflects: V2 canonical, A1 vacuity confirmed, Fix Plan active
**Budget:** ~125K tokens to read all tiers. ~875K tokens remain for response.
**Rule:** No scripts. Docs, configs, results, schemas, templates only.
**Entry point:** Always start with T1 regardless of task.

---

## Critical State Changes Since Last Map

Before reading any file, know these:

1. **A1 = 0/10 publishable** — the "1/10 publishable, [0.8,0.9) coverage 0.852" claim is vacuous. With one-sided lower band + binary target, `coverage_unclipped ≡ flood_rate` — tautological, not calibration. Any document citing "1/10" or "0.852" is stale. Confidence language frozen; ship "historical range — not a statistical guarantee" only.

2. **V2 is canonical frontend** — `github.com/realsamiul/Kalopathor-v2`, live at `kalopathor-v2.vercel.app`. V1 (`kalopathor-hbgo.vercel.app`) archived. Local V2 source is ephemeral: `/tmp/kalopathor-v2/frontend/` — re-clone from GitHub if missing.

3. **Active fix plan** — `work/FIX_PLAN_2026-09-18.md` contains 10 tasks (T1–T10) and 6 Sam actions (S1–S6). Not all are done. Check this file before starting any work.

4. **3 doc errors not yet fixed:**
   - `checkpoints/d3v5true_report.json` header says `"version":"v4.2"` — wrong
   - `eval/negative_control_report.md` describes d3v4.1 — ops model is d3v4.2
   - CAP XML samples use `observed_medium` for Feni — correct is `review_required`

---

## Budget Summary

| Tier | Domain | Tokens | Cumulative | Read when |
|---|---|---|---|---|
| T1 | Orientation | 18,200 | 18,200 | Always |
| T2 | Active fixes + feedback | 6,519 | 24,719 | Every session |
| T3 | Model results | 8,686 | 33,405 | Any ML task |
| T4 | Calibration + bands | 8,236 | 41,641 | Confidence/A1 work |
| T5 | Alert + contracts | 20,813 | 62,454 | CAP/schema work |
| T6 | Frontend V2 | 32,833 | 95,287 | Any frontend task |
| T7 | Pipeline + corroboration | 12,806 | 108,093 | Live loop / GEE |
| T8 | Usability | 11,342 | 119,435 | E1 / field testing |
| T9 | Context (conditional) | 5,743 | 125,178 | If asked why |

**Response budget remaining: ~874,822 tokens**

---

## Tier 1 — Orientation (18,200 tokens)
*Read every session, no exceptions.*

---

### `AGENTS.md` — 1,095 tokens
**Path:** `/home/ubuntu/General/kalopathor/AGENTS.md`

**⚠️ Contains stale A1 claim.** The line "A1 single publishable decile: [0.8,0.9) coverage 0.852" is pending correction per Fix Plan T2. Read it knowing this.

**What it encodes:**
- Ops model: d3v4.2, checkpoint path, Feni tripwire 0.5338
- Top 5 open items (A1 refit is still #1 — meaning is corrected, not removed)
- All credential locations (Lightning 11 credits, Modal ~$29, GCS personal ADC expiring, Vercel token)
- Honesty doctrine — 7 non-negotiables
- Directory map, what not to trust, deploy commands

---

### `work/MASTER_REPORT_2026-09-17.md` — 10,457 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/MASTER_REPORT_2026-09-17.md`

**⚠️ Contains stale A1 language (§7) pending T2 fix.** Section 25 (most recent) is authoritative for current state.

**What it encodes:**
- §0: Complete file index — every file on disk with absolute path, size, purpose
- §1–16: Full technical state — architecture, training, models, calibration, FLOMPY, forecast, CAP, EVE, frontend
- §17–20: Acceptance bar, Flood Hub comparison, honesty compliance, session changelog
- §21: Project structure + canonical deploy commands
- §22: What remains — ordered by value
- §23: World-class deployment plan (GCS CDN, CloudFront, Cloud Run — costs)
- §24: Frontend inventory — V1 vs V2 full comparison, component tables
- **§25: Unified Fix Plan** — A1 vacuity proof, V2 bug list, CAP reconciliation, CHANGE v6 plan (most current section)

**Use §25 as the canonical task list for this session.**

---

### `work/SESSION_UPDATE_2026-09-17.md` — 2,936 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/SESSION_UPDATE_2026-09-17.md`

**⚠️ Contains "1/10 publishable" — stale per A1 vacuity finding.**

**What it encodes:** Sep 17 session changes — GCS restored, WireGuard deployed, Modal connected, v5true gate fail (CHANGE v2 falsified), FLOMPY Aug-21 confirmed NO_CORROBORATION, A1 cross-model bug fixed but result now known vacuous, all frontend changes itemised (GFM, IMERG fix, scrubber, honesty chips, banklines, hazard layers, pop2024, polygon v4→v4.2 fix).

---

### `work/METHODOLOGY_PAGE_COPY_2026-09-17.md` — 1,759 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/METHODOLOGY_PAGE_COPY_2026-09-17.md`

**⚠️ Contains A1 single-decile claim — pending T2 fix. Do not use the numeric claim.**

**What it encodes:** Approved external-facing language for every honesty disclosure. Live vs seeded table. What confidence classes mean. The two negative results framed as engineering maturity. "What is genuinely not done yet" section. The calibrated pitch-proof sentence. **Use this verbatim for any external communication — do not paraphrase.**

---

### `work/AGENT_READING_MAP.md` — 7,906 tokens
**This file.** Read it once per session to orient token budget.

---

## Tier 2 — Active Fixes + Feedback (6,519 tokens)
*Read every session — these define the current work queue.*

---

### `work/FIX_PLAN_2026-09-18.md` — 4,600 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/FIX_PLAN_2026-09-18.md`

**What it encodes:**
- **§1: A1 vacuity proof** — mathematical demonstration that coverage_unclipped ≡ flood_rate with one-sided lower band + binary target. This is the single most important finding.
- **§2: Producer script gap** — `a1_true_refit_result.json` has no reproducible source script
- **§3: 8 doc hygiene issues** sourced to specific file:line
- **§4: 9 confirmed-correct findings** — what NOT to re-investigate
- **§5: T1–T10 fix tasks** with exact scripts, commands, success criteria
- **§6: S1–S6 Sam actions** blocking T7 and live loop
- **§7: Do-not-fix list** — FLOMPY result, v5true gate fail, calibration, CAP gates
- **§8: Today's execution order** — phases 1–5 local, phase 6 blocked on S1

**Read this before starting any task. It is the session contract.**

---

### `work/DeepseekFrontendFeedback.txt` — 1,919 tokens
**Path:** `/home/ubuntu/General/kalopathor/work/DeepseekFrontendFeedback.txt`

**What it encodes:**
- Independent V1 vs V2 comparison table — V2 wins on every dimension
- **V2 canonical verdict:** "V2 has everything V1 has plus more... V1 has no advantage"
- 3 specific V2 bugs with file:line:
  1. `route.ts:21,135,138` — d3v4.1 hardcoded, should be d3v4.2
  2. `ops_meta.json:14` — stale source string "(d3v4.1)"
  3. `OperationsConsole.tsx:92-93,1179,1183` — `total_area_km2` and `gauge_count` expected in ops_meta but absent → renders "undefined km²"
- Item 6 self-resolved (freshness route layer keys are correct)
- `action-states/` confirmed present in V2 — no migration needed

---

## Tier 3 — Model Results (8,686 tokens)
*Read for any task touching model performance, training, or promotion decisions.*

---

### `work/checkpoints/d3v4.2_report.json` — 3,847 tokens
**⚠️ Authoritative.** Per-epoch history, Feni holdout 0.5338, buffer ablation, all 3 gate evidences. Source of truth for any number dispute.

**Key decision encoded:** v4.2 promoted over v4.1 because: Feni tripwire +0.064, buffer ablation survived interior-16 crop (+0.044), Sirajganj +0.013. All measured, all here.

---

### `work/checkpoints/d3v5true_report.json` — 2,264 tokens
**⚠️ Header is wrong** — says `"version":"v4.2"` (stale copy-paste). Fix Plan T3 corrects this. Read knowing: this is v5true, best Feni epoch 17 = 0.5382, but neg-control FPR 0.611 → gate fail.

**Key decision encoded:** The asymmetry — Feni +0.004 looks good but doesn't survive the neg-control gate. The model saved by val IoU (epoch 13, Feni=0.4562) is not the epoch with best Feni — this is why the report looks inconsistent.

---

### `work/eval/d3v4.2_best_threshold_sweep.json` — 335 tokens
FPR/TPR at τ=0.3–0.8 for ops model. At τ=0.5: FPR=0.335, TPR=1.000 (perfect recall). Read before any threshold decision.

---

### `work/eval/d3v5true_best_threshold_sweep.json` — 335 tokens
Same sweep for v5true. At τ=0.5: FPR=0.611. At τ=0.8: FPR=0.409 — still worse than v4.2 at 0.5. **Cannot threshold your way out of the v5true failure.**

---

### `work/eval/sirajganj_validation.md` — 893 tokens
The n=1 independent validation gap — why Sirajganj is cross-event evidence, not independent ground truth. v4.2 = 0.5526 (+0.013 vs v4.1). Read before any generalization claim.

---

### `work/a1_true_refit_result.json` — 510 tokens
**⚠️ The "publishable_deciles: 1" claim is vacuous** per Fix Plan §1. `coverage_unclipped = 0.852` for `[0.8,0.9)` = flood_rate in that bin, not calibration evidence. Read as: "cross-model bug was real (Brier −52.5%), but band coverage metric is structurally uninformative." No numeric coverage claim may be cited from this file.

Also note: `"reproducible": false` (no producer script on disk — inline Modal session).

---

### `work/eval/negative_control_report.md` — 502 tokens (after archive header)
**⚠️ ARCHIVED — describes d3v4.1, not d3v4.2.** Fix Plan T4 prepends archive header. Use `d3v4.2_best_threshold_sweep.json` for authoritative FPR numbers. Read only for historical context on gate design rationale.

---

## Tier 4 — Calibration + Bands (8,236 tokens)
*Read for any task touching confidence language, go-before timestamps, or band methodology.*

---

### `work/calibration/calibration_report.md` — 975 tokens
Timeline of calibration work, why random split is a risk, what isotonic does to raw sigmoid, t*=0.6857 derivation, why confidence language is frozen.

**Key correct decision:** Isotonic_v42.pkl calibrates U-Net pixel sigmoid → polygon confidence class. This is correct and unaffected by the A1 vacuity. The issue is downstream: using U-Net isotonic for Branch-A LightGBM probs = cross-model transfer. Gates 1–5 are unaffected.

---

### `work/calibration/calib_fit_summary.json` — 1,026 tokens
t*=0.6857, Brier −6% pixel / −17% chip, calibrated values at key thresholds. Numerically correct; concerns are downstream of this file.

---

### `work/calibration/calib3_reverify.json` — 326 tokens
Confirms isotonic is monotone, no numerical pathologies.

---

### `work/forecast/f5_onesided_report.json` — 401 tokens
One-sided conformal band metrics (pre-vacuity-finding). Do not cite coverage numbers. Useful for methodology chain only.

---

### `work/forecast/mapie_method_verdict.md` — 5,421 tokens
**⚠️ Important: Line 134 already flagged "unclipped coverage ≈ flood_rate" on Sep 7.** The A1 vacuity finding was documented here first but not followed to its conclusion. Read this before any conformal band work — it contains the full method comparison and the seed of the vacuity proof.

---

### `work/flompy_aug21_result.json` — 87 tokens
87 tokens. IoU=0.086, orbit 114, Aug-9/Aug-21 peak-day pair. The correct dedicated pair. Result is definitive. G3 gate: NO_CORROBORATION. Read; never cite from memory.

---

## Tier 5 — Alert Engine + Contracts (20,813 tokens)
*Read for any task touching CAP alerts, schemas, gates, or replay.*

---

### `work/alert/README.md` — 2,191 tokens
5-stage gate chain, state machine, freshness re-check rule, Gate 4 independence from A1 (confirmed). **Current issue:** CAP XML samples use `observed_medium` for Feni; correct is `review_required` (Fix Plan T6 pending).

---

### `work/alert/cap_1.2.xsd` — 2,524 tokens
XSD schema. Every CAP output must validate against this.

---

### `work/alert/feni_draft.cap.xml` — 2,444 tokens
**⚠️ Uses `observed_medium` — stale. Fix Plan T6 corrects to `review_required`.** Read as "correct structure, wrong confidence class."

---

### `work/alert/feni_no_safe_route_draft.cap.xml` — 2,526 tokens
**⚠️ Uses 2026-08-30 proxy dates and `observed_medium`. Fix Plan T6 corrects both.**

---

### `work/alert/templates/en.json` + `bn.json` — 539 + 1,015 tokens
Bilingual CAP text templates per scenario. Read before any localisation task.

---

### `work/contracts/README.md` — 843 tokens
9-schema architecture, data_flag field design, `validate_bundle.py` exit-code contract, schema versioning policy.

---

### Contract schemas — ~3,500 tokens total
9 files in `work/contracts/schemas/`. All required before any data contract work. Key: `event.schema.json` confirms Gate 4 independence (confidence_class comes from FloodPolygon schema, not Branch-A bands).

---

### `work/eval/replay/replay_summary.md` — 1,273 tokens
4-event replay results: Feni 0 false alarms, Haor 70/100 (permanent water), Jamuna 3/8. All post-onset — SAR is accuracy not warning. **Also documents:** `eval/replay/configs/2024_feni.json` hardcodes `confidence_class: observed_medium` — Fix Plan T6 corrects to `review_required`.

---

### Replay configs — 718 + 789 + 774 + 891 tokens
4 files: `2024_feni.json`, `2022_haor.json`, `jamuna_riverine.json`, `coastal_surge.json`.

---

## Tier 6 — Frontend V2 (32,833 tokens)
*Read for any frontend task. V2 only — V1 is archived.*

**Canonical source:** `github.com/realsamiul/Kalopathor-v2`
**Local path:** `/tmp/kalopathor-v2/frontend/` (ephemeral — re-clone if `/tmp` was cleared)
**Live:** `https://kalopathor-v2.vercel.app`
**Deploy:** `cd /tmp/kalopathor-v2/frontend && vercel deploy --prod --token $VERCEL_TOKEN --yes`

---

### `frontend/app/components/OperationsConsole.tsx` — 15,211 tokens
**Path (V2):** `/tmp/kalopathor-v2/frontend/app/components/OperationsConsole.tsx`

The primary map component. V2 vs V1 differences: `useBreakpoint()` for mobile-first layout, `SheetKind` state machine for bottom sheets, `forecastAvailable` HEAD check, keyboard shortcuts (1–7/L/Esc), URL state encoding. All protocols registered here: `pmtiles://`, `gibs://` (via `registerGibsProtocol()`), `gfm://`, `hazard://`.

---

### `frontend/app/api/freshness/route.ts` — 1,460 tokens
**Path (V2):** `/tmp/kalopathor-v2/frontend/app/api/freshness/route.ts`

**⚠️ Two bugs pending Fix Plan F1+F2:**
- `line 21`: `MODEL_REPORT = .../d3v4.1_report.json` → should be `d3v4.2_report.json`
- `line 135,138`: `version: 'd3v4.1'` → should be `'d3v4.2'`
- `line 15`: `WORK = '/root/General/kalopathor/work'` → should be `'/home/ubuntu/General/kalopathor/work'`

Server-side freshness API reads real file metadata. Currently returns `failed` silently for all file checks because `/root/` path doesn't exist on this server.

---

### `frontend/lib/bundle.ts` — 2,846 tokens
**Path (V2):** `/tmp/kalopathor-v2/frontend/lib/bundle.ts`

ActionCard state derivation from bundle data. Includes `ConfidenceClass` type with `forecast_only` value (defined but unreachable — no bug, just unused). Read before any ActionCard or confidence display work.

---

### `frontend/lib/map-config.ts` — 1,759 tokens
**Path (V2):** `/tmp/kalopathor-v2/frontend/lib/map-config.ts`

All LayerId types, GIBS/GFM URL builders, IMERG 2km matrix fix, scrubber date range (Jun 2024→Sep 2026). GIBS protocol is extracted to `lib/map-protocols.ts` in V2 (shared with HeroMap).

---

### `frontend/app/components/HeroMap.tsx` — 1,256 tokens
**V2 only.** Live GIBS satellite hero on landing page — GIBS_EVENT_DATE (2024-08-12) + hero_polygons.json + slow camera drift. Sets worker URL via `setWorkerUrl('/lib/maplibre-gl-worker.mjs')`.

---

### `frontend/app/components/TimeScrubber.tsx` — 1,906 tokens
**V2 only.** Standalone temporal scrubber extracted from OperationsConsole. Timeline play loop. Handles both GIBS date and prediction PMTiles horizon selection.

---

### `frontend/app/components/ui/BottomNav.tsx` — 646 tokens
**V2 only.** Mobile bottom navigation — 5 workflow tabs + more. Scrim-free, map stays tappable beneath sheets.

---

### `frontend/app/components/ui/Sheet.tsx` — 1,665 tokens
**V2 only.** Draggable bottom sheet — scrim-free design so map interaction continues beneath open sheet. Used for card/gauge/list/quality/time/more views on mobile.

---

### `frontend/app/components/ui/TopBar.tsx` — 1,146 tokens
**V2 only.** Mobile top bar with SAR/FFWC/FCST/NEXT S1 stats, locale switcher, menu.

---

### `frontend/app/components/ActionCard.tsx` — 4,342 tokens
**Path (V2).** Polygon click panel — confidence class display, affected people, CAP draft link, evidence trail, go-before timestamp (labeled "estimate · pending recalibration"), provenance footer. V2 version is substantially rewritten vs V1.

---

### `frontend/app/[locale]/approval/page.tsx` — 1,852 tokens
**Path (V2).** 206-line bilingual CAP 1.2 draft preview. Approve/Reject buttons correctly `disabled` with `cursor-not-allowed` + `opacity-60`. V2 vs V1: V1 was 40 lines (pure stub); V2 is a real bilingual preview. **⚠️ Still pending Fix Plan T6:** confidence_class in sample data uses `observed_medium` — should be `review_required`.

---

### `frontend/messages/en.json` — 1,914 tokens
**Path (V2).** All EN translation keys. Check before adding any new UI text.

---

### `frontend/messages/bn.json` — 3,111 tokens
**Path (V2).** All BN translations — reviewed for cultural appropriateness. Use verbatim.

---

### `frontend/public/data/ops_meta.json` — 103 tokens
**⚠️ Two bugs pending Fix Plan T5/F3:**
- `"source": "... (d3v4.1)"` → should be `d3v4.2, τ=0.5`
- Missing `total_area_km2` and `gauge_count` fields → V2 renders `undefined km²` and wrong gauge count

Correct values: `total_area_km2: 21954`, `gauge_count: 115`.

---

## Tier 7 — Pipeline + Corroboration (12,806 tokens)
*Read for live loop, GEE, EVE routing, or FLOMPY tasks.*

---

### `work/live/gfm_hook.md` — 932 tokens
GFM WMS-T endpoint, `gfm://` protocol design, GFM Feni miss documented.

---

### `work/live/watch.py` — 1,015 tokens (script — skip per reading rule)
Referenced here for awareness. The live loop entry point.

---

### `work/eve/shelters/shelter_data_request_log.md` — 888 tokens
3 institutional emails sent, no reply. Decision: descope shelter routing from pilot. "Pending LGED/MoDMR data" in frontend.

---

### `work/eve/shelters/institutional_requests.md` — 1,241 tokens
Formal record of institutional engagement. Evidence trail for any submission.

---

### `work/gee/GEE_AUTH.md` — 529 tokens
Headless GEE auth via GCP ADC. Reads work, exports blocked (personal token). Fix Plan S1 (GCS SA key) unblocks exports.

---

### `work/fixes/ds3_change/DRY_SEASON_REFERENCE.md` — 1,227 tokens
Why the dry-season composite was built. GEE export parameters. Why it was an improvement over WorldCover-based CHANGE. Does not explain the v5true failure — that came from the boro rice cycle contaminating the Dec–Feb window.

---

### `work/fixes/ds3_change/A2a_diagnostic_report.md` — 1,738 tokens
A2a dry-swap result: directional evidence that dry-season composite helps (+0.004–0.007). Basis for the v5true hypothesis. The v5true gate fail falsified the specific composite — not the direction.

---

### `work/flompy/feni_agreement_vs_d3v42.md` — 2,425 tokens
Full FLOMPY run history, all 3 pairs. Algorithm disagreement explanation. G3 gate design rationale. **Fix Plan T8:** this file is correct; the conflation is in the master report §22 item 5 (CHANGE channel work ≠ FLOMPY fix).

---

### `work/RESPONSE_TO_FEEDBACKS5_2026-09-17.md` — 2,895 tokens
FeedbackS5 resolution — threshold 0.5 confirmed, calib_split random-split confirmed, Gate 4 independence confirmed. Contains one explicit disagreement with the external reviewer (split randomness is a reason to redo the split, not to distrust the cross-model diagnosis). Most precise published reasoning on each topic.

---

### `work/eval/replay/replay_summary.md` — 1,273 tokens
4-event replay. SAR = accuracy not warning (−42 to −150h post-onset). Lead time is a structural constraint of SAR revisit cycle, not a model limitation.

---

## Tier 8 — Usability + Deployment (11,342 tokens)
*Read for E1 recruitment, field testing, or deployment infrastructure.*

---

### `work/usability/USABILITY_KIT.md` — 3,631 tokens
Full usability testing plan: objectives, participant profile, 5 test scenarios with success criteria, ethical guidelines, minimum viable usability evidence.

### `work/usability/RECRUITER_BRIEF.md` — 1,651 tokens
**Send this, don't paraphrase it.** Role criteria, compensation, time commitment.

### `work/usability/PUNCHLIST_TEMPLATE.md` — 766 tokens
Observer checklist per session.

### `work/usability/SESSION_SCRIPT_BN.md` — 5,294 tokens
Full Bengali-language session script. Word-for-word facilitator prompts. Use as written.

---

## Tier 9 — Context (conditional, 5,743 tokens)
*Read only if you need to understand why something is the way it is.*

---

### `work/WAVE_REPORT_2026-09-07.md` — 1,856 tokens
Pre-Sep-17 state. Read only if: task requires understanding prior attempts (e.g., why A1 was re-run twice, why Aug-28 FLOMPY pair was used before Aug-21).

### `work/KALOPATHOR_PRODUCT_SPEC_BLUEPRINT_2026-08-30.md` — 3,887 tokens
Original product specification — 8 acceptance gates, 3-tier deployment, stakeholder map, non-functional requirements (mobile-first 375px, BN-first, 3G-accessible), "honesty-first" principle origin. Read if making a product decision and want the founding rationale.

---

## Quick-Reference: What to Read by Task Type

| Task | Minimum tiers | Key files |
|---|---|---|
| New session / general orientation | T1 + T2 | AGENTS.md, MASTER_REPORT §25, FIX_PLAN |
| Execute Fix Plan T1–T6 | T1 + T2 + T4 + T5 | FIX_PLAN, a1_true_refit_result, alert/README.md |
| Any model / ML work | T1 + T3 | d3v4.2_report.json, threshold sweeps |
| Calibration / confidence language | T1 + T2 + T4 | FIX_PLAN §1, mapie_method_verdict.md, calibration_report.md |
| Frontend V2 edits | T1 + T2 + T6 | FIX_PLAN F1-F3, route.ts, ops_meta.json, OperationsConsole.tsx |
| CAP / alerts / schemas | T1 + T5 | alert/README.md, XSD, confidence_class reconciliation |
| Demo prep / external pitch | T1 + T2 | METHODOLOGY_PAGE_COPY (no A1 numeric claims), FIX_PLAN §7 |
| CHANGE v6 retrain (T7) | T1 + T3 + T7 | FIX_PLAN T7, GEE_AUTH.md, A2a_diagnostic_report.md |
| E1 usability | T1 + T8 | RECRUITER_BRIEF.md, SESSION_SCRIPT_BN.md |
| Live loop wiring | T1 + T7 | watch.py, live_feni_pipeline.py, gfm_hook.md |
| Full comprehension | All tiers | ~125K tokens |

---

## Files Explicitly Excluded

| File | Tokens | Reason |
|---|---|---|
| V1 frontend source (`kalopathor-hbgo`) | ~60K | V1 archived — V2 is canonical |
| `work/strong_labels/FL*/SHP/*.shp.xml` | ~75K | Raw UNOSAT shapefile metadata XML |
| `work/alert/tests/fixtures/*.json` | ~570K | 5 copies of same incident bundle |
| `work/eve/routes/*.json` | ~1.9M | Raw route geometry |
| `frontend/public/data/pmtiles/*_tiles.json` | ~510K | Base64 tile bundles |
| `work/prediction/flood-forecasting/` | ~300K | External submodule / CAMELS test data |
| `work/geophysics/coastsat/` | ~80K | Third-party library internals |
| `work/checkpoints/v4_eval_meta.json` | ~113K | Per-chip IoU dump |
| `work/checkpoints/d3v3_report.json` | ~600 | Retired model |
| `work/checkpoints/d3v4_report.json` | ~1.2K | Superseded |
| `work/checkpoints/d3v5_report.json` | ~2.3K | Same chips as v4.2, identical result |
| `work/a1_refit_result.json` | ~100 | Cross-model bug version, superseded |
| `work/calibration/go_before_deciles.json` | ~1K | Broken bands output — do not cite |
| `work/forecast/f5_stratified_*.json` | ~430 | Superseded method |
| `work/forecast/rebrand_enbpi_*.json` | ~250 | Superseded method |
| `work/eval/v4_1_threshold_sweep.json` | ~340 | Rollback model |
| `work/eval/d3v5_best_threshold_sweep.json` | ~335 | Identical to v4.2 (same chips) |
| `work/eval/replay/reports/*.cap.xml` | ~9.8K | Sample outputs — live XMLs cover this |
| `frontend/package-lock.json` | ~63K | Auto-generated |
| All GDAL `.aux.xml` files | ~292 | Raster metadata |
| `work/HANDOFF-*`, `REVISED-PLAN-*`, `INDEX-*` | ~8K | Pre-Sep-17, superseded |
| `work/SONNET5_*`, `work/ARENA_*` | ~12K | Review round artifacts, decisions in master report |
| `work/GPU_PIPELINE_AUDIT_2026-08-30.md` | ~4.4K | Superseded |
| `work/HIGH_LEVEL_BRUTAL_ASSESSMENT_2026-09-01.md` | ~2K | Superseded |
| `work/NEXT_SESSION_HANDOFF_2026-09-01.md` | ~3.7K | Superseded |
| `work/multi_prong_manifest.json` | ~1.5K | Old inference manifest |
| `work/dahiti_geoglows_validation.json` | ~1.9K | DAHITI endpoint is 404 |
| `frontend/public/data/ffwc_hydrographs.json` | ~47K | Raw gauge time-series |
| `frontend/public/data/openmeteo_forecast.json` | ~4.6K | Raw forecast data |
| `work/sirajganj_inference_2019.json` | ~3.4K | Raw output, summary in master report |
