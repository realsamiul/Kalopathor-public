export const WORKFLOW_ITEMS = [
  {id: 'now_flooding'},
  {id: 'next_72h'},
  {id: 'people_at_risk'},
  {id: 'routes_shelters'},
  {id: 'gauges'},
  {id: 'alerts'},
  {id: 'data_quality'}
] as const;

export type WorkflowItemId = (typeof WORKFLOW_ITEMS)[number]['id'];

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
