# KALOPATHOR — Field Catalog (responsiveness bible)

Every field in the 9 canonical contracts (`contracts/schemas/*.schema.json`) plus the
product data files, with **measured** min / max / typical values from the real artifacts
(measured 2026-09-01 with `/root/modal_env/bin/python`):

| Source file | Rows/objects |
|---|---|
| `detection_polygons_v4.geojson` | 1,461 polygons (national pass 2024-08-12) |
| `exposure/flood_affected_population.json` | 1,461 per-polygon + top-5 districts |
| `geophysics/ffwc_water_levels.parquet` | 535 rows (115 stations, 70 rivers) |
| `prediction/openmeteo_flood.parquet` | 60 rows (6 stations x 10 days) |
| `contracts/sample_incidents/feni_2024_replay.json` | 9-contract replay bundle |

**Display rules applied everywhere:** `_m` fields show ≤2 decimals with unit suffix;
population/area always thousand-separated; ISO timestamps rendered as locale time with
`+06:00` shown once; decimals suppressed where the data never has them (int fields).

---

## 0. Common envelope fields (every contract)

`schema_version` · `model_version` · `pipeline_version` · `crs` · `generated_at` ·
`valid_from` · `valid_until` · `provenance` · `review_status` · `data_flag`

| Field | Type | Measured typical | Display guidance |
|---|---|---|---|
| `schema_version` | string | `"0.1.0"` | Mono, right-aligned in metadata footer |
| `model_version` | string | `"d3v4.1"` (replay), `"d3v4.2"` (ops) | Badge, e.g. `d3v4.2`; rollback link |
| `pipeline_version` | string | `"kalopathor-2026-08-30"` | Mono; truncate at 24ch on mobile (`kalopathor-2026-08-30`) |
| `crs` | string | `"EPSG:4326"` | Tooltip only |
| `generated_at` | string ISO | `"2026-08-31T02:00:00+06:00"` | Render locale + "BDT"; full string = 25ch -> **wraps on <360px**, use one line |
| `valid_from` / `valid_until` | string ISO | both present in alert | "Valid until <date>" — never both on one row on mobile |
| `provenance` | object | `{"note": "..."}` | Collapsed; not on action card |
| `review_status` | string | `"unreviewed"` | Chip |
| `data_flag` | enum | `real`/`derived`/`proxy`/`missing` | Tri-state chip: `real` green, `derived` blue, `proxy` amber, `missing` red |

---

## 1. Event (`event`)

| Field | Type | Min | Max | Typical | Example | Display |
|---|---|---|---|---|---|---|
| `event_id` | string | — | — | `"EVT-2024-0812-001"` | EVT-2024-0812-001 | Mono badge |
| `name` | string | — | — | `"Feni 2024 Flash Flood"` | Feni 2024 Flash Flood | Title case; max ~40ch |
| `title` | string | — | — | replay label | "… Replay (sample incident bundle)" | Subtitle; truncate 2 lines on mobile |
| `type` | string | — | — | `"replay"` | replay | chip |
| `division` | string | — | — | `"Chittagong"` | Chittagong | text |
| `district` | string | — | — | `"Feni"` | Feni | text |
| `started_at` | ISO | — | — | `2024-08-06T06:00+06:00` | — | locale date |
| `ended_at` | ISO | — | — | `2024-08-14T00:00+06:00` | — | locale date |
| `sar_pass_date` | ISO | — | — | `2024-08-12T00:00+06:00` | — | "SAR 12 Aug 2024" |
| `severity` | enum | — | — | `"severe"` | severe | **color chip: severe=red** |
| `confidence_class` | enum | — | — | `"observed_medium"` | observed_medium | 5-tier chip |
| `status` | string | — | — | `"historical_replay"` | — | chip |
| `affected_people_total` | int | — | — | 184,615 | 184,615 | `toLocaleString`; 184,615 = 7 chars -> fits |
| `description` | string | — | — | 500+ chars | — | Collapse >220ch on mobile ("Show more") |
| `languages` | string[] | — | — | `["bn","en"]` | bn, en | chip row |

