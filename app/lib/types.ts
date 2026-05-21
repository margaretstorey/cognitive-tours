export type WaypointType =
  | 'User Need'
  | 'Feature'
  | 'ADR'
  | 'Code Component'
  | 'Test'
  | 'Risk'
  | 'AI Instruction'
  | 'Open Question';

export interface Waypoint {
  id: string;
  label: string;
  type: WaypointType;
  description: string;
  notes?: string;
  position: { x: number; y: number };
}

export interface WaypointEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  waypointIds: string[];
}
