# KALOPATHOR — Bangladesh Flood Intelligence Platform

**One-liner:** A bilingual (Bengali/English) decision-support system that tells officials where flooding is happening, who is affected, which places need action first, which shelters/routes are viable, and what alert should be issued.

**Pipeline:** SAR flood detection → forecast → population exposure → evacuation routing → CAP 1.2 alert drafting — for the Government of Bangladesh (MoDMR/DDM/FFWC context).

## The honest status (read before judging)

- **Depth-first vertical slice strategy:** the foundation (contracts, eval discipline, honesty doctrine) and the penthouse (a working detection → polygons → exposure → action-card → CAP-draft loop for the **Feni pilot region**, rendering *honest* states everywhere) are built. National breadth is deliberately pending but fully slotted.
- **v4.2 is provisionally promoted** as the ops detection model (Feni tripwire +0.064, buffer ablation Δ+0.044, Sirajganj cross-algorithm 0.553); v4.1 stays frozen as one-command rollback. Both provisional until one live national event with ground truth.
- **Live vs seeded:** the interface distinguishes LIVE (real acquisition timestamps) from SEEDED/DEMO data with an explicit banner. Nothing is presented as live that isn't. A live Sentinel-1 loop for the Feni bbox is in flight.
- **The product thesis:** depth guaranteed, coverage pending — deliberately so. One district fully real beats twenty half-real.
- **We publish our own risk register:** see `docs/HONEST_ASSESSMENT.md` — honesty is the feature.
- **Live demo:** https://kalopathor-hbgo.vercel.app (seeded Feni penthouse, EN/BN).

## Repo structure

```
docs/PRODUCT_SPEC.md        — the product: modules, metrics, surfaces, contracts summary
docs/DESIGN_SPEC.md         — the visual/interaction spec: action card, layer stack, rails, freshness
docs/DOCTRINE.md            — the non-negotiables: honesty rules, gates, do-not-do, confidence classes
docs/CONTEXT.md             — current state snapshot: what's live, in flight, blocked (date-stamped)
docs/HONEST_ASSESSMENT.md   — our own risk register: brutal self-assessment + fixes landed
docs/SUBMISSION_READY.md    — program one-pager (AWS Activate / GCP for Startups)
contracts/                  — canonical JSON schemas (9 objects) + Feni 2024 replay bundle + validator
data/                       — real product data for the covered regions (polygons, gauges, exposure, erosion, forecast, rivers, hillshade)
frontend/                   — Next.js 14 + MapLibre ops-console scaffold (styling in progress; see DESIGN_SPEC)
```

## Quick start

```
cd frontend
npm install && npm run dev      # /en/operations · /bn/operations
```
The app renders the seeded demo bundle by default. A live Sentinel-1 → detection → freshness loop for the Feni bbox is in flight (Phase L); the demo is also deployed at https://kalopathor-hbgo.vercel.app.

## Product modules (naming)

`KALOPATHOR Detect` (SAR flood detection) · `Forecast` (GloFAS/Open-Meteo/FFWC + conformal bands) · `Exposure` (population impact) · `EVE` (evacuation routing, shelters, road passability) · `Alert` (bilingual CAP drafting) · `Monitor` (freshness, model confidence, system health).

## Who uses it

Three surfaces: **National Command** (MoDMR/DDM — the main dashboard), **District Ops** (district/upazila officers — scoped view), **Field/Public** (instruction-first, Bengali-first, voice-capable — no GIS).