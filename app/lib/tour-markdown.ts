import type { Tour, Waypoint } from './types';
import { WAYPOINT_TYPES } from './types';
import { githubFileLink } from './repo';

export function tourSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Context a deployment adds to exports; both optional. */
export interface ExportContext {
  projectName?: string | null;
  repoUrl?: string | null;
}

function pushWaypointBody(lines: string[], wp: Waypoint, repoUrl?: string | null): void {
  if (wp.description?.trim()) {
    lines.push(wp.description);
    lines.push('');
  }

  if (wp.notes?.trim()) {
    lines.push(wp.notes);
    lines.push('');
  }

  if (wp.filePath?.trim()) {
    // Exports are shared and committed, so no one's local folder belongs in
    // them; a GitHub link is the same for everyone, so it does.
    const link = githubFileLink(repoUrl ?? null, wp.filePath);
    lines.push(link ? `[\`${wp.filePath}\`](${link})` : `\`${wp.filePath}\``);
    lines.push('');
  }
}

/**
 * One-line byline for a tour, e.g. "By Margaret-Anne · Updated 24 Sep 2026".
 * "By …" is omitted when the tour has no author; returns '' if there is
 * nothing to show.
 */
export function tourByline(tour: Tour): string {
  const parts: string[] = [];
  if (tour.author) parts.push(`By ${tour.author}`);
  if (tour.updatedAt) {
    const date = new Date(tour.updatedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    parts.push(`Updated ${date}`);
  }
  return parts.join(' · ');
}

export function generateTourMarkdown(tour: Tour, waypoints: Waypoint[], { projectName, repoUrl }: ExportContext = {}): string {
  const waypointMap = new Map(waypoints.map(w => [w.id, w]));
  const lines: string[] = [];

  lines.push(`# ${tour.name}`);
  lines.push('');

  if (projectName) {
    lines.push(`*Project: ${projectName}*`);
    lines.push('');
  }

  const byline = tourByline(tour);
  if (byline) {
    lines.push(`*${byline}*`);
    lines.push('');
  }

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

    pushWaypointBody(lines, wp, repoUrl);

    if (stop.narrative?.trim()) {
      lines.push(`> ${stop.narrative}`);
      lines.push('');
    }
  });

  return lines.join('\n');
}

export function generateFullMapMarkdown(waypoints: Waypoint[], { projectName, repoUrl }: ExportContext = {}): string {
  const lines: string[] = [];

  lines.push(projectName ? `# Full Map: ${projectName}` : '# Full Map');
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

      pushWaypointBody(lines, wp, repoUrl);
    });
  });

  return lines.join('\n');
}
