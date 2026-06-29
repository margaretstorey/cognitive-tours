export type WaypointType =
  | 'Goal'
  | 'User Need'
  | 'Feature'
  | 'ADR'
  | 'Code Component'
  | 'Test'
  | 'Risk'
  | 'AI Instruction'
  | 'Open Question';

export const WAYPOINT_TYPES: WaypointType[] = [
  'Goal',
  'User Need',
  'Feature',
  'ADR',
  'Code Component',
  'Test',
  'Risk',
  'AI Instruction',
  'Open Question',
];

export type FilterState = Record<WaypointType, boolean>;

export interface Waypoint {
  id: string;
  label: string;
  type: WaypointType;
  description: string;
  notes?: string;
  filePath?: string;
  position: { x: number; y: number };
}

export interface WaypointEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface TourStop {
  waypointId: string;
  narrative?: string;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  stops: TourStop[];
}

export interface AppState {
  waypoints: Waypoint[];
  edges: WaypointEdge[];
  tours: Tour[];
  selectedWaypointId: string | null;
  activeTourId: string | null;
  activeTourStep: number;
}
