export type ConfidenceClass =
  | 'observed_high'
  | 'observed_medium'
  | 'possible'
  | 'forecast_only'
  | 'review_required';

export type Passability = 'open' | 'caution' | 'blocked' | 'unknown';

export interface Geometry {
  type: string;
  coordinates: number[][][] | number[][];
}

export interface FloodPolygon {
  polygon_id: number;
  event_id: string;
  area_km2: number;
  bbox: number[];
  confidence: number;
  confidence_class: string;
  region: string;
  district: string | null;
  division: string | null;
  sar_pass_date: string;
  geometry: Geometry;
  data_flag?: string;
}

export interface Exposure {
  polygon_id: number;
  district: string;
  division: string;
  area_km2: number;
  affected_people: number;
  data_flag?: string;
}

export interface Gauge {
  gauge_id: string;
  station: string;
  river: string;
  water_level_m: number;
  danger_level_m: number;
  difference_m: number;
  status: string;
  direction: string;
  as_of: string;
  data_flag?: string;
  location?: {lat: number; lon: number};
}

export interface Shelter {
  shelter_id: string;
  name: string;
  type: string;
  official_status: string;
  capacity_status: string;
  capacity: number | null;
  data_flag?: string;
  location?: {lat: number; lon: number};
}

export interface Route {
  route_id: string;
  from_area_id: string;
  to_shelter_id: string;
  distance_km: number;
  travel_time_minutes: number;
  mode: string;
  passability: Passability;
  is_safe_for_recommendation: boolean;
  reason_codes: string[];
  valid_until: string;
  data_flag?: string;
  geometry?: Geometry;
}

export interface EvidenceItem {
  component: string;
  flag: string;
  detail: string;
}

export interface AlertDraft {
  alert_id: string;
  alert_type: string;
  language: string[];
  confidence_class: string;
  district: string;
  division: string;
  affected_people: number;
  go_before: string;
  shelter_name: string;
  route_id: string;
  status: string;
  severity?: string;
  evidence_trail: EvidenceItem[];
  messages: Record<string, {subject: string; body: string; go_before: string}>;
}

export interface EventMeta {
  event_id: string;
  name: string;
  title: string;
  district: string;
  division: string;
  confidence_class: string;
  affected_people_total: number;
  sar_pass_date: string;
  valid_until: string;
  severity: string;
  confidence: number;
}

export interface ForecastBand {
  band_id: string;
  station: string;
  river: string;
  forecast_date: string;
  horizon_hours: number;
  lead_time_hours: number;
  parameter: string;
  value: number;
  unit: string;
  source_model: string;
  band_type: string;
  proxy_scope?: string;
  data_flag?: string;
}

export interface Bundle {
  event: EventMeta;
  data_flags: Record<string, string>;
  flood_polygons: FloodPolygon[];
  gauges: Gauge[];
  forecast_bands: ForecastBand[];
  exposure: Exposure[];
  shelters: Shelter[];
  routes: Route[];
  alert_draft: AlertDraft;
}

export interface RouteState {
  kind: 'safe' | 'none';
  passability?: Passability;
  validUntil?: string;
  distanceKm?: number;
  travelTimeMinutes?: number;
  backup?: {routeId: string; shelterName: string; distanceKm: number; passability: Passability};
  reasonCodes?: string[];
}

export interface GaugeSignal {
  station: string;
  river: string;
  waterLevelM: number;
  dangerLevelM: number;
  differenceM: number;
  status: string;
  direction: string;
  asOf: string;
}

export interface ActionCardState {
  confidenceClass: ConfidenceClass;
  criticalWindowTime: string;
  affectedPeople: number;
  district: string;
  recommendedAction: string;
  shelter: {name: string; distanceKm: number | null; capacityStatus: string; capacity: number | null} | null;
  route: RouteState;
  gauge: GaugeSignal | null;
  capDraft: {alertId: string; status: string};
  evidenceTrail: EvidenceItem[];
  sarPassDate: string;
  eventId: string;
}

export const STATE_KEYS = [
  'feni',
  'observed_high',
  'possible',
  'review_required',
  'gauge_absent'
] as const;
export type StateKey = (typeof STATE_KEYS)[number];

export function bundleUrl(key: StateKey): string {
  if (key === 'feni') return '/data/feni_2024_replay.json';
  return `/data/action-states/${key}.json`;
}

export function buildFloodGeoJSON(bundle: Bundle): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: bundle.flood_polygons.map((p) => ({
      id: p.polygon_id,
      type: 'Feature',
      geometry: p.geometry as GeoJSON.Geometry,
      properties: {
        polygon_id: p.polygon_id,
        event_id: p.event_id,
        area_km2: p.area_km2,
        confidence: p.confidence,
        confidence_class: p.confidence_class,
        region: p.region
      }
    }))
  };
}

export function gaugeGeoJSON(bundle: Bundle): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: bundle.gauges
      .filter((g): g is Gauge & {location: {lat: number; lon: number}} => Boolean(g.location))
      .map((g) => ({
        type: 'Feature' as const,
        geometry: {type: 'Point', coordinates: [g.location.lon, g.location.lat]},
        properties: {
          gauge_id: g.gauge_id,
          station: g.station,
          river: g.river,
          water_level_m: g.water_level_m,
          danger_level_m: g.danger_level_m,
          difference_m: g.difference_m,
          status: g.status
        }
      }))
  };
}

