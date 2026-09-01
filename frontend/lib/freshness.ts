// Per-layer freshness contract. Single source of truth shared by the
// freshness API (app/api/freshness/route.ts) and the data-quality panel
// (app/components/DataQualityPanel.tsx). Staleness is decided SERVER-side.
export type FreshnessStatus = 'fresh' | 'stale' | 'failed';

// How a layer's status is grounded, so the UI never over-claims liveness.
//   live   -> derived from a genuine verifiable observation (e.g. SAR
//             acquisition timestamp); may truthfully show fresh/stale.
//   seeded -> seeded demo value / file mtime only; NOT a live signal.
//   static -> immutable fact (version, provenance); shown as-of a date.
export type FreshnessBasis = 'live' | 'seeded' | 'static';

export interface FfwcGauges {
  basis: FreshnessBasis;
  last_success: string | null;
  status: FreshnessStatus;
  stale_after_s: number;
}

export interface SarDetection {
  basis: FreshnessBasis;
  last_pass: string | null;
  next_pass: string | null;
  next_pass_source: 'esa_kml' | 'satmarg';
  region: string;
  status: FreshnessStatus;
}

export interface ForecastLayer {
  basis: FreshnessBasis;
  run_ts: string | null;
  status: FreshnessStatus;
}

export interface SheltersLayer {
  basis: FreshnessBasis;
  version: string;
  provenance: 'official' | 'proxy' | 'mixed';
  status: FreshnessStatus;
}

export interface ModelLayer {
  basis: FreshnessBasis;
  version: string;
  frozen: boolean;
}

export interface FreshnessContract {
  mode: 'seeded' | 'live';
  server_time: string;
  layers: {
    ffwc_gauges: FfwcGauges;
    sar_detection: SarDetection;
    forecast_glofas: ForecastLayer;
    forecast_openmeteo: ForecastLayer;
    shelters: SheltersLayer;
    model: ModelLayer;
  };
}

// Age in whole seconds between an ISO timestamp and server_time.
// Returns null when either side is missing/unparseable (never fabricates).
export function ageSeconds(
  iso: string | null | undefined,
  serverTime: string | null | undefined
): number | null {
  if (!iso || !serverTime) return null;
  const t = Date.parse(iso);
  const s = Date.parse(serverTime);
  if (Number.isNaN(t) || Number.isNaN(s)) return null;
  return Math.max(0, Math.floor((s - t) / 1000));
}

export function humanAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}