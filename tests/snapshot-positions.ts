import { writeFileSync } from 'node:fs';
import { POSITIONS_FILE } from './keep-positions';

/**
 * Playwright globalSetup: record every waypoint position in test.db once,
 * before any test runs, so tests/keep-positions.ts can put back whatever
 * the map's "make room" pushed aside during the run.
 */
export default function snapshotPositions() {
  // node:sqlite (Node 22.5+) has no types in this project's @types/node yet.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (path: string, opts: { readOnly: boolean }) => {
      prepare: (sql: string) => { all: () => unknown[] };
      close: () => void;
    };
  };
  const db = new DatabaseSync('prisma/test.db', { readOnly: true });
  const rows = db.prepare('SELECT id, posX, posY FROM Waypoint').all() as { id: string; posX: number; posY: number }[];
  db.close();
  writeFileSync(POSITIONS_FILE, JSON.stringify(Object.fromEntries(rows.map(r => [r.id, { x: r.posX, y: r.posY }]))));
}
