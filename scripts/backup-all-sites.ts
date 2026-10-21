/**
 * Back up every Cognitive Tours site by saving its GET /api/data response
 * ({ waypoints, edges, tours }), the shape seed-from-backup.ts reads.
 *
 * Usage:
 *   npx tsx scripts/backup-all-sites.ts
 *
 * Read-only: it only sends GET requests and never touches a database
 * directly. The user's own site is saved to backups/backup-YYYY-MM-DD.json
 * (committed); every other site to backups/teams/<name>-YYYY-MM-DD.json,
 * which is git-ignored so student work stays out of the repo. Existing files
 * are never overwritten: a second run the same day adds b, c, ...
 */

import * as path from 'path';
import * as fs from 'fs';
import { SITES, siteUrl, isSiteBackup } from '../app/lib/sites';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUPS_DIR = path.resolve(PROJECT_ROOT, 'backups');
const TEAMS_DIR = path.resolve(BACKUPS_DIR, 'teams');

// Local date, so an evening backup isn't filed under tomorrow's UTC date.
function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// backup-2026-10-20.json, then backup-2026-10-20b.json, c, ...
function freePath(dir: string, base: string): string {
  const suffixes = ['', ...'bcdefghijklmnopqrstuvwxyz'];
  for (const s of suffixes) {
    const candidate = path.join(dir, `${base}${s}.json`);
    if (!fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Too many backups for ${base} today`);
}

async function backupSite(name: string | null, date: string): Promise<void> {
  const label = (name ?? 'mine').padEnd(11);
  const res = await fetch(`${siteUrl(name)}/api/data`);
  if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);

  const data: unknown = await res.json();
  if (!isSiteBackup(data)) throw new Error(`${label} response is not { waypoints, edges, tours }`);

  const dir = name ? TEAMS_DIR : BACKUPS_DIR;
  fs.mkdirSync(dir, { recursive: true });
  const file = freePath(dir, name ? `${name}-${date}` : `backup-${date}`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

  console.log(
    `${label} ${data.waypoints.length} waypoints  ${data.edges.length} edges  ${data.tours.length} tours  → ${path.relative(PROJECT_ROOT, file)}`
  );
}

async function main() {
  const date = today();
  let failed = 0;
  for (const name of SITES) {
    try {
      await backupSite(name, date);
    } catch (err) {
      failed++;
      console.error(`FAILED ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} of ${SITES.length} sites failed.`);
    process.exit(1);
  }
  console.log(`\nAll ${SITES.length} sites backed up.`);
}

main();
