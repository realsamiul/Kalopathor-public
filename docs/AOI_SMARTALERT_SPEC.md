# KALOPATHOR — AOI / District SmartAlert Subscription Spec

> Spec only. No code. Design for the district-AOI alerting floor (National Command / District Ops surface). Pattern reference: PDC DisasterAWARE **SmartAlert** — users draw alert areas (circle/polygon/rectangle), set hazard + severity filters, and get notified when a hazard touches their area.

## 1. Core rule (doctrine-enforced)

**A subscription never sends an alert.** It only creates an **alert draft** in the human review queue. Every existing alert gate (schema → exposure → G3 multi-signal → confidence class → template fork → provenance) applies at review/approve time, unchanged. `Delivery` config controls what happens **after** approval, never before.

- No auto-send (DOCTRINE §4, §7).
- SAR-only detections never auto-draft (G3 gate).
- "Auto-email" on a subscription means *auto-notify-after-approval*, and is a recipient-list convenience, not a release valve on the gate chain.

## 2. User flow

1. From National Command or District Ops, select **Subscribe** on a district/upazila boundary or draw a freeform polygon on the map (PDC pattern: circle / polygon / rectangle tools).
2. Optional **buffer** expands the AOI (default 5 km, configurable per subscription; keeps polygonized detections near the boundary from missing).
3. Configure filters:
   - hazard type: `flood`
   - minimum confidence class (≥ `observed_medium` recommended; `possible` allowed for Advisory)
   - alert types: `operational_advisory` / `public_evacuation_alert`
   - minimum severity / urgency / certainty
4. Configure delivery: in-app queue (required), email (optional), CAP export (optional).
5. Name + save. Lifecycle: `active → paused → archived`.

## 3. Matching rule

An alert draft is generated for a subscription when **both** conditions hold:

- **Spatial:** the flood polygon (or event envelope) geometry intersects the subscription's AOI **with buffer** (`ST_Intersects` on EPSG:4326).
- **Signal:** the event passes the **G3 multi-signal corroboration gate** (≥2 of SAR / gauge / rainfall / forecast; SAR-only never drafts). This is the same gate that governs all drafting — a subscription adds a geography filter, it does not lower the bar.

A match whose severity/confidence is below the subscription's filter is **suppressed by filter** and audit-logged (never silently dropped — consistent with `review_required` handling). One alert → one draft; all matching subscriptions attach as tags on that draft (deduplicated).

## 4. Lifecycle

**Subscription:** `created → active → paused → archived`. Geometry/buffer/filter edits are versioned (`subscription_version`); a subscription can only be active during an approved-operations window (Admin-controlled).

**Alert (unchanged, per DOCTRINE §4):** `Detected → Drafted → Reviewed → Approved → Exported → Archived`. A draft created via subscription carries `provenance.origin = "aoi_subscription:<id>"` so the review queue shows who wanted it.

## 5. Delivery options

| Channel | Required? | Semantics |
|---|---|---|
| **In-app queue** | yes | draft appears in the reviewer's Alerts queue, tagged with the matching subscription(s) |
| **Email** | no | sent only **after** the alert is Approved; recipient list = subscription owners; link back to the approved alert; never the CAP itself |
| **CAP export** | no | CAP 1.2 XML attached to the approved alert and pushed to the CAP endpoint on export (and on regeneration) |

Public Evacuation Alerts additionally require Approver action (see OPERATIONS_HARDENING roles); email/CAP delivery is a downstream notification of an already-approved alert.

## 6. Data model

Reuses the **alert contract verbatim** (alert.schema.json untouched). Adds **one new object**: `subscription` (JSON-Schema draft 2020-12, `$id: kalopathor:subscription:v0.1.0`, EPSG:4326, timestamps +06:00/Z).

```jsonc
{
  "schema_version": "0.1.0",
  "model_version": "kalopathor-demo",
  "pipeline_version": "kalopathor-2026-09-01",
  "subscription_id": "sub_feni_sadar_001",
  "owner_id": "analyst@ddm",
  "owner_role": "analyst",
  "name": "Feni Sadar — high priority",
  "status": "active",                    // active | paused | archived
  "subscription_version": 3,             // bumps on geometry/filter edits
  "aoi": { "type": "Polygon", "coordinates": [...] },
  "buffer_m": 5000,
  "filters": {
    "hazard_type": ["flood"],
    "min_confidence_class": "observed_medium",
    "alert_types": ["operational_advisory", "public_evacuation_alert"],
    "min_severity": "minor",
    "min_urgency": null,
    "min_certainty": null
  },
  "delivery": { "in_app": true, "email": true, "cap_export": false },
  "created_at": "…+06:00",
  "updated_at": "…+06:00",
  "data_flag": "real",
  "provenance": { "origin": "user_drawn", "source": "ops_console" }
}
```

**Match audit** (append-only, separate table/file, feeds Monitor): each evaluation writes `{subscription_id, alert_id|polygon_id, triggered_at, matched: bool, suppressed_reason? , gate_signals}`. This is the record that lets us later prove "the subscription fired early/wrong" in an event replay (would-have-been false-alarm accounting).