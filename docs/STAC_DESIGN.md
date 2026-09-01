# KALOPATHOR — Sensor-Agnostic STAC Catalog Design

> Spec only. No code. Design input for the ingestion + catalog floor (CONTEXT.md backlog item 6/live plumbing) and the future PgSTAC/TiTiler end-state.

## 1. Why STAC now

Our geo outputs are already contract objects (JSON, EPSG:4326, versioned). STAC (SpatioTemporal Asset Catalog) gives them a **discovery, query, and tiling** layer for free, and it is the schema both our source pipeline (Planetary Computer, CDSE, GEE) and our end-state tile stack (eoAPI) already speak. We are not replacing storage — STAC is a **catalog over existing assets** (GeoJSON, GeoParquet, COGs, PMTiles, JSON).

Design goal: **the catalog is sensor-agnostic.** A flood polygon is a flood polygon whether it came from Sentinel-1, ICEYE, or Umbra. Sensor metadata lives in the STAC `sar`/`sat`/`eo` extensions — never in the product geometry or product schema.

## 2. Principles

1. **One collection per product type, not per sensor.** Adding a sensor = adding a `providers` entry + new assets, never a new collection.
2. **The honesty lexicon survives.** `data_flag` (real/derived/proxy/missing), `confidence_class`, `review_status`, `provenance`, and version fields carry over as `properties.kalopathor:*`.
3. **Pilot-first.** Stand up the catalog for the Feni collections only, read-only; national collections come after a pilot gate (same depth-before-breadth doctrine as the product).
4. **No new storage at pilot.** Asset `href`s point at artifacts that already exist in `data/`.

## 3. Collection / item schema per product

### Common item properties (all collections)

- `datetime` (or `start_datetime`/`end_datetime` for time-windowed products)
- `geometry` (GeoJSON, EPSG:4326), `bbox`
- `collection`, `id`
- `properties.kalopathor:*` — `schema_version`, `model_version`, `pipeline_version`, `data_flag`, `confidence_class`, `review_status`, `provenance`
- `assets[]` — ≥1 asset with a role (e.g. `data`, `thumbnail`, `overview`)

### Collection matrix

| Collection id | Product | Item = | Core required properties | Extensions | Asset types |
|---|---|---|---|---|---|
| `kalopathor-flood-polygons` | Detect | one flood polygon | `polygon_id`, `area_km2`, `confidence`, `sar_pass_date`, `label_source`, `data_flag` | **sar**, sat, eo (optical corroboration), labels (strong labels) | GeoJSON / GeoParquet polygon, chip COG |
| `kalopathor-forecast-bands` | Forecast | one conformal band per station-run | `station`, `forecast_date`, `lead_time_hours`, `parameter`, `value`, `lower`/`upper`, `source_model`, `band_type` | — | band JSON, hydrograph PNG |
| `kalopathor-gauge-snapshots` | Monitor | one station-datetime reading | `gauge_id`, `water_level_m`, `danger_level_m`, `as_of`, `source`, `data_flag` | — | reading JSON |
| `kalopathor-exposure` | Exposure | polygon × population summary | `affected_people`, `population_source`, `sar_pass_date`, `data_flag` | labels | GeoJSON / GeoParquet |
| `kalopathor-routes` | EVE | one route object | `route_id`, `from_area_id`, `to_shelter_id`, `passability`, `reason_codes`, `is_safe_for_recommendation` | — | GeoJSON route polyline |
| `kalopathor-alerts` | Alert | one alert draft | `alert_id`, `alert_type`, `severity`, `urgency`, `certainty`, `status`, `language` | — | CAP 1.2 XML |

### Extension usage (per product)

- **sar** (radar-derived products: flood-polygons, gauge-independent exposure, routes whose passability is SAR-scored):
  - `sar:constellation` (`sentinel-1` today; `iceye`, `umbra`, `capella` later)
  - `sar:polarizations` (`["VV","VH"]`; single-pol allowed with fallback note)
  - `sar:instrument_mode`, `sar:product_type` (GRD / RTC), `sar:frequency_band`
  - `sar:orbit_state`, `sar:resolution_range`/`azimuth`
- **sat** (all spaceborne products): `sat:platform_international_designator`, `sat:relative_orbit`, `sat:anx_datetime`.
- **eo** (when optical inputs are used, e.g. MCDWD/optical corroboration): `eo:bands`, `eo:cloud_cover`, `eo:instrument`. Optical data is always labeled `optical/cloud-limited` per DESIGN_SPEC.
- **labels** (strong-label chips, e.g. Feni tripwire / future field-verified points): standard `label:*` roles so they are queryable as ground truth.

### Mapping from existing contracts (flood-polygon example)

| flood_polygon.schema.json | STAC item |
|---|---|
| `sar_pass_date` | `datetime` |
| `sar_sensor` | `providers[].name` + `sar:constellation` |
| `polarization` | `sar:polarizations` |
| `geometry` | `geometry` / `bbox` |
| `area_km2`, `confidence`, `label_source`, `data_flag` | `properties.kalopathor.*` |

## 4. PgSTAC / TiTiler end-state deployment (eoAPI)

```
 discovery/query ──▶ stac-fastapi (STAC API)
                     └── PgSTAC  (Postgres + PostGIS: items/collections)
 raster tiles ────▶ TiTiler  (dynamic COG / GeoJSON / pmtiles tiling)
                        │
 assets ────────────────┴── COGs · GeoParquet · PMTiles · GeoJSON (GCS / object storage)
```

- **PgSTAC** = Postgres schema for STAC collections/items → scalable spatiotemporal queries (geometry × time) that the ops console needs (`polygons in bbox ∩ [t0,t1]`, `latest gauge per station`, `alerts by district`).
- **TiTiler** = dynamic tile server over COG rasters (and vector tile path for GeoJSON/pmtiles), replacing hand-built tile pipelines.
- **eoAPI** = the reference stack bundling the two (developmentseed), deployable via Helm (national) or docker-compose (pilot/VPS).
- **Rollout is pilot-first:** stand up eoAPI for Feni collections only, read-only; validate the exact queries the frontend issues; keep today's PMTiles/GeoJSON serving as the visual path until tiles are proven; promote national collections only after the pilot gate. Rationale: one district fully real beats twenty half-real (product thesis).

## 5. Adding Planet / ICEYE / Umbra = config change, not rewrite

The pipeline today: Sentinel-1 GRD → (HyP3/PC RTC) → 6ch prep → inference → polygonize. A commercial-SAR source plugs in as:

1. **A new source adapter** (the only new code): polls/tasks Planet / ICEYE / Umbra, retrieves GRD/RTC, emits SAR items with the **same product schema** (collection id unchanged).
2. **Config change:** `sar:constellation`, `sar:polarizations`, `sar:instrument_mode` and `providers[].name` updated in the collection `summaries`; per-source acquisition schedule in the ingest config.
3. Detection runs identically on the new inputs (VV/VH, or single-pol with documented fallback) and emits the same `kalopathor-flood-polygons` item shape.
4. Downstream (query, tiling, exposure, routes, alerts) is **schema-driven and sensor-blind** — TiTiler/PgSTAC unchanged.

Honesty: a detection from commercial SAR is still `data_flag: real`, but `sar:constellation` + acquisition metadata let any consumer distinguish source, and the UI's "observed by SAR" chip reads the constellation from STAC properties (no hidden sensor). Mixed-source events are per-item, never merged silently.