---

## 2. Flood Polygon (`flood_polygon` + `detection_polygons_v4.geojson`)

Measured on 1,461 real polygons:

| Field | Type | Min | Max | Typical (median) | Example | Display |
|---|---|---|---|---|---|---|
| `polygon_id` | int | 0 | 1,460 | 730 | 845 | `#845` mono |
| `event_id` | string | — | — | `"EVT-2024-0812-001"` | — | badge |
| `area_km2` | number, km² | **2.00** | **992.65** | **4.17** (mean 25.3) | 77.3 | `77.3 km²` (1 decimal); **max 992.65 = 7ch fits**, but on <360px drop to `993 km²` |
| `bbox` | number[4] deg | w 0.0089 | w 0.6174 | w ~0.0315, h ~0.032 | [88.3312, 26.4541, 88.426, 26.6207] | tooltip only, never raw |
| `confidence` | number 0-1 | **0.85** | **0.85** | 0.85 | 0.85 | `85%` — 0 decimals. **Never show 0.85 as "85.0"** |
| `confidence_class` | enum | — | — | `"observed_medium"` | — | chip |
| `label_source` | string | — | — | `"model"` | model | text |
| `iou_score` | number/null | null | null | null | null | render `—` (not 0) |
| `urban_doublebounce_corrected` | bool | false | false | false | false | icon only if true |
| `district` | string | — | — | top: Khulna(120), Bagerhat(80), Satkhira(72) | Khulna | text |
| `division` | string | — | — | top: Khulna(402), Rajshani(203), Rangpur(172) | Khulna | text |
| `sar_pass_date` | date | — | — | 2024-08-12 (uniform) | 2024-08-12 | locale |
| `sar_sensor` | string | — | — | `"Sentinel-1 IW GRD"` | — | tooltip |
| `polarization` | string | — | — | `"VV+VH"` | VV+VH | tooltip |
| geometry ring points | — | 15 | 4,216 | 70 | — | never render; drives tile size |

> **Mobile-overflow warning:** a `bbox` value alone is 30-40ch — never render on mobile.
> Ring sizes 15-4,216 points: use vector tiles / simplified geometry under z10.

---

## 3. Gauge Station (`gauge_station` + `ffwc_water_levels.parquet`)

Measured on 535 parquet rows (115 stations, 70 rivers) + 3 replay gauges:

| Field | Type | Min | Max | Typical (median) | Example | Display |
|---|---|---|---|---|---|---|
| `gauge_id` | string | — | — | — | Parshuram | mono |
| `station` | string | — | — | — | Parshuram | text |
| `river` | string | — | — | top: Jamuna(53), Ganges(30), Padma(21) | Muhuri | text |
| `location.lat` / `location.lon` | number deg | lat 23.07 | lat 23.10 | 23.08 | 23.079 | 4 decimals, tooltip |
| `location_accuracy` | string | — | — | `"approximate"` | approximate | chip (warn if approximate) |
| `water_level_m` | number m | **0.00** | **65.23** | **7.42** (mean 9.72) | 7.98 | `7.98 m` (2 decimals, `m` suffix); **65.23 = 7ch fits** |
| `danger_level_m` | number m | **1.80** | **70.30** | **10.95** | 12.55 | `12.55 m` |
| `difference_m` | number m | **-21.20** | **-0.10** | **-2.00** | -5.41 | `-5.41 m`; sign ALWAYS shown; negative = below danger |
| `status` | enum | — | — | `"normal"` | normal | chip: normal/warning/danger |
| `direction` | enum | — | — | rising / falling | falling | arrow glyph (not word) |
| `date` | ISO | — | — | — | 2026-08-30 | locale |
| `source` | enum | — | — | observed(230)/forecast(305) | observed | chip (observed=green, forecast=blue) |
| `as_of` | ISO | — | — | — | 2026-08-30 | "as of <date>" |
| `confidence` | number 0-1 | 0.80 | 0.80 | 0.8 | 0.8 | `80%` |

