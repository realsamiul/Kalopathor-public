# KALOPATHOR — Honest Assessment (our own risk register)

**Date:** 2026-09-01 · **Author:** the team that built and dispatched all of it · **Bias warning:** these are self-critical by design. We publish our own risk register because, for a tool whose entire job is reliability during a disaster, honesty is not a posture — it is the feature. We do not expect partners to take our word for our numbers; we give them the numbers we would use to doubt us.

---

## 1. The honest headline

**This is a genuinely strong research prototype wearing a government-platform costume — and the costume is where the risk lives.**

The ML + data + honesty layer is the real deal: measured numbers, caught our own integrity bugs, refused to fake safe routes, labeled cross-algorithm agreement as such. But "Bangladesh national flood-intelligence platform for MoDMR" is currently an aspiration bolted onto a lab system. No live ingestion, no real users, no deployment hardening, no auth, no shelter data, no actual alert ever sent.

- If you judge it as a **research demo**: 8/10.
- If you judge it as a **deployable ops tool**: 4/10.

The gap between those two is where the remaining work lives — and it is not ML work.

## 2. Brutal truths

### 2.1 The metrics are thinner than the table suggests
- **Feni 0.485 = n=1** — one independent strong-labeled event (UNOSAT Charter). Excellent proof-of-concept, not a validated generalization *rate*.
- **Sirajganj 0.5526 = cross-algorithm agreement** — two SAR methods agreeing on a SAR-derived reference is partly circular. It means the real generalization evidence is still **one event**.
- **2024-north 0.54 = weak labels** — we proved those labels are unreliable (strong-covered 0.02 artifact). The "national IoU" is measured against labels we don't trust.
- **Bottom line: the model has ~1.5 events of genuine independent validation.** Research result, not certification.

### 2.2 The band work exposed a calibration problem we had not fixed
The clipping diagnostic proved the sigmoid outputs **saturate** — residuals are mechanically capped by `1 − stored`. That is not an artifact to work around with one-sided bands; it is a symptom that **the model's probabilities are not calibrated in the 0.6–0.9 range**. We built an elegant band structure on top of an uncalibrated probability. The right fix is isotonic/Platt calibration on the logits — an afternoon — and it makes the whole uncertainty story honest at the root instead of downstream.

### 2.3 Freshness that lies is worse than no freshness
We fixed the UI to say "SEEDED / DEMO". But the deeper truth is the platform had **no live data pipeline at all** — static files, manually seeded. The first MoDMR person who asks "is this live?" gets a "no", and that was the whole product.

### 2.4 The review ladder is partly self-referential
Opus → Sonnet → Fable → Sonnet again — four external reviews, all responding to *our* writeups of *our* work. It produced genuinely good catches (template-fork inversion, clipping, buffer ablation). But it also means we are polishing a shared narrative; shared blind spots survive review. The process looks like diligence and can substitute for it.

### 2.5 Zero user signal
No real user has touched this — no DDM officer, no FFWC analyst, no low-literacy Bengali speaker. Every UX decision (action card, voice mode, confidence wording) is consensus among LLMs that have never talked to a disaster worker. **This is the biggest unhedged bet in the project.**

### 2.6 The true blocker is outsourced and we are not pretending otherwise
Shelter data — the thing that makes EVE real — depends on three cold emails to institutions we have no relationship with. No MoDMR sponsor on the line. The "evacuation vector" value proposition is hostage to a government relationship that does not exist yet. It might not resolve.

### 2.7 Ops engineering is untouched
No auth, no roles, no CI, no pipeline scheduler, no monitoring, no incident response, no backup story. For a tool whose entire pitch is reliability during a disaster, the reliability engineering was zero.

## 3. What is genuinely strong

- **The honesty doctrine is real and rare.** It converts into actual engineering: no fake safe routes, no false conformal claims, seeded-vs-live labels. This is the single most valuable asset, and it is structural, not decorative.
- **Eval discipline:** event splits, per-event metrics, a negative-control regression gate, a caught day0 key-collision that would have faked 0.9995 coverage, a buffer ablation run against our own tripwire.
- **The data fixes were real wins:** monsoon mask (haors preserved), DEM north strip, change channel — all with attributable deltas.
- **Contracts before UI** was the right call; almost nobody does it at this stage.
- **The swarm executed a huge amount in ~3 days** with genuine parallel verification.

