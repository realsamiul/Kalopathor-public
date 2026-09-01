# KALOPATHOR — Operations Hardening Checklist (Tabletop Phase)

> Spec only. No code. Production checklist for making the Feni pilot defensible before the MoDMR/DDM/FFWC tabletop (EXECUTION_PLAN_OPUS5 Sprint 5). Roles, monitoring, audit, backup/offline, deployment.

## 1. Roles

Auth via the existing auth layer + role claims; **every mutation records actor + role** (see §3).

| Role | Capability | Boundaries |
|---|---|---|
| **Viewer** | read-only: maps, action cards, alerts list, freshness, data-quality | cannot draft, approve, or edit; observer seat at the tabletop |
| **Analyst** | create/edit alert drafts, review queue, validate field reports, manage own AOI subscriptions | cannot approve their own public alert; cannot edit a draft once sent to review |
| **Approver** | approve/reject drafts → export CAP | public alert approval requires a **second Approver** (two-person rule); approve ≠ send — send is a separate explicit action |
| **Admin** | users, roles, subscriptions, ingest/collection config, audit view, mode toggle (Now/Always default) | cannot approve public alerts without the Approver role |

Least privilege by default. Draft creation for Public Evacuation Alerts requires evidence that the G3 gate passed; Approver sees the gate output before approving.

## 2. Monitoring metrics (freshness contract as the source of truth)

Server-side per the `/api/freshness` contract (DESIGN_SPEC §5) — staleness is never computed in the UI:

- **Stale latency:** time from `last_success` past `stale_after_s` → on-call alert, per layer (`ffwc_gauges`, `sar_detection`, `forecast_glofas`, `forecast_openmeteo`, `shelters`, `model`).
- **Failed vs old:** count of `status: failed` per layer per hour — a broken scraper says *failed*, never "3h old"; sustained failure pages the on-call.
- **SAR gap:** hours since last S1 pass; warning when the `next_pass` window is missed; `next_pass_source` (esa_kml | satmarg) noted.
- **Model freeze:** `model.frozen: true` must hold — no silent retrains/version drift during an event; any change bumps `model.version` and is audit-logged.
- **Data-quality panel trends:** weak-label zones, missing stations, failed tiles — surfaced and trended, not just rendered.
- **Ops SLIs (tabletop targets):** time-to-first-alert-draft < 3 min; click→card < 300 ms; layer toggle < 500 ms; initial load < 3 s.

Ops health goes to a **separate notification channel** (ops ticketing / on-call queue) — never through the public alert path.

## 3. Audit log requirements

Append-only log (Postgres audit table or signed JSONL chain; WORM semantics):

- every alert lifecycle transition `Detected→Drafted→Reviewed→Approved→Exported→Archived`;
- every draft edit; approve/reject + actor + role;
- subscription create/edit/delete + version; field-report validation (`field_verified` / `field_rejected`);
- CAP export + regeneration; freshness status flips; model/version changes; role grants/revocations.

Entry shape: `{ ts (Z), actor_id, role, action, object_id, before/after hash, bundle_version }`. Retention ≥ 2 years; exportable for review. Tabletop session must produce a complete audit trail that the observers can pull.

## 4. Backup / offline mode

- **Backup:** nightly PgSTAC + Postgres dumps + object-storage copy of COG/GeoJSON/pmtiles + bundle checksums. RPO ≤ 24 h. A restore drill is a tabletop agenda item.
- **Offline mode (graceful degradation):**
  - last-known bundles render with `as-of` chips + SEEDED/DEMO banner;
  - no green "fresh" claims ever (a cached file is not fresh);
  - alert **drafting still works** against last-known data, but the approve-time freshness re-check (DOCTRINE §4) forces re-review on reconnect;
  - preload the district bundle so the tabletop demo runs offline with the honesty banner intact.

## 5. Deployment target options

| Option | Fit | Notes |
|---|---|---|
| **Vercel (frontend) + managed Postgres/object storage** | fastest pilot, cheapest | eoAPI/PgSTAC needs a Postgres host; TiTiler can run serverless |
| **Single VPS / docker-compose (all-in-one)** | full control, offline-friendly | eoAPI + Postgres + tiles + scheduler on one box; simplest for MoDMR internal hosting |
| **Kubernetes (eoAPI Helm)** | national scale path | the STAC_DESIGN end-state; overkill for the tabletop |

Recommendation: **tabletop = Vercel frontend + docker-compose backend (or single VPS) with managed Postgres; national = k8s.** Ingest jobs, freshness checks, and the closure-sync sidecar (VALHALLA_CLOSURES) run on a lightweight scheduler (cron in compose / a worker), separate from the API.

## 6. Tabletop exit gates

1. Roles enforced end-to-end (Viewer cannot approve; Approver cannot act without the role; two-person public-alert rule holds).
2. Freshness contract is truthful in the session (no fake green; SEEDED/DEMO visible wherever data is seeded).
3. Audit log captures every session action, pullable by observers.
4. Backup/restore drill passed (RPO ≤ 24 h).
5. Offline demo path works with the SEEDED banner, and drafting→approval re-review on reconnect is exercised.

After gates pass: promote the pilot to the Feni live loop (live plumbing floor), then national scale-out with k8s + PgSTAC/TiTiler.