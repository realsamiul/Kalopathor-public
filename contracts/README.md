# Data Contracts
- `schemas/` — 9 canonical JSON-Schema objects (flood_polygon, forecast_band, gauge_station, exposure_summary, shelter, route, alert, data_freshness, event) + bundle schema. All timestamps ISO-8601 with explicit +06:00/Z. GeoJSON = EPSG:4326. Every object carries schema_version/model_version/pipeline_version.
- `sample_incidents/feni_2024_replay.json` — the end-to-end Feni replay bundle (real polygons/exposure/gauges; proxy shelters/routes, honestly flagged).
- Validator: `validate_bundle.py` (see the source workspace) — bundle must exit 0 before any consumer.
