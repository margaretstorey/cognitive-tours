import type { Tour, Waypoint } from './types';

export function tourSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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
    lines.push(`## Stop ${index + 1}: ${wp.label}`);
    lines.push('');

    if (wp.description?.trim()) {
      lines.push(wp.description);
      lines.push('');
    }

    if (wp.notes?.trim()) {
      lines.push(wp.notes);
      lines.push('');
    }

    if (wp.filePath?.trim()) {
      lines.push(`\`${wp.filePath}\``);
      lines.push('');
    }

    if (stop.narrative?.trim()) {
      lines.push(`> ${stop.narrative}`);
      lines.push('');
    }
  });

  return lines.join('\n');
}
