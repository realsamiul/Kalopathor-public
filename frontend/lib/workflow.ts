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