> **Layout:** hydrograph drawer shows water_level + danger_level on the SAME axis; the
> `difference_m` drives the color (>=0 red / danger, <0 blue). Parquet `source=forecast`
> rows mean = 8.64 m vs observed mean = 11.15 m — never mix without a source chip.

---

## 4. Forecast Band (`forecast_band` + `openmeteo_flood.parquet`)

Measured on 60 real Open-Meteo rows + 5 replay bands:

| Field | Type | Min | Max | Typical | Example | Display |
|---|---|---|---|---|---|---|
| `band_id` | string | — | — | — | — | mono, tooltip |
| `station` | string | — | — | 6 stations | Bhairab Bazar | text |
| `river` | string/null | — | — | null | — | `—` |
| `forecast_date` | ISO | — | — | — | 2026-08-30 | locale |
| `horizon_hours` | int h | **24** | **120** | **72** | 72 | `72 h` |
| `lead_time_hours` | int h | 24 | 120 | 72 | 72 | `72 h` |
| `parameter` | string | — | — | `"discharge"` | discharge | text |
| `value` | number | **3.65** | **7.30** | **4.82** (band rows) | 4.82 | `4.8 m³/s` |
| `value` (Open-Meteo, discharge_m3s) | number m³/s | **1.24** | **43,450** | **4.43** median; BIMODAL | 43,450.03 | **Bimodal by station**: Bahadurabad ~36,015 & Sirajganj ~35,765 vs Aricha ~1.5, Goalundo Ghat ~1.3. `toLocaleString`; `43,450 m³/s` = 11ch fits |
| `unit` | string | — | — | `"m3/s"` | m³/s | suffix; render `m³/s` |
| `source_model` | string | — | — | `"open-meteo-flood"` | — | chip |
| `nearest_station_to` | string | — | — | `"feni"` | — | text |
| `distance_km` | number km | **120.6** | **120.6** | 120.6 | 120.6 | `~121 km` |
| `band_type` | string | — | — | `"river_discharge"` | — | tooltip |
| `proxy_scope` | string | — | — | long note | — | collapse; 70ch+ -> **must truncate on mobile** |

> **Honesty rule (doctrine):** bands = "historical range, not a statistical guarantee".
> `go_before` reads the **lower bound** `stored − 0.201`, never the midpoint.

---

## 5. Exposure Summary (`exposure_summary` + `flood_affected_population.json`)

Measured on 1,461 real per-polygon rows:

| Field | Type | Min | Max | Typical (median) | Example | Display |
|---|---|---|---|---|---|---|
| `polygon_id` | int | 0 | 1,460 | 730 | 845 | `#845` |
| `district` | string | — | — | top: Naogaon 1.675M, Rajshahi 1.526M, Jessore 1.494M | Naogaon | text |
| `division` | string | — | — | — | Rajshahi | text |
| `area_km2` | number km² | 2.00 | 992.65 | 4.17 | 77.3 | `77.3 km²` |
| `affected_people` | int | **0** | **768,056** | **1,191** (mean 14,026) | 64,929 | `64,929` / `768,056` = 6-7ch fits; **mean vs median diverge — never show mean on card** |
| `population_source` | string | — | — | long HDX URL | — | URL hidden; tooltip "WorldPop 2024" |
| `sar_pass_date` | date | — | — | 2024-08-12 | — | locale |
| `total_affected` (top-level) | int | — | — | **20,491,387** | 20,491,387 | `20.5M` compact on card; full in detail |

> **Breadcrumb:** `per_polygon` row keys = `polygon_id, district, division, area_km2,
> affected_people, sar_pass_date`. `top5_districts` = district + affected_people.

---

## 6. Shelter (`shelter`)

