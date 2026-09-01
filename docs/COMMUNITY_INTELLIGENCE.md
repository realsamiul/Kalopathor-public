# KALOPATHOR — Community Intelligence: the Permanent Field-Reports Channel

> Spec only. No code. **Formalizes backlog item E1** (CPP field-verification workflow, named in EXECUTION_PLAN_OPUS5 Amendment 4.4). Owner: **Sam / MoDMR liaison** — this spec defines the pipeline; the MoDMR/CPP relationship that activates it is the owner's job.

## 1. Why this channel is permanent

The model's generalization evidence is ~1.5 independent events: Feni (strong labels, 0.485) + Sirajganj (cross-algorithm agreement, 0.54–0.55 — **not** a second Feni). Cross-algorithm agreement is not ground truth. The only path from agreement-evidence to ground-truth-evidence is **field-verified flood extent from a live event**.

Pattern reference: Cloud-to-Street / "Street to Cloud" (Bonafilia et al.) — crowdsourced ground truth from community reports materially improves flood maps, especially where SAR is noisy (urban double-bounce) and where water recedes before the next overpass. Bangladesh CPP (Cyclone Preparedness Programme) volunteers are the existing, trusted, on-the-ground network in flood-prone districts — the community-based early-warning channel the FEW literature consistently points to.

## 2. Ingestion (photo + location)

- **Primary — WhatsApp channel:** volunteer sends a photo + auto-location (geotag) to a managed number. Zero training, works on feature phones, already the channel communities use.
- **Secondary — geo form (KoBo-style):** structured report: flood present/absent, estimated depth (cm, coarse buckets), shelter open/closed, count of people at shelter. For volunteers who can use a form.

Every report becomes a `field_report` object:

```jsonc
{
  "report_id": "fp_2026_00042",
  "volunteer_id": "vol_a3f9" /* pseudonymized */,
  "location": { "type": "Point", "coordinates": [...] }, /* EPSG:4326 */
  "captured_at": "…+06:00",
  "media": { "href": "…", "type": "image/jpeg" },
  "estimated_depth_cm": 40,            /* null if unknown */
  "flood_present": true,               /* for geo form */
  "shelter_status": { "open": true, "capacity_status": "unknown" },
  "source_channel": "whatsapp" | "geo_form",
  "label_source": "field_unverified",
  "data_flag": "real",
  "verified_by": null, "verified_at": null
}
```

`label_source` starts `field_unverified` — nothing is ground truth until an analyst says so.

## 3. Validation workflow

1. **Ingest** → auto-extract location + timestamp, geocode if needed.
2. **Analyst queue** ("Field reports" tab in the ops console): reviewer sees the report pinned over the map with SAR polygon context, photo thumbnail, and the polygon's current confidence class.
3. **Confirm** → `label_source: "field_verified"`, set `verified_by` (analyst id) + `verified_at`. **Reject / duplicate** → `label_source: "field_rejected"` (kept in audit, not deleted).
4. Verified points become the **ground-truth layer** (analyst-visible; public surface only after explicit approval).

## 4. How it feeds the product (three loops)

- **(a) n=1 generalization closure:** `field_verified` flood-present/absent points become strong labels for the next model generation + the calibration event set. This converts "agreement with reference algorithms" into measured ground-truth accuracy on a live event — the milestone that promotes v4.x from provisional to certified, and lets the Sirajganj number be retired from the generalization story.
- **(b) Shelter verification:** volunteers report shelter open/closed/capacity at event time → updates the shelter's `official_status` / `capacity_status` with `source: "field_verified"` (an honest upgrade from proxy; EVE's no-safe-route state flips only when a field-verified shelter + passable route exists).
- **(c) Alert corroboration:** a `field_verified` flood-present report inside an event's area counts as **one corroborating signal in the G3 multi-signal gate** (same class as gauge/rainfall/forecast) and strengthens the confidence class at draft time — while keeping the "SAR-only never auto-drafts" rule intact.

## 5. Governance / honesty

- `field_verified` is a **source label, not a guarantee.** It upgrades provenance; it does not bypass the alert gate chain.
- Reports never auto-label anything; the analyst confirmation is the gate (identical posture to alert approval).
- Volunteer IDs are pseudonymized; photos are not published to the Field/Public surface without explicit approval; location is point-precision only, no volunteer identity in public output.
- The channel must **not** be mistaken for a public reporting app. It is a closed, managed channel for the trained CPP network, not crowdsourced open ingestion. (An open channel is out of scope and would break the verification gate.)

## 6. Owner & activation

- **Owner: Sam / MoDMR liaison.** This doc is the pipeline spec; nothing runs until the MoDMR/CPP relationship authorizes a closed volunteer channel.
- **Prerequisite experiments before the next monsoon:** a dry-season pilot (volunteers report flood-absent points → proves channel + validation loop without risk) and a rehearsal on a small live event. Success metric: **field-verified points that change a polygon's confidence class or a shelter's status during an event** — measured, not claimed.