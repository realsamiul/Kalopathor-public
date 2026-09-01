# KALOPATHOR — "Now" vs "Always": Two Products, One UI

> Spec only. No code. Reframes the seeded/live caveat (CONTEXT.md §9, DESIGN_SPEC §4) from a *limitation* into **two honest products** sharing one shell. Applies to National Command and District Ops surfaces.

## 1. The problem it solves

Today the honesty layer says "LIVE PILOT: Feni" / "DESIGN PREVIEW" / "SEEDED / DEMO DATA" — correct, but reads as *"we are not finished."* The reframe: **these are two products**, and the seam between them is a product feature, not a gap.

- **Now** — live detection and alerting (the Feni pilot; real acquisition timestamps, live gauge/forecast loops where they exist).
- **Always** — historical risk and recurrence (the **MONSOON** channel + the archive polygon stack; a genuinely useful, static planning surface).

Both are fully honest. Neither claims to be the other.

## 2. Product definitions

### Now (live)
- Live detection → polygons → exposure → action card → alert drafts (Feni pilot floor).
- The freshness contract applies per layer; any non-live layer still shows SEEDED/DEMO + tri-state chips.
- Answers: *"what is happening right now, and what do I do?"*

### Always (historical / recurrence)
- Recurrence from the **MONSOON channel** (Jun–Oct water recurrence, already an input channel to the model) + archive polygon stack (2020 / 2022 / 2024 events) → per-union recurrence class and return-period surface.
- Static; every value labeled `as-of <archive date>`; never presented as live.
- Answers: *"where does flood return, how often, where do I pre-position and invest?"* — the planning question MoDMR/DDM asks between events.

## 3. UI implications

1. **Mode toggle** — prominent, top of the console: `Now | Always`, mutually exclusive. Default = `Now` during the active season (Jun–Oct), `Always` otherwise (config, Admin-set). The toggle is the *first* element a viewer sees, so there is never ambiguity about which product is on screen.

2. **Distinct visual language** — modes are not a palette tweak; they use different layer vocabularies:
   - **Now:** red/orange detection language; event-centric (time scrubber, next S1 pass, polygon lifecycle badges Monitoring/Analysis/Historical); live freshness bar.
   - **Always:** blue/teal recurrence palette; `as-of` chips everywhere; risk surfaces (recurrence class, return-period band, historical max extent) instead of event polygons; no "next pass" — no live claims.

3. **Left rail swaps** (workflow rail per DESIGN_SPEC §2):
   - Now: Now Flooding · Next 72h · People at Risk · Routes/Shelters · Gauges · Alerts · Data Quality.
   - Always: Recurrence · Archive Events · Risk Zones · Historical Exposure · Historical Routes · (no live alerts; instead "Historical CAP records").

4. **Action card chassis stays, content changes:**
   - Now card = current event status (confidence class, critical window, shelter/route, CAP draft).
   - Always card = "Return-period band · historical max extent in this union · last flood here (date, extent) · nearest recurring-zone shelters/routes." CAP draft button absent in Always (nothing to act on now) — replaced by "export risk sheet" (a planning deliverable, not an alert).

5. **Shared layers:** GIBS basemap, hillshade, rivers. The GIBS time scrubber in Always mode scrubs the *archive*, not live passes (explicitly labeled).

## 4. Honesty preserved

- The mode is **explicit state, not a corner badge.** No Now layer ever renders Always data without the as-of chip; no Always view ever implies a live sensor.
- SEEDED/DEMO still governs every non-live layer inside Now mode (DOCTRINE §1).
- Always is an honest product (static recurrence risk is genuinely what planners need between events), **not a fig leaf** for "we haven't gone live yet." Its value is stated on its own terms, and its data is real (MONSOON channel + real archive polygons).

## 5. Stack consequences

- **MONSOON** graduates from a model *input* channel to a first-class *output* surface (recurrence maps) — no new model work, new rendering + a query surface.
- **Archive polygons** must be STAC-queryable (see STAC_DESIGN.md §3) so Always can serve time-series queries (extent-by-year, return-period) instead of a static file.
- **No new contract objects:** Always reuses `flood_polygon` / `exposure_summary` / `route` schemas tagged `product: "always"` + `archive_dates`. The `product` discriminator (`now` | `always`) is added to the kalopathor property set; `data_flag` semantics unchanged.
- **Freshness API** gains a top-level `mode` reflecting the toggle, so a viewer in Always mode is not given live-status claims for archive layers (they carry `static` / `as-of` instead).