export function shelterGeoJSON(bundle: Bundle): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: bundle.shelters
      .filter((s): s is Shelter & {location: {lat: number; lon: number}} => Boolean(s.location))
      .map((s) => ({
        type: 'Feature' as const,
        geometry: {type: 'Point', coordinates: [s.location.lon, s.location.lat]},
        properties: {shelter_id: s.shelter_id, name: s.name, type: s.type}
      }))
  };
}

export function routeGeoJSON(bundle: Bundle): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: bundle.routes
      .filter((r) => r.geometry && r.geometry.type === 'LineString')
      .map((r) => ({
        type: 'Feature' as const,
        geometry: r.geometry as unknown as GeoJSON.LineString,
        properties: {
          route_id: r.route_id,
          passability: r.passability,
          is_safe_for_recommendation: r.is_safe_for_recommendation,
          distance_km: r.distance_km
        }
      }))
  };
}

export function formatClock(isoWithOffset: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(isoWithOffset);
  if (!m) return isoWithOffset;
  return `${m[1]}:${m[2]}`;
}

export function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {day: 'numeric', month: 'short'});
}

function pickGauge(bundle: Bundle): GaugeSignal | null {
  const gauges = bundle.gauges;
  if (!gauges || gauges.length === 0) return null;
  const observed = gauges.find((g) => g.data_flag === 'real') ?? gauges[0];
  return {
    station: observed.station,
    river: observed.river,
    waterLevelM: observed.water_level_m,
    dangerLevelM: observed.danger_level_m,
    differenceM: observed.difference_m,
    status: observed.status,
    direction: observed.direction,
    asOf: observed.as_of
  };
}

function pickShelter(
  bundle: Bundle,
  route: RouteState
): ActionCardState['shelter'] {
  const alert = bundle.alert_draft;
  let shelter: Shelter | undefined = bundle.shelters.find(
    (s) => s.name === alert.shelter_name
  );
  if (!shelter) {
    const toId =
      route.kind === 'safe'
        ? bundle.routes.find((r) => r.is_safe_for_recommendation)?.to_shelter_id
        : bundle.routes.find((r) => r.route_id === alert.route_id)?.to_shelter_id;
    shelter = bundle.shelters.find((s) => s.shelter_id === toId);
  }
  if (!shelter) shelter = bundle.shelters[0];
  if (!shelter) return null;

  const distanceKm =
    route.kind === 'safe' && route.distanceKm
      ? route.distanceKm
      : bundle.routes.find((r) => r.to_shelter_id === shelter?.shelter_id)
          ?.distance_km ?? null;

  return {
    name: shelter.name,
    distanceKm,
    capacityStatus: shelter.capacity_status,
    capacity: shelter.capacity
  };
}

export function deriveActionCardState(
  bundle: Bundle,
  locale: string,
  polygonId?: number | null
): ActionCardState {
  const event = bundle.event;
  const alert = bundle.alert_draft;

  const safeRoutes = bundle.routes.filter((r) => r.is_safe_for_recommendation);
  const primary = safeRoutes[0];
  const backup =
    safeRoutes.length > 1
      ? safeRoutes[1]
      : undefined;
  const route: RouteState = primary
    ? {
        kind: 'safe',
        passability: primary.passability,
        validUntil: primary.valid_until,
        distanceKm: primary.distance_km,
        travelTimeMinutes: primary.travel_time_minutes,
        backup: backup
          ? {
              routeId: backup.route_id,
              shelterName:
                bundle.shelters.find((s) => s.shelter_id === backup.to_shelter_id)
                  ?.name ?? backup.to_shelter_id,
              distanceKm: backup.distance_km,
              passability: backup.passability
            }
          : undefined
      }
    : {
        kind: 'none',
        reasonCodes:
          bundle.routes.find((r) => r.route_id === alert.route_id)?.reason_codes ??
          bundle.routes[0]?.reason_codes
      };

  const exposure = bundle.exposure.find((e) => e.polygon_id === polygonId);
  const affectedPeople = exposure
    ? exposure.affected_people
    : event.affected_people_total;
  const district = exposure?.district ?? event.district;

  const msg = alert.messages?.[locale];
  const recommendedAction =
    msg?.subject || (msg?.body ? msg.body.split('.')[0] + '.' : event.title);

  return {
    confidenceClass: (alert.confidence_class ||
      event.confidence_class ||
      'review_required') as ConfidenceClass,
    criticalWindowTime: formatClock(alert.go_before),
    affectedPeople,
    district,
    recommendedAction,
    shelter: pickShelter(bundle, route),
    route,
    gauge: pickGauge(bundle),
    capDraft: {alertId: alert.alert_id, status: alert.status},
    evidenceTrail: alert.evidence_trail ?? [],
    sarPassDate: event.sar_pass_date,
    eventId: event.event_id
  };
}