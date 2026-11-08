import { test, expect } from '@playwright/test';
import { makeRoom, MAKE_ROOM_GAP, type Box } from '../app/lib/make-room';
import { START_HERE_SEEN_KEY } from '../app/components/StartHere';
import { keepPositions } from './keep-positions';

keepPositions(test);

// Making room for new waypoints by pushing overlapping ones aside
// (app/lib/make-room.ts): nothing else moves.

const box = (id: string, x: number, y: number, w = 180, h = 60): Box => ({ id, x, y, w, h });
const clear = (a: Box, b: Box) =>
  a.x + a.w + MAKE_ROOM_GAP <= b.x || b.x + b.w + MAKE_ROOM_GAP <= a.x ||
  a.y + a.h + MAKE_ROOM_GAP <= b.y || b.y + b.h + MAKE_ROOM_GAP <= a.y;
const apply = (boxes: Box[], moved: Map<string, { x: number; y: number }>) =>
  boxes.map(b => ({ ...b, ...(moved.get(b.id) ?? {}) }));

test.describe('makeRoom', () => {
  test('pushes an overlapping waypoint aside and leaves the new one and the rest alone', () => {
    // a overlaps by 70 px sideways and 90 px vertically: the short push is right.
    const boxes = [box('new', 0, 0), box('a', 150, 10), box('far', 2000, 2000)];
    const moved = makeRoom(boxes, ['new']);
    expect([...moved.keys()]).toEqual(['a']);
    const after = apply(boxes, moved);
    expect(clear(after[0], after[1])).toBe(true);
    // Pushed the short way (right, since it was to the right), not down.
    expect(after[1].y).toBe(10);
    expect(after[1].x).toBeGreaterThan(after[0].x);
  });

  test('a push can cascade, and order between pusher and pushed is kept', () => {
    const boxes = [box('new', 0, 0), box('a', 150, 0), box('b', 380, 0), box('c', 0, 500)];
    const after = apply(boxes, makeRoom(boxes, ['new']));
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(clear(after[i], after[j])).toBe(true);
    expect(after[0].x).toBeLessThan(after[1].x);
    expect(after[1].x).toBeLessThan(after[2].x);
    expect(after[3]).toEqual(boxes[3]);
  });

  test('nothing moves when nothing overlaps, and the result is the same whatever the order', () => {
    expect(makeRoom([box('new', 0, 0), box('a', 500, 0)], ['new']).size).toBe(0);
    const boxes = [box('new', 0, 0), box('a', 60, 40), box('b', -40, 30)];
    const one = makeRoom(boxes, ['new']);
    const two = makeRoom([...boxes].reverse(), ['new']);
    expect([...one.entries()].sort()).toEqual([...two.entries()].sort());
  });
});

test.describe('the map makes room for new waypoints', () => {
  const made: string[] = [];
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(key => localStorage.setItem(key, '1'), START_HERE_SEEN_KEY);
  });
  test.afterEach(async ({ request }) => {
    for (const id of made.splice(0)) await request.delete(`/api/waypoints/${id}`);
  });

  test('a waypoint a skill adds on top of another pushes it aside on load', async ({ page, request }) => {
    const r = Math.random().toString(36).slice(2, 8);
    const oldId = `w-${Date.now()}-old${r}`;
    const newId = `w-${Date.now()}-new${r}`;
    const post = (id: string, label: string, x: number, y: number) =>
      request.post('/api/waypoints', { data: { id, label, type: 'Feature', description: '', notes: null, filePath: null, position: { x, y } } });
    expect((await post(oldId, `Room Old ${r}`, 940, 80)).ok()).toBeTruthy();
    made.push(oldId);

    await page.goto('/');
    await page.waitForFunction(() => localStorage.getItem('cognitiveTours.seen') !== null);

    expect((await post(newId, `Room New ${r}`, 960, 90)).ok()).toBeTruthy();
    made.push(newId);
    await page.reload();

    // The move is saved like a drag (debounced), so poll the site.
    await expect.poll(async () => {
      const { waypoints } = await (await request.get('/api/data')).json();
      return waypoints.find((w: { id: string }) => w.id === oldId).position;
    }, { timeout: 10000 }).not.toEqual({ x: 940, y: 80 });
    const { waypoints } = await (await request.get('/api/data')).json();
    expect(waypoints.find((w: { id: string }) => w.id === newId).position).toEqual({ x: 960, y: 90 });
  });
});
