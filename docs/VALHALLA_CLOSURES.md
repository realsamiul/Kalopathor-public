# KALOPATHOR — EVE Passability → Valhalla Closure-Schema Mapping

> Spec only. No code. Goal: adopt Valhalla's live-traffic/closures schema **now** so our flood-passability states inherit the in-flight `closures.osm.ch` tooling later — a config/format alignment, not a rewrite.

## 1. Reference

- **Valhalla live-traffic infrastructure:** speed/closure overlays applied at routing time without graph rebuilds; closures/incidents exposed via traffic tiles and closure annotations in route responses.
- **valhalla/valhalla discussion #5944** (GSoC 2026): proposes a `closure-sync` sidecar that polls a closures API, resolves closures to Valhalla edge IDs, and writes a compact binary overlay — `ClosureRecord { edge_id, start_time, end_time, flags }` — loaded at startup and consulted in `Allowed()`/`AllowedReverse()`. Maintainers steer this toward the **existing live-traffic tiles** path (per #5309), which is the right integration point.
- **closures.osm.ch:** a 2025 OSM GSoC project centralizing community-reported road closures; FastAPI + PostGIS, exports **GeoJSON and OpenLR**, targets closure-aware routing (Valhalla demo, Switzerland).

## 2. Current state (the gap)

EVE passability today is a **snapshot** per route: segment states `passable / marginal / likely_blocked / blocked / unknown` + reason codes (`DEPTH_UNKNOWN`, `EGRESS_THROUGH_FLOODWATER`, …) computed against observed flood extent + forecast-risk buffer (build_feni_routes_v2). Stored in route.schema.json objects. Missing:

- **time-window semantics** (a flood edge is closed *from pass date to forecast expiry*, not "closed, period");
- **engine-agnostic edge identity** (OSM way + offset, OpenLR-style, not graph-coupled IDs);
- **a standard format** other engines/tools can read.

## 3. Target mapping (OpenLR-style segments)

Each EVE passability verdict becomes a **closure record** over the underlying OSM edge:

| EVE state | Closure schema value | Notes |
|---|---|---|
| `blocked` | `closed` (all modes, both directions unless flagged) | time window = `[sar_pass_date, forecast_expiry]`; hard closure |
| `likely_blocked` | `closed` + `probable` flag | forecast-derived; degrades to `marginal` on confirmation of open water |
| `marginal` | `slowed` / partial closure | per-mode speed factor; not closed; may be passable on foot |
| `passable` | **no record** | absence of a record = open (record-free model) |
| `unknown` | **no record** + `reason_code: NO_RECENT_PASSABILITY_DATA` | must stay distinct from "open" — unknown ≠ safe (DOCTRINE §1) |

Record fields (mirror `ClosureRecord` + OpenLR):

```
edge_ref:      { osm_way_id, from_offset, to_offset, direction }   // OpenLR-style LR
               // later resolved to valhalla edge_id by closure-sync
validity:      { start_time, end_time }                            // +06:00/Z, flood window
state:         closed | slowed | probable_closed
flags:         { modes: [walking, driving, emergency], reversible: bool }
origin:        sar_observed | forecast_derived | manual | field_verified
reason_code:   // EVE reason_codes preserved verbatim
```

**OpenLR note:** OpenLR linear references (way + offset range + FRC/FOW) are engine-agnostic — they resolve onto any graph. Adopting them now means the #5944 `closure-sync` resolver maps our records to Valhalla edge IDs later with minimal adaptation, and any closures.osm.ch-compatible tooling can consume us directly.

## 4. Why adopt now

1. **Interoperability:** our closures become readable by the closures.osm.ch / Valhalla live-traffic ecosystem instead of a private JSON field.
2. **Time-window semantics fix a real gap:** today's snapshot passability cannot drive route search *during an evolving event*; `validity` windows let the router know a bridge is closed only until forecasted recession.
3. **Future-proofing:** when #5944 ships, we inherit the sidecar/overlay + live-traffic-tiles path instead of building an ad-hoc blocker list; EVE's networkx Dijkstra remains the offline/fallback path.

## 5. Migration plan

1. Extend route.schema.json with an optional `closure_segments[]` array (schema_version bump 0.1.0 → 0.2.0; validator updated; existing routes re-validated).
2. Route builder emits `closure_segments[]` alongside `passability` using the mapping table above, with real time windows from `sar_pass_date` → forecast-band `valid_until`.
3. Persist as GeoJSON (OpenLR-style linear references) + JSON records; expose via the route API; render closure segments as an EVE layer.
4. When the #5944 tooling lands: add a `closure-sync` adapter that ingests our records as a closures source; validate against Valhalla live-traffic tiles; keep networkx Dijkstra as fallback. Measure: route re-computation with vs without closures, travel-time delta on Feni replay.

**Track:** `valhalla/valhalla#5944` (discussion), `closures.osm.ch` project, Valhalla live-traffic docs (#5309 context). Do not vendor any of it — this doc only aligns our schema so the later integration is plumbing, not redesign.