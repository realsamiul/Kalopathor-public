# KALOPATHOR — Bangladesh Flood Intelligence Platform

**One-liner:** A bilingual (Bengali/English) decision-support system that tells officials where flooding is happening, who is affected, which places need action first, which shelters/routes are viable, and what alert should be issued.

**Pipeline:** SAR flood detection → forecast → population exposure → evacuation routing → CAP 1.2 alert drafting — for the Government of Bangladesh (MoDMR/DDM/FFWC context).

## The honest status (read before judging)

- **Depth-first vertical slice strategy:** the foundation (contracts, eval discipline, honesty doctrine) and the penthouse (a working detection → polygons → exposure → action-card → CAP-draft loop for the **Feni pilot region**, rendering *honest* states everywhere) are built. National breadth is deliberately pending but fully slotted.
- **Live vs seeded:** the interface distinguishes LIVE (real acquisition timestamps) from SEEDED/DEMO data with an explicit banner. Nothing is presented as live that isn't.
- **The product thesis:** depth guaranteed, coverage pending — deliberately so. One district fully real beats twenty half-real.

## Repo structure

```
docs/PRODUCT_SPEC.md    — the product: modules, metrics, surfaces, contracts summary
docs/DESIGN_SPEC.md     — the visual/interaction spec: action card, layer stack, rails, freshness
docs/DOCTRINE.md        — the non-negotiables: honesty rules, gates, do-not-do, confidence classes
docs/CONTEXT.md         — current state snapshot: what's built, measured, in flight
contracts/              — canonical JSON schemas (9 objects) + Feni 2024 replay bundle + validator
data/                   — real product data for the covered regions (polygons, gauges, exposure, erosion, forecast, rivers, hillshade)
frontend/               — Next.js 14 + MapLibre ops-console scaffold (styling in progress; see DESIGN_SPEC)
```

## Quick start

```
cd frontend
npm install && npm run dev      # /en/operations · /bn/operations
```
The app renders the seeded demo bundle by default. Live plumbing is an in-flight floor (Feni-scoped).

## Product modules (naming)

`KALOPATHOR Detect` (SAR flood detection) · `Forecast` (GloFAS/Open-Meteo/FFWC + conformal bands) · `Exposure` (population impact) · `EVE` (evacuation routing, shelters, road passability) · `Alert` (bilingual CAP drafting) · `Monitor` (freshness, model confidence, system health).

## Who uses it

Three surfaces: **National Command** (MoDMR/DDM — the main dashboard), **District Ops** (district/upazila officers — scoped view), **Field/Public** (instruction-first, Bengali-first, voice-capable — no GIS).