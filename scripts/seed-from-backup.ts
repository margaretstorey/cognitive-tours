/**
 * Refresh local dev.db from a production backup JSON (the shape returned by
 * GET /api/data: { waypoints, edges, tours }).
 *
 * Usage:
 *   npx tsx scripts/seed-from-backup.ts <path-to-backup.json>
 *
 * Clears existing waypoints, edges, and tours in dev.db and replaces them
 * with the contents of the backup file. This only ever targets dev.db — see
 * assertSafeToRun() below.
 */

import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import type { Waypoint, WaypointEdge, Tour } from '../app/lib/types';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEV_DB_PATH = path.resolve(PROJECT_ROOT, 'prisma/dev.db');

interface Backup {
  waypoints: Waypoint[];
  edges: WaypointEdge[];
  tours: Tour[];
}

// Mirrors the explicit NODE_ENV checks in app/lib/db.ts and prisma.config.ts.
// This script never reads DATABASE_URL to build its own connection — it always
// points directly at DEV_DB_PATH — but if DATABASE_URL is set to something
// else (e.g. .env.test's test.db, loaded by accident via `dotenv -e .env.test`),
// that's a sign this was invoked in the wrong context, so refuse rather than
// silently overwrite dev.db while the caller thinks they're targeting something else.
function assertSafeToRun() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run: NODE_ENV is "production". This script only ever targets the local dev.db and must never run in production.');
    process.exit(1);
  }

  const rawUrl = process.env.DATABASE_URL;
  if (rawUrl) {
    const resolved = path.resolve(PROJECT_ROOT, rawUrl.replace(/^file:/, ''));
    if (resolved !== DEV_DB_PATH) {
      console.error(`Refusing to run: DATABASE_URL resolves to "${resolved}", but this script only ever targets "${DEV_DB_PATH}" (dev.db).`);
      console.error('This usually means it was invoked with the wrong environment loaded (e.g. .env.test). Re-run without that environment.');
      process.exit(1);
    }
  }
}

function loadBackup(filePath: string): Backup {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Backup file not found: ${resolved}`);
    process.exit(1);
  }
  const parsed = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
  if (!Array.isArray(parsed.waypoints) || !Array.isArray(parsed.edges) || !Array.isArray(parsed.tours)) {
    console.error('Backup file does not match the expected shape ({ waypoints: [], edges: [], tours: [] }).');
    process.exit(1);
  }
  return parsed as Backup;
}

async function main() {
  const backupArg = process.argv[2];
  if (!backupArg) {
    console.error('Usage: npx tsx scripts/seed-from-backup.ts <path-to-backup.json>');
    process.exit(1);
  }

  assertSafeToRun();
  const backup = loadBackup(backupArg);

  const adapter = new PrismaBetterSqlite3({ url: DEV_DB_PATH });
  const prisma = new PrismaClient({ adapter });

  console.log(`Refreshing ${DEV_DB_PATH} from ${path.resolve(backupArg)}...`);

  await prisma.tourWaypoint.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.waypoint.deleteMany();
  console.log('✓ Cleared existing waypoints, edges, and tours');

  await prisma.waypoint.createMany({
    data: backup.waypoints.map(w => ({
      id: w.id,
      label: w.label,
      type: w.type,
      description: w.description ?? null,
      notes: w.notes ?? null,
      filePath: w.filePath ?? null,
      posX: w.position.x,
      posY: w.position.y,
    })),
  });

  await prisma.edge.createMany({
    data: backup.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label ?? null,
    })),
  });

  for (const t of backup.tours) {
    await prisma.tour.create({
      data: {
        id: t.id,
        name: t.name,
        description: t.description ?? '',
        waypoints: {
          create: (t.stops ?? []).map((s, order) => ({
            waypointId: s.waypointId,
            order,
            narrative: s.narrative?.trim() || null,
          })),
        },
      },
    });
  }

  console.log(`Imported ${backup.waypoints.length} waypoints, ${backup.edges.length} edges, ${backup.tours.length} tours`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Failed to seed from backup:', err);
  process.exit(1);
});
