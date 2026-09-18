export const WORKFLOW_ITEMS = [
  {id: 'now_flooding'},
  {id: 'gauges'},
  {id: 'data_quality'}
] as const;

export type WorkflowItemId = (typeof WORKFLOW_ITEMS)[number]['id'];

// Legacy IDs kept as a union so existing code that references removed views
// still compiles — they simply resolve to 'now_flooding' at runtime.
export type LegacyViewId = WorkflowItemId | 'next_72h' | 'people_at_risk' | 'routes_shelters' | 'alerts';
export function resolveView(id: string): WorkflowItemId {
  if (id === 'now_flooding' || id === 'gauges' || id === 'data_quality') return id;
  return 'now_flooding';
}

// Prediction tile dates available in public/data/pmtiles (manifest, 2024 run).
export const PREDICTION_DATES = [
  '2024-06-18',
  '2024-06-19',
  '2024-06-20',
  '2024-06-29',
  '2024-06-30',
  '2024-07-01',
  '2024-07-02',
  '2024-07-11',
  '2024-07-13',
  '2024-08-04',
  '2024-08-05',
  '2024-08-14'
];
