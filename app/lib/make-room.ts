/**
 * Make room for some waypoints by pushing the ones they overlap aside, like
 * moving sticky notes on a wall. Layout *adjustment*, not layout: every
 * other waypoint keeps the position its author gave it, so the map people
 * know stays put. In the spirit of Misue, Eades, Lai and Sugiyama, "Layout
 * adjustment and the mental map" (1995), and the push-aside strategies of
 * Storey and Müller, "Graph layout adjustment strategies" (GD '95).
 *
 * - The `fixedIds` (new or just-dropped waypoints) never move.
 * - A waypoint that overlaps one of them (closer than `gap`) is pushed
 *   straight away from it, along x or y, whichever is the shorter push,
 *   keeping which of the two is left/right or above/below.
 * - A pushed waypoint can push others in turn; nothing else moves.
 * - Deterministic: the same map gives the same result in every browser.
 *
 * Returns only the waypoints that moved, with their new positions.
 */
export type Box = { id: string; x: number; y: number; w: number; h: number };

export const MAKE_ROOM_GAP = 40;
const MAX_PASSES = 50;

function overlaps(a: Box, b: Box, gap: number): boolean {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

export function makeRoom(
  boxes: Box[],
  fixedIds: string[],
  gap: number = MAKE_ROOM_GAP,
): Map<string, { x: number; y: number }> {
  const fixed = new Set(fixedIds);
  // Sorted so the result doesn't depend on the order waypoints arrive in.
  const all = boxes.map(b => ({ ...b })).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const active = all.filter(b => fixed.has(b.id)).map(b => b.id);
  const byId = new Map(all.map(b => [b.id, b]));

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false;
    for (const pusherId of [...active]) {
      const p = byId.get(pusherId)!;
      for (const q of all) {
        if (q.id === p.id || fixed.has(q.id) || !overlaps(p, q, gap)) continue;
        const pcx = p.x + p.w / 2, pcy = p.y + p.h / 2;
        const qcx = q.x + q.w / 2, qcy = q.y + q.h / 2;
        // Away from the pusher, on the side q is already on (ties: right, down).
        const dx = qcx >= pcx ? p.x + p.w + gap - q.x : p.x - gap - (q.x + q.w);
        const dy = qcy >= pcy ? p.y + p.h + gap - q.y : p.y - gap - (q.y + q.h);
        if (Math.abs(dx) <= Math.abs(dy)) q.x += dx;
        else q.y += dy;
        if (!active.includes(q.id)) active.push(q.id);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const moved = new Map<string, { x: number; y: number }>();
  for (const b of boxes) {
    const now = byId.get(b.id)!;
    if (now.x !== b.x || now.y !== b.y) moved.set(b.id, { x: now.x, y: now.y });
  }
  return moved;
}
