import { Archive, Bot, CircleHelp, Code, Flag, FlaskConical, Puzzle, Scale, TriangleAlert, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WaypointType } from './types';

// One icon per waypoint type, beside WAYPOINT_COLORS, so types can be told
// apart without colour (colour-blind readers, black-and-white printouts).
// Chosen with the user on Nov 5 from a mockup of three placements.
export const WAYPOINT_ICONS: Record<WaypointType, LucideIcon> = {
  'Goal':           Flag,
  'User Need':      User,
  'Feature':        Puzzle,
  'ADR':            Scale,
  'Code Component': Code,
  'Test':           FlaskConical,
  'Risk':           TriangleAlert,
  'AI Instruction': Bot,
  'Open Question':  CircleHelp,
  'Deprecated':     Archive,
};

// The icon is decoration: the type's name is always shown beside it as
// text, so screen readers skip the icon. It takes the surrounding text
// colour.
export function WaypointTypeIcon({ type, size = 14 }: { type: WaypointType; size?: number }) {
  const Icon = WAYPOINT_ICONS[type];
  return <Icon size={size} strokeWidth={2} aria-hidden="true" data-waypoint-icon={type} className="shrink-0" />;
}
