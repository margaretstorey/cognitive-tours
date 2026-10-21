/**
 * Every Cognitive Tours site, mirroring CLAUDE.md → Team sites.
 * Used by scripts/backup-all-sites.ts and the nightly backup route.
 * Adding a site there means adding it here.
 *
 * null is the user's own site (cognitive-tours.vercel.app).
 */
export const SITES: (string | null)[] = [
  null,
  'test',
  'finito',
  'vitalitree',
  'evernear',
  'elevate',
  'poold',
  'ciara',
];

export function siteUrl(name: string | null): string {
  return `https://cognitive-tours${name ? `-${name}` : ''}.vercel.app`;
}

export interface SiteBackup {
  waypoints: unknown[];
  edges: unknown[];
  tours: unknown[];
}

export function isSiteBackup(data: unknown): data is SiteBackup {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return Array.isArray(d.waypoints) && Array.isArray(d.edges) && Array.isArray(d.tours);
}
