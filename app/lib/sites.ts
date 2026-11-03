/**
 * Every Cognitive Tours site, mirroring CLAUDE.md → Team sites.
 * Used by scripts/backup-all-sites.ts and the nightly backup route.
 * Adding a site there means adding it here.
 *
 * null is the user's own site. Its address is kept out of the repo, in the
 * server-only MY_SITE_URL env var (.env locally; the cognitive-tours Vercel
 * project for the nightly backup), so it can't be found in a public copy.
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
  'demo',
];

export function siteUrl(name: string | null): string {
  if (name) return `https://cognitive-tours-${name}.vercel.app`;
  // No fallback to an old address: a missing setting should fail loudly
  // rather than quietly back up the wrong site, or none.
  const mine = process.env.MY_SITE_URL?.trim().replace(/\/+$/, '');
  if (!mine) throw new Error("MY_SITE_URL is not set; add your site's address to .env");
  return mine;
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
