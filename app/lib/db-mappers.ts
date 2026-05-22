import type {
  Waypoint as DbWaypoint,
  Edge as DbEdge,
  Tour as DbTour,
  TourWaypoint as DbTourWaypoint,
} from '../generated/prisma/client';
import type { Waypoint, WaypointEdge, Tour, WaypointType } from './types';

export function toWaypoint(row: DbWaypoint): Waypoint {
  return {
    id: row.id,
    label: row.label,
    // SQLite stores WaypointType as a plain string; safe to cast because only valid union values are written.
    type: row.type as WaypointType,
    description: row.description,
    notes: row.notes ?? undefined,
    position: { x: row.posX, y: row.posY },
  };
}

export function toEdge(row: DbEdge): WaypointEdge {
  return {
    id: row.id,
    source: row.source,
    target: row.target,
    label: row.label ?? undefined,
  };
}

export function toTour(row: DbTour & { waypoints: DbTourWaypoint[] }): Tour {
  const sorted = [...row.waypoints].sort((a, b) => a.order - b.order);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    waypointIds: sorted.map(tw => tw.waypointId),
  };
}
