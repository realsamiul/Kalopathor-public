# KALOPATHOR — Design Spec (interaction & visual, for Lovable / Arena agents)

> Product inputs only. Frontend CSS/styling is owned separately — this defines WHAT to render and HOW it should behave, not the pixels.

## 1. The core interaction: the right-side ACTION CARD

The action card is **the product**. The map supports it. Strict top-to-bottom priority (decision-critical first):

1. **Status badge** — confidence class (color+icon+label): `observed_high / observed_medium / possible / forecast_only / review_required` — never a bare number.
2. **Critical window** — "Move before 18:30 BDT" — largest text on the card, always present. "No safe route" gets equal visual weight (red-bordered state, not smaller/apologetic), with shelter-in-place / await-rescue fallback guidance.
3. **Affected people** — count + district/upazila.
4. **Recommended action** — ONE imperative sentence, plain language, Bengali-first.
5. **Nearest shelter** — name, distance, capacity status. Unknown capacity renders as **"Capacity: unknown — verify locally"** (distinct state, never a fake number).
6. **Route** — passability state + valid-until + backup route. **No-safe-route is never omitted** — an empty slot reads as "we forgot", so the slot always renders something.
7. **Gauge signal** — corroborating reading; **omitted silently when absent** (no empty slot).
8. **CAP draft button** — always last; never one-click (opens the approval flow).
9. **Evidence trail** — collapsed/expandable "why" panel: SAR pass time, confidence inputs, corroboration, shelter/route provenance (official vs proxy), and structured `{coverage, n, method}` fields.

Voice mode (low-literacy): reads items **2 → 4 → 5 → 6 only** (window, action, shelter, route).

## 2. Default operational layout (National Command)

```
┌────────────────────────────────────────────────────────────────────┐
│ Status bar: event · freshness (live|seeded) · next S1 pass · EN/BN │
├───────────────┬──────────────────────────────────────┬─────────────┤
│ Left rail     │                                      │ Right panel │
│ (workflow)    │         MAIN MAP (2D default)        │ Action card │
│               │  GIBS satellite basemap (TIME scrub) │ Exposure    │
│ 1 Now Flooding│  flood polygons · forecast · gauges  │ Shelter     │
│ 2 Next 72h    │  routes · erosion · exposure         │ Route       │
│ 3 People Risk │                                      │ CAP draft   │
│ 4 Routes/Shlt │                                      │             │
│ 5 Gauges      ├──────────────────────────────────────┴─────────────┤
│ 6 Alerts      │ Time scrubber · next S1 pass · layer toggles (2nd)  │
│ 7 Data Quality│                                                  │
├───────────────┴────────────────────────────────────────────────────┤
```
- **2D Bangladesh map is the default** for operations; the globe is landing/presentation only.
- **Workflow-based left rail** (not layer-first): each item drives a view — e.g. "Now Flooding" lists top polygons synced to the map (list↔map hover highlight, AIS-style), "Gauges" lists stations sorted by danger, "Alerts" shows the review queue.
- Layer toggles exist but are demoted to a collapsible secondary section.

## 3. Layer stack (bottom → top)

1. **GIBS satellite imagery** — VIIRS/TrueColor, **live, with a TIME scrubber** (date-stepped; default most recent). This is the demo centerpiece: real satellite imagery, not a blank canvas.
2. Hillshade (low opacity relief)
3. Rivers (blue centerlines)
4. **SAR flood polygons** (red fill ~55–60% + glow outline; click → action card)
5. Forecast risk (orange, "Next 72h")
6. FFWC gauges (danger-colored pins; **click → 7–15 day hydrograph drawer + danger line**)
7. Exposure choropleth (per-district affected population)
8. Erosion transects (orange lines)
9. Optional: NASA MCDWD/VCDWD daily flood + IMERG rainfall — **labeled "optical/cloud-limited"**
10. Status bar: event name · SAR last pass · FFWC age · forecast age · next S1 pass · health

Polygon lifecycle badges (ICEYE-style): `Monitoring / Analysis / Historical` derived from pass date.

## 4. Honesty in the UI (non-negotiable)

- **LIVE PILOT vs DESIGN PREVIEW badge**: "LIVE PILOT: Feni" during real-region views; "DESIGN PREVIEW — coverage roadmap" when showing national extent. The depth/coverage boundary is a *feature of the pitch*, never a footnote.
- **SEEDED / DEMO DATA banner** whenever `mode != live` (amber, prominent).
- Tri-state data chips: `seeded <date>` (neutral grey) · `static` → "as-of <date>" · `live` (real fresh/stale).
- Unknown ≠ safe (routes), unknown ≠ zero (shelter capacity), no hidden uncertainty (observed vs forecast vs stale vs low-confidence always distinguishable).

## 5. Freshness API contract (per-layer)

```json
{ "server_time": "…Z",
  "layers": {
    "ffwc_gauges":   {"last_success": "…Z", "status": "fresh|stale|failed", "stale_after_s": 3600},
    "sar_detection": {"last_pass": "…Z", "next_pass": "…Z", "next_pass_source": "esa_kml|satmarg", "region": "national", "status": "fresh|stale"},
    "forecast_glofas":    {"run_ts": "…Z", "status": "fresh|stale"},
    "forecast_openmeteo": {"run_ts": "…Z", "status": "fresh|stale"},
    "shelters": {"version": "…", "provenance": "official|proxy|mixed", "status": "fresh|stale"},
    "model":    {"version": "d3v4.2", "frozen": true}
  } }
```
- Staleness policy is SERVER-side (never duplicated in the UI); client renders ages from absolute timestamps + `server_time`.
- `failed` is distinct from old-timestamp (a broken scraper says "failed", never "3h old").
- Cache 1–5 min.

## 6. Three surfaces

- **National Command**: this layout.
- **District Ops**: same console scoped to one district (affected unions, top-10 priority polygons, shelter assignment table, route status, hydrographs, alert drafts).
- **Field/Public**: instruction-first, Bengali-first, voice-capable, mobile-first — **no GIS default**. "You are at risk. Go to this shelter. Use this route. Leave before this time." (Flood Hub village-card spirit.)

## 7. Reference patterns (steal from)

- GIBS TIME: nasa-gibs/gibs-web-examples (MapLibre sample)
- Confidence badge + evidence trail: spur.us-style "why" expansion
- List↔map sync: AIS/SkyFi
- Hydrograph drawer: Google Flood Hub
- Event stage badges: ICEYE
- Basic/Advanced progressive disclosure: NASA Worldview
- Data-quality panel organization: Vantor-style (by use-case, not data-type)