## 4. Suggestions (in order of leverage)

1. **Stop building platform; start building a pilot.** Pick Feni. One district, one real user (FFWC/DDM officer), one event. Make the loop real end-to-end (live SAR → live gauges → alert draft → one officer approves → one village gets a message). Scale only after that loop survives contact.
2. **Make live-data plumbing the #1 priority — ahead of all ML.** Truthful freshness on a live FFWC loop, a real tile pipeline, a scheduler.
3. **Calibrate the model now.** Isotonic on the 6ch logits — fixes the root of the band mess.
4. **Get one real government conversation before spending more on EVE.** Ask MoDMR/FFWC: is route-based evacuation alerts even the ask? Where's the shelter data?
5. **Cut the review ladder for routine work.** Reserve the expensive reviews for the 3–4 consequential decisions.
6. **Start the field-verification loop now** (community volunteers photographing flood extent on the next live event) — the only path from cross-algorithm agreement to ground truth, and it needs months of lead.
7. **Set the honest timeline:** 2–3 months from a defensible pilot, not weeks.

---

## 5. Since this assessment — fixes already landed

Written the same day; several of the above are already being answered, and we say how far.

- **One-sided lower-only band (fixes 2.2):** clipping hypothesis confirmed (residual variance collapses as stored→1.0; max residual ≡ `1 − stored`). The two-sided band was dropped from all government-facing text; the **one-sided lower-only band is now the operative uncertainty artifact** — onset coverage **0.822**, **flood-class-in-onset 1.000** (was 0.608), go-before = `stored − 0.201`, lexicon "historical range, not a guarantee". The root cause (uncalibrated sigmoid) is now a scheduled, gated work item, not a silent workaround.
- **Honesty relabel (fixes 2.3):** freshness API + Data Quality panel carry `mode: seeded | live` and an explicit amber SEEDED/DEMO banner. A green badge can no longer mean "a file exists." SAR age is the one genuinely live field and is labeled as such.
- **Buffer ablation (hardens the Feni number):** the tripwire gain survives boundary exclusion — interior 16 chips v4.1 0.5149 → v4.2 0.5590 (**Δ+0.044**; deep-interior +0.042). Not pure spatial leakage.
- **v4.2 provisionally promoted (answer to the promotion question):** all three gates passed; v4.2 is the ops model with **v4.1 as one-command rollback**; both provisional until a live national event with ground truth.
- **Live-plumbing floor in flight (fixes 2.3/2.7, partially):** a real Sentinel-1 RTC → inference → polygonize → freshness pipeline is running for Feni (Phase L), first live granule processed, next-pass model built on measured cadence. Scheduler + GFM corroboration hook in flight.
- **Vercel deployment live:** `kalopathor-hbgo` — the honest penthouse is demonstrable end-to-end today.
- **FLOMPY third signal, CAP approve-feed, replay harness, dry-season CHANGE v2 composite:** all in flight (see `docs/CONTEXT.md`).

## 6. What is still true (unchanged since the assessment)

- **Shelter data remains blocked** (3 institutional asks, unanswered) — the long pole.
- **Zero user signal remains** — the usability pass with real officers is a scheduled next step, not yet done.
- **Ops hardening (auth, roles, CI, monitoring, backup) remains unbuilt** — deliberately sequenced after the pilot loop survives contact.
- **~1.5 events of genuine independent evidence remains** — the field-verification program is the named path to more.

**One-line summary:** the intelligence is honest and good; the operations are being built; the calibration is being fixed; the users have not yet spoken; the blocker is a relationship, not a dataset. Fix the pilot, the plumbing, and the calibration — in that order — and this becomes the real thing. We would rather show you the register than a shinier map.

*Companion to: `docs/PRODUCT_SPEC.md`, `docs/CONTEXT.md`, `docs/DOCTRINE.md`, `docs/SUBMISSION_READY.md`.*