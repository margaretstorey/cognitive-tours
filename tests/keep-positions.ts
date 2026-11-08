import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TestType, PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions } from '@playwright/test';

type Pos = { x: number; y: number };

/** Written by tests/snapshot-positions.ts (globalSetup) before any test runs. */
export const POSITIONS_FILE = join(tmpdir(), 'cognitive-tours-test-positions.json');

/**
 * The map makes room for new waypoints by pushing others aside and saving
 * their new positions (app/lib/make-room.ts), so a test that adds a
 * waypoint can move the ones already in test.db. After each test, put every
 * waypoint that was there before the run back where it was, so test.db
 * stays as it was. The positions come from one snapshot taken before any
 * test ran, not a per-test one: tests run in parallel, so a per-test
 * snapshot could catch another test's push, and the last test to finish
 * always leaves them right. Waypoints tests make themselves are left alone.
 */
export function keepPositions(
  test: TestType<PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>,
) {
  test.afterEach(async ({ page, request }) => {
    // Closing the page drops any position save still waiting (they're debounced).
    await page.close();
    const before = JSON.parse(readFileSync(POSITIONS_FILE, 'utf8')) as Record<string, Pos>;
    const { waypoints } = await (await request.get('/api/data')).json();
    for (const w of waypoints as { id: string; position: Pos }[]) {
      const was = before[w.id];
      if (was && (was.x !== w.position.x || was.y !== w.position.y)) {
        await request.put(`/api/waypoints/${w.id}`, { data: { position: was } });
      }
    }
  });
}
