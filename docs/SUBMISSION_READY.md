# KALOPATHOR — Program Submission One-Pager

**For:** AWS Activate Founders + GCP for Startups · **Date:** 2026-09-01 · **Status:** vertical-slice pilot ready; live loop in flight.

---

## The product (3 lines)

KALOPATHOR is a bilingual (Bengali/English) flood-intelligence platform for Bangladesh's disaster-management authorities. It turns Sentinel-1 SAR, gauge, and forecast data into the thing an official actually needs: **which places are flooding, who is affected, what to do, where to go, and which CAP-compliant alert to issue — with the uncertainty stated honestly.** The pipeline is end-to-end and depth-first: SAR flood detection → forecast → population exposure → evacuation routing → bilingual CAP 1.2 alert drafting, built on a national foundation of data contracts, event-split eval discipline, and an honesty doctrine.

## The pilot thesis (depth-first vertical slice)

We deliberately built **ground + penthouse, not horizontal breadth**: the foundation (contracts, eval discipline, honesty doctrine) and a working end-to-end loop for one pilot district — **Feni** — rendering honest states everywhere (no fake safe routes, seeded-vs-live labels, "unknown ≠ safe"). The 20 remaining "iron floors" (live ingestion, ops breadth, deployment hardening) are fully slotted and pending *by design*: one district fully real beats twenty half-real. A live Sentinel-1 pipeline for the Feni bbox is running now; the national scale-out follows only after that loop survives contact.

## What the credits fund

- **Live-satellite pipeline on the Feni pilot** — a real Sentinel-1 RTC → 6-channel inference → polygonize → freshness loop, served through **eoAPI / TiTiler** tile infrastructure (cloud-native OGC APIs for the raster/vector stack).
- **GCS object storage** — the national raster/vector/parquet product set (polygon layers, banded predictions, COGs, PMTiles).
- **GPU inference** — Lightning training + inference for v4.2 retrains and the live detection loop.
- **Vercel / hosting** — the Next.js 14 + MapLibre ops console (already live as `kalopathor-hbgo`).
- **Satellite data pulls** — Planetary Computer / GEE / MODIS (IMERG, MCDWD) data egress and processing for the live loop and the dry-season composite.

## 2–3 month roadmap

1. **Calibration (month 1, in flight):** isotonic calibration on the v4.2 logits, decile verification, re-measure onset/flood-class coverage, update the uncertainty lexicon. *Gate: no new confidence claims until the decile check passes.*
2. **Live Feni loop (month 1–2, in flight):** scheduler (cron/systemd), third-signal corroboration (FLOMPY), approve-time re-check, truthful `mode: live` freshness.
3. **Usability (month 2):** 3–5 real Bengali-speaking officers on the action card + confidence wording; punch-list into the card. *This is the unhedged bet — real user signal replaces LLM consensus.*
4. **Pilot (month 3):** one district, one real user, one event end-to-end — live SAR → alert draft → one officer approves → one village gets a message. Only then: national scale-out, auth/roles, ops hardening. Shelter-data acquisition (3 institutional asks) runs in parallel throughout.

## Current traction (measured)

| Metric | Value |
|---|---|
| **Feni 2024 — unseen southern event, strong labels** | v4.1 **0.485** (historical baseline) |
| **Feni tripwire** (n=20 spatially-blocked holdout) | v4.2 **0.5338** (+0.064 vs v4.1) |
| **Buffer ablation** (interior, boundary excluded) | v4.2 0.5590 (**Δ+0.044**) |
| **Sirajganj 2019** — unseen event, cross-algorithm | v4.1 0.540 / v4.2 0.553 |
| False-positive gate (G3 multi-signal) | FPR 0.000 on no-flood scenes |
| National event exposure | 20.5M affected (11.9% of BD) |
| Discharge skill (DAHITI) | Brahmaputra R² 0.88 · Padma R² 0.93 |
| **Uncertainty band (operative)** | one-sided lower-only: onset 0.822, flood-class 1.000, go-before = stored − 0.201 |

- **Live demo:** `https://kalopathor-hbgo.vercel.app` (seeded Feni penthouse, honest states, EN/BN)
- **Repository:** `github.com/realsamiul/Kalopathor` (contracts, doctrine, product spec, honest assessment, data, frontend)
- **Evidence posture:** every number measured on held-out events; evidence hierarchy = 1 independent event + 1 cross-algorithm agreement + in-distribution val. Both models provisional until one live national event with ground truth.

## The honesty differentiator

**We publish our own risk register** (`docs/HONEST_ASSESSMENT.md`): the metrics we don't trust, the blocker that's outsourced to institutions, the zero real-user signal, the calibration gap we found on ourselves — in the same document set we show partners and reviewers. For a platform whose entire purpose is decisions during a disaster, honesty is the feature: no hidden uncertainty, no fabricated safe routes, no green badge for a file that merely exists, no auto-sent alerts. The confidence a reviewer can place in the *negative* claims is the product.

---

## Company details

- **Legal entity:** `[SAM NEEDS TO FILL — legal entity name, jurisdiction]`
- **Website / public product URL:** `[SAM NEEDS TO FILL — if different from the demo above]`
- **Funding status:** `[SAM NEEDS TO FILL — pre-seed / seed / stage + prior raise amount]`
- **Contact / region:** `[SAM NEEDS TO FILL — team lead, email, primary geography (Dhaka? remote?)]`
- **AWS/GCP account association:** `[SAM NEEDS TO FILL — new/existing account + org ID if applicable]`