Measured on 4 replay shelters (all proxy):

| Field | Type | Min | Max | Typical | Example | Display |
|---|---|---|---|---|---|---|
| `shelter_id` | string | — | — | s_feni_001 | — | mono |
| `name` | string | — | — | 20-40ch | "Feni Government Technical School & College" | 2-line clamp; long names **truncate on <360px** |
| `location.lat/lon` | number deg | lat 23.0092 | 23.0402 | 23.024 | 23.0244 | 4 decimals |
| `type` | string | — | — | `"school"` | school | chip |
| `shelter_source` | string | — | — | `"osm_proxy"` | — | chip (proxy amber) |
| `official_status` | string | — | — | `"unverified"` | — | chip |
| `capacity_status` | string | — | — | `"unknown"` | unknown | **chip "Capacity unknown — verify locally"; never blank, never fake number** |
| `capacity` | int/null | null | null | null | — | render `—` |
| `elevation_m` | number/null | null | null | null | — | render `—` |
| `source_detail` | string | — | — | 120+ch Overpass note | — | collapse on mobile |
| `confidence` | number 0-1 | 0.50 | 0.50 | 0.5 | 0.5 | `50%` |

> **Doctrine:** unknown ≠ zero. `capacity_status=unknown` must render the verify-local
> wording, not a blank or a zero.

---

## 7. Route (`route`)

Measured on 3 real replay routes (all `unknown` passability, all NOT safe):

| Field | Type | Min | Max | Typical | Example | Display |
|---|---|---|---|---|---|---|
| `route_id` | string | — | — | r_feni_001 | — | mono |
| `from_area_id` | string | — | — | poly_858 | — | mono |
| `to_shelter_id` | string | — | — | s_feni_001 | — | mono |
| `distance_km` | number km | **15.37** | **16.65** | **15.56** | 15.56 | `15.6 km` (1 decimal) |
| `travel_time_minutes` | int min | **184** | **200** | **187** | 187 | `3 hr 4 min` (auto from minutes; 184-200 = "3 hr 4 min".."3 hr 20 min") |
| `mode` | string | — | — | `"walking"` | walking | chip (walking=orange, driving=blue) |
| `passability` | enum | — | — | `"unknown"` (Feni: all) | unknown | 5-state chip: Passable/Marginal/Likely-blocked/Blocked/Unknown |
| `is_safe_for_recommendation` | bool | false | false | **false** | false | **Unknown → false, never rendered as usable** |
| `reason_codes` | string[] | 1 | 1 | `["NO_RECENT_PASSABILITY_DATA"]` | — | reason chip (why not safe) |
| `blocked_segments` | object[] | 0 | 0 | 0 | — | count badge |
| `geometry` | LineString | — | — | 2 coords (straight-line proxy) | — | map only |
| `geometry_source` | string | — | — | `"straight_line_proxy"` | — | chip (proxy amber) |
| `source` | string | — | — | `"eve_placeholder"` | — | chip |
| `confidence` | number 0-1 | 0.40 | 0.40 | 0.4 | 0.4 | `40%` |

> **Mobile-overflow warning:** route + shelter + time on one action-card row = 3 data
> cells; on <400px stack route as 2 lines (`15.6 km · 3 hr 4 min` / `passability chip`).

---

## 8. Alert (`alert_draft`) — bilingual message measurements

Measured on the real Feni replay alert (BN/EN word + character counts):

| Message | Lang | Chars | Words | Overflow guidance |
|---|---|---|---|---|
| `subject` | **EN** | 39 | 7 | "Warning: Flood risk in your area (Feni)" — fits 1 line ≥320px |
| `subject` | **BN** | 40 | 6 | "সতর্কতা: ফেনী অঞ্চলে বন্যার ঝুঁকি রয়েছে" — fits 1 line ≥320px |
| `body` | **EN** | **387** | **59** | "…184,615 people may be affected. Move to the nearest shelter before 18:30 BDT today…" — clamp 6 lines, "Show more" |
| `body` | **BN** | **395** | **62** | "…আনুমানিক ১,৮৪,৬১৫ জন মানুষ… নিকটতম আশ্রয়কেন্দ্রে… বিকাল ৬টা ৩০ মিনিট" — **BN chars are visually wider; clamp 6 lines** |
| `go_before` | both | 25 | 1 | "2024-08-12T18:30:00+06:00" — render `18:30 BDT today`, never raw |

