/**
 * Every Cognitive Tours site: the user's own (null), then each name in the
 * server-only SITE_NAMES env var, a comma-separated list such as
 * "test,demo,acme". Used by scripts/backup-all-sites.ts, the nightly backup
 * route and scripts/restore-production-from-backup.ts.
 *
 * The names are kept out of the repo (.env locally; the cognitive-tours
 * Vercel project for the nightly backup) because a site's address is
 * cognitive-tours-<name>.vercel.app and the sites have no login: a public
 * copy of the repo must not list every student team's map. The full table
 * lives in CLAUDE.local.md, which git ignores.
 *
 * The user's own address is kept out the same way, in MY_SITE_URL.
 *
 * Read when called, not when this file loads, so the team projects (which
 * build this same code without SITE_NAMES) still build.
 */
const SITE_NAME = /^[a-z0-9][a-z0-9-]*$/;

export function getSites(): (string | null)[] {
  const raw = process.env.SITE_NAMES?.trim();
  // No fallback: a missing setting should fail loudly rather than quietly
  // back up fewer sites than there are.
  if (!raw) throw new Error('SITE_NAMES is not set; add the comma-separated site names to .env');
  const names = raw.split(',').map(s => s.trim()).filter(Boolean);
  const bad = names.filter(n => !SITE_NAME.test(n));
  if (bad.length > 0) throw new Error(`SITE_NAMES has invalid names: ${bad.join(', ')}`);
  return [null, ...new Set(names)];
}

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
