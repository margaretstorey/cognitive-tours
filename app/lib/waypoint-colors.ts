import type { WaypointType } from './types';

export const WAYPOINT_COLORS: Record<WaypointType, string> = {
  'Goal':            'bg-violet-200 border-violet-600 text-violet-950',
  'User Need':       'bg-blue-100 border-blue-300 text-blue-900',
  'Feature':         'bg-green-100 border-green-300 text-green-900',
  'ADR':             'bg-yellow-100 border-yellow-300 text-yellow-900',
  'Code Component':  'bg-purple-100 border-purple-300 text-purple-900',
  'Test':            'bg-teal-100 border-teal-300 text-teal-900',
  'Risk':            'bg-red-100 border-red-300 text-red-900',
  'AI Instruction':  'bg-orange-100 border-orange-300 text-orange-900',
  'Open Question':   'bg-gray-100 border-gray-300 text-gray-900',
};