Remaining alert fields (measured):

| Field | Type | Typical | Example | Display |
|---|---|---|---|---|
| `alert_id` | string | cap_feni_replay_2024_001 | — | mono |
| `alert_type` | enum | `"operational_advisory"` | — | chip: advisory=blue, public alert=red |
| `language` | string[] | ["bn","en"] | — | chip row |
| `severity` | enum | `"severe"` | — | color chip |
| `urgency` | enum | `"expected"` | — | chip |
| `certainty` | enum | `"likely"` | — | chip |
| `confidence_class` | enum | `"observed_medium"` | — | 5-tier chip |
| `district` / `division` | string | Feni / Chittagong | — | text |
| `affected_people` | int | **184,615** | — | `184,615` (8ch) |
| `go_before` | ISO | 2024-08-12T18:30+06:00 | — | "Leave by 18:30 BDT" (25ch raw -> NEVER raw) |
| `shelter_name` | string | Feni Gov't Tech School | — | clamp 2 lines |
| `route_id` | string | r_feni_001 | — | mono |
| `status` | enum | `"draft"` | — | lifecycle chip: Detected→Drafted→Reviewed→Approved→Exported→Archived |
| `evidence_trail` | object[] | 5 items {component,flag,detail} | — | collapsed; per-item chip real/derived/proxy/missing |
| `data_flag` | enum | `"derived"` | — | chip |

---

## 9. Data Freshness (`data_freshness`)

| Field | Type | Typical | Example | Display |
|---|---|---|---|---|
| `components` | object | `{sar:{last_updated,as_of,status,detail}, gauges:{…}, forecast:{…}}` | — | per-layer age strip: SAR / FFWC / forecast; `failed` ≠ "3h old" |
| `event_replay_scope` | object | `{event_date, note}` | — | SEEDED/DEMO banner driver |
| `generated_at` | ISO | 2026-08-31T02:00+06:00 | — | locale |
| `data_flag` | enum | `"derived"` | — | chip |
| `confidence` | number 0-1 | 0.6 | — | `60%` |
| `valid_from` / `valid_until` | ISO | 2026-08-30..31 | — | "valid until <date>" |
| `review_status` | enum | `"unreviewed"` | — | chip |

---

## Bundle-level (`bundle.schema.json`)

`data_flags` object keys measured: `{flood_polygons:"real", exposure:"real", gauges:"real",
forecast:"real", shelters:"proxy", routes:"proxy"}` — each drives the per-object
`real/derived/proxy/missing` chip. `validate_bundle.py` exit 0 = valid, exit 1 = tampered.

---

## Top-5 measured field extremes (callout)

1. **Largest polygon:** `area_km2 = 992.65` (Khulna/Rajshahi belt) vs median 4.17 km².
2. **Largest affected population (single polygon):** `affected_people = 768,056` vs median 1,191.
3. **Highest gauge:** `water_level_m = 65.23` (observed) vs danger 70.30 max; deepest deficit `difference_m = −21.20`.
4. **Discharge spread:** `discharge_m3s = 43,450` (Bahadurabad) vs 1.24 (Aricha) — 35,000× spread, bimodal by station.
5. **Alert message size:** BN body 395 chars / 62 words vs EN body 387 chars / 59 words — BN renders ~equal width; clamp both at 6 lines.

**National exposure total:** `total_affected = 20,491,387` (~11.9% of BD population) on the 2024-08-12 pass. Feni district replay total: 184,615.