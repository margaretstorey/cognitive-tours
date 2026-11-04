/**
 * Turn a site backup (the shape GET /api/data returns: { waypoints, edges,
 * tours }) into one SQL file that puts that site back exactly as the backup
 * had it.
 *
 * Usage:
 *   npx tsx scripts/restore-production-from-backup.ts <backup.json> <site>
 *
 * <site> is "mine" or a team site name from app/lib/sites.ts (e.g. demo).
 *
 * This script connects to nothing: no database, no network, no credentials,
 * no .env. It only reads the backup and writes
 * backups/restore/<site>-from-<backup name>.sql (git-ignored: it can hold
 * student work). Running that file is a separate, deliberate step:
 *
 *   npx tsx scripts/backup-all-sites.ts            # a fresh backup first
 *   turso auth login                               # the gmail account
 *   turso db shell ct-demo < backups/restore/demo-from-demo-canonical.sql
 *
 * Rehearse on a copy of dev.db with: sqlite3 <copy> < <file>.
 * Everything written to the site after the backup is lost.
 */

import 'dotenv/config'; // SITE_NAMES (see app/lib/sites.ts)
import * as path from 'path';
import * as fs from 'fs';
import { getSites } from '../app/lib/sites';
import type { Waypoint, WaypointEdge, Tour } from '../app/lib/types';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RESTORE_DIR = path.resolve(PROJECT_ROOT, 'backups/restore');

interface Backup {
  waypoints: Waypoint[];
  edges: WaypointEdge[];
  tours: Tour[];
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

// The names to choose from: "mine" for the user's own site (null in
// getSites()), then each name in SITE_NAMES.
function siteNames(): string[] {
  try {
    return getSites().map(s => s ?? 'mine');
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}

// "mine" is the user's own site; its database is cognitive-tours, and every
// other site's is ct-<name> (CLAUDE.local.md → Team sites).
function databaseFor(site: string): string {
  const names = siteNames();
  if (!names.includes(site)) fail(`Unknown site "${site}". Use one of: ${names.join(', ')}`);
  return site === 'mine' ? 'cognitive-tours' : `ct-${site}`;
}

function loadBackup(filePath: string): Backup {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) fail(`Backup file not found: ${resolved}`);
  const parsed = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
  if (!Array.isArray(parsed.waypoints) || !Array.isArray(parsed.edges) || !Array.isArray(parsed.tours)) {
    fail('Backup file does not match the expected shape ({ waypoints: [], edges: [], tours: [] }).');
  }
  return parsed as Backup;
}

// The database has no foreign keys from edges or tour stops to waypoints, so
// nothing else would catch a backup that points at waypoints it doesn't have.
function problemsIn(backup: Backup): string[] {
  const problems: string[] = [];
  const duplicates = (kind: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) problems.push(`duplicate ${kind} id ${id}`);
      seen.add(id);
    }
  };
  duplicates('waypoint', backup.waypoints.map(w => w.id));
  duplicates('edge', backup.edges.map(e => e.id));
  duplicates('tour', backup.tours.map(t => t.id));

  const waypointIds = new Set(backup.waypoints.map(w => w.id));
  for (const w of backup.waypoints) {
    if (!w.id || !w.label || !w.type || typeof w.position?.x !== 'number' || typeof w.position?.y !== 'number') {
      problems.push(`waypoint ${w.id ?? '(no id)'} is missing its id, label, type or position`);
    }
  }
  for (const e of backup.edges) {
    for (const end of [e.source, e.target]) {
      if (!waypointIds.has(end)) problems.push(`edge ${e.id} points at missing waypoint ${end}`);
    }
  }
  for (const t of backup.tours) {
    (t.stops ?? []).forEach((s, i) => {
      if (!waypointIds.has(s.waypointId)) problems.push(`tour "${t.name}" stop ${i + 1} points at missing waypoint ${s.waypointId}`);
    });
  }
  return problems;
}

function text(value: string | null | undefined): string {
  return value === null || value === undefined ? 'NULL' : `'${value.replace(/'/g, "''")}'`;
}

// Same text format Prisma writes (e.g. 2026-10-21T01:09:35.489+00:00).
// Older backups have no dates; the columns then fall back to their default.
function date(value: string | undefined): string {
  return value ? text(new Date(value).toISOString().replace('Z', '+00:00')) : 'CURRENT_TIMESTAMP';
}

function restoreSql(backup: Backup, source: string, site: string): string {
  const lines: string[] = [
    `-- Restores the "${site}" site from ${source}.`,
    `-- Generated ${new Date().toISOString()} by scripts/restore-production-from-backup.ts.`,
    '-- Replaces everything on the site with the backup; anything written since is lost.',
    'BEGIN;',
    'DELETE FROM "TourWaypoint";',
    'DELETE FROM "Tour";',
    'DELETE FROM "Edge";',
    'DELETE FROM "Waypoint";',
  ];
  for (const w of backup.waypoints) {
    lines.push(
      `INSERT INTO "Waypoint" ("id", "label", "type", "description", "notes", "filePath", "posX", "posY") VALUES (` +
        `${text(w.id)}, ${text(w.label)}, ${text(w.type)}, ${text(w.description)}, ${text(w.notes)}, ` +
        `${text(w.filePath)}, ${w.position.x}, ${w.position.y});`
    );
  }
  for (const e of backup.edges) {
    lines.push(
      `INSERT INTO "Edge" ("id", "source", "target", "label") VALUES (` +
        `${text(e.id)}, ${text(e.source)}, ${text(e.target)}, ${text(e.label)});`
    );
  }
  for (const t of backup.tours) {
    lines.push(
      `INSERT INTO "Tour" ("id", "name", "description", "author", "createdAt", "updatedAt") VALUES (` +
        `${text(t.id)}, ${text(t.name)}, ${text(t.description ?? '')}, ${text(t.author?.trim() || null)}, ` +
        `${date(t.createdAt)}, ${date(t.updatedAt)});`
    );
    (t.stops ?? []).forEach((s, order) => {
      lines.push(
        `INSERT INTO "TourWaypoint" ("tourId", "waypointId", "order", "narrative") VALUES (` +
          `${text(t.id)}, ${text(s.waypointId)}, ${order}, ${text(s.narrative?.trim() || null)});`
      );
    });
  }
  lines.push('COMMIT;', '');
  return lines.join('\n');
}

function main() {
  const [backupArg, site] = process.argv.slice(2);
  if (!backupArg || !site) {
    fail(`Usage: npx tsx scripts/restore-production-from-backup.ts <backup.json> <site>   (site: ${siteNames().join(', ')})`);
  }
  const database = databaseFor(site);
  const backup = loadBackup(backupArg);

  const problems = problemsIn(backup);
  if (problems.length > 0) {
    fail(`Refusing: this backup has ${problems.length} problem(s), so restoring it could break the map:\n  - ${problems.join('\n  - ')}`);
  }

  fs.mkdirSync(RESTORE_DIR, { recursive: true });
  // Named after the backup it restores, so it's clear which state it puts back.
  const file = path.join(RESTORE_DIR, `${site}-from-${path.basename(backupArg, '.json')}.sql`);
  fs.writeFileSync(file, restoreSql(backup, path.relative(PROJECT_ROOT, path.resolve(backupArg)), site));
  const rel = path.relative(PROJECT_ROOT, file);
  const stops = backup.tours.reduce((n, t) => n + (t.stops?.length ?? 0), 0);

  console.log(`Wrote ${rel}`);
  console.log(`It puts back ${backup.waypoints.length} waypoints, ${backup.edges.length} edges and ${backup.tours.length} tours (${stops} stops):`);
  for (const t of backup.tours) console.log(`  - ${t.name}`);
  console.log(`\nNothing has changed yet. To restore the "${site}" site (database ${database}):`);
  console.log('  1. npx tsx scripts/backup-all-sites.ts      (a fresh backup first)');
  console.log('  2. turso auth login                         (the gmail account)');
  console.log(`  3. turso db shell ${database} < ${rel}`);
  console.log('Anything written to the site since the backup will be lost.');
}

main();
