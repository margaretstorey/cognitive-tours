import type { Tour, Waypoint } from './types';
import { WAYPOINT_TYPES } from './types';

export function tourSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function pushWaypointBody(lines: string[], wp: Waypoint): void {
  if (wp.description?.trim()) {
    lines.push(wp.description);
    lines.push('');
  }

  if (wp.notes?.trim()) {
    lines.push(wp.notes);
    lines.push('');
  }

  if (wp.filePath?.trim()) {
    lines.push(`[\`${wp.filePath}\`](vscode://file/Users/mstorey/shrimp-2/${wp.filePath})`);
    lines.push('');
  }
}

export function generateTourMarkdown(tour: Tour, waypoints: Waypoint[]): string {
  const waypointMap = new Map(waypoints.map(w => [w.id, w]));
  const lines: string[] = [];

  lines.push(`# ${tour.name}`);
  lines.push('');

  if (tour.description.trim()) {
    lines.push(tour.description);
    lines.push('');
  }

  lines.push(`*${tour.stops.length} stop${tour.stops.length === 1 ? '' : 's'}*`);
  lines.push('');

  tour.stops.forEach((stop, index) => {
    const wp = waypointMap.get(stop.waypointId);
    if (!wp) return;

    lines.push('---');
    lines.push('');
    lines.push(`## Stop ${index + 1}: ${wp.label} (${wp.type})`);
    lines.push('');

    pushWaypointBody(lines, wp);

    if (stop.narrative?.trim()) {
      lines.push(`> ${stop.narrative}`);
      lines.push('');
    }
  });

  return lines.join('\n');
}

export function generateFullMapMarkdown(waypoints: Waypoint[]): string {
  const lines: string[] = [];

  lines.push('# Full Map');
  lines.push('');
  lines.push(`*${waypoints.length} waypoint${waypoints.length === 1 ? '' : 's'}*`);
  lines.push('');

  WAYPOINT_TYPES.forEach(type => {
    const group = waypoints
      .filter(w => w.type === type)
      .sort((a, b) => a.label.localeCompare(b.label));
    if (group.length === 0) return;

    lines.push(`## ${type} Waypoints`);
    lines.push('');

    group.forEach(wp => {
      lines.push('---');
      lines.push('');
      lines.push(`### ${wp.label}`);
      lines.push('');

      pushWaypointBody(lines, wp);
    });
  });

  return lines.join('\n');
}
