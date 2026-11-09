import { test, expect, type APIRequestContext } from '@playwright/test';
import { START_HERE_SEEN_KEY } from '../app/components/StartHere';
import { keepPositions } from './keep-positions';

keepPositions(test);

// Undo for deletes (CognitiveToursApp.tsx): the Undo toast and Ctrl/⌘-Z put
// back what a waypoint or link delete removed.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '1'), START_HERE_SEEN_KEY);
});

const rand = () => Math.random().toString(36).slice(2, 8);

type Data = {
  waypoints: { id: string; label: string; position: { x: number; y: number } }[];
  edges: { id: string; source: string; target: string; label?: string }[];
  tours: { id: string; stops: { waypointId: string; narrative?: string }[] }[];
};

async function getData(request: APIRequestContext): Promise<Data> {
  return (await request.get('/api/data')).json();
}

test.describe('undo deletes', () => {
  const made: { waypoints: string[]; edges: string[]; tours: string[] } = { waypoints: [], edges: [], tours: [] };

  test.afterEach(async ({ request }) => {
    for (const id of made.tours) await request.delete(`/api/tours/${id}`);
    for (const id of made.edges) await request.delete(`/api/edges/${id}`);
    for (const id of made.waypoints) await request.delete(`/api/waypoints/${id}`);
    made.waypoints = [];
    made.edges = [];
    made.tours = [];
  });

  // Waypoints go in a column below the rest of the map, so nothing covers
  // them or the link between them.
  async function addWaypoints(request: APIRequestContext, labels: string[]) {
    const { waypoints } = await getData(request);
    const x = waypoints.length > 0 ? Math.min(...waypoints.map(w => w.position.x)) : 100;
    const y = waypoints.length > 0 ? Math.max(...waypoints.map(w => w.position.y)) + 300 : 100;
    const ids: string[] = [];
    for (const [i, label] of labels.entries()) {
      const id = `w-${Date.now()}-${rand()}`;
      const res = await request.post('/api/waypoints', {
        data: { id, label, type: 'Feature', description: `About ${label}.`, notes: 'Some notes.', filePath: null, position: { x, y: y + i * 250 } },
      });
      expect(res.ok()).toBeTruthy();
      made.waypoints.push(id);
      ids.push(id);
    }
    return ids;
  }

  async function addEdge(request: APIRequestContext, source: string, target: string, label: string) {
    const id = `e-${Date.now()}-${rand()}`;
    expect((await request.post('/api/edges', { data: { id, source, target, label } })).ok()).toBeTruthy();
    made.edges.push(id);
    return id;
  }

  test('Undo in the toast puts back a waypoint, its link and its tour stop with its narrative', async ({ page, request }) => {
    const label = `Undo Me ${rand()}`;
    const [before, deleted, after] = await addWaypoints(request, [`Undo Before ${rand()}`, label, `Undo After ${rand()}`]);
    const edgeLabel = `undo link ${rand()}`;
    const edgeId = await addEdge(request, deleted, after, edgeLabel);
    const tourId = `t-${Date.now()}-${rand()}`;
    const stops = [
      { waypointId: before, narrative: 'On to the one we delete.' },
      { waypointId: deleted, narrative: 'The narrative that must come back.' },
      { waypointId: after, narrative: 'The end.' },
    ];
    expect((await request.post('/api/tours', {
      data: { id: tourId, name: `Undo Tour ${rand()}`, description: '', stops },
    })).ok()).toBeTruthy();
    made.tours.push(tourId);

    await page.goto('/');
    await page.locator('.react-flow__node', { hasText: label }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.locator('.react-flow__node', { hasText: label })).toHaveCount(0);

    const toast = page.getByTestId('undo-toast');
    await expect(toast).toContainText(`Deleted ${label}.`);
    // Wait until the delete has reached the server, so the undo is what's tested.
    await expect.poll(async () => (await getData(request)).waypoints.some(w => w.id === deleted)).toBe(false);
    await toast.getByRole('button', { name: 'Undo' }).click();
    await expect(toast).toHaveCount(0);

    await expect.poll(async () => {
      const data = await getData(request);
      const tour = data.tours.find(t => t.id === tourId);
      return (
        data.waypoints.some(w => w.id === deleted) &&
        data.edges.some(e => e.id === edgeId && e.label === edgeLabel) &&
        tour?.stops.map(s => s.waypointId).join(',') === stops.map(s => s.waypointId).join(',') &&
        tour?.stops[1].narrative === 'The narrative that must come back.'
      );
    }, { timeout: 10000 }).toBe(true);

    await page.reload();
    const node = page.locator('.react-flow__node', { hasText: label });
    await expect(node).toBeVisible();
    // Restored, not new: no red halo.
    await expect(node.locator('[data-new]')).toHaveCount(0);
    await expect(page.getByTestId(`rf__edge-${edgeId}`)).toHaveCount(1);
  });

  test('Ctrl/Cmd-Z puts back a link deleted by double-click', async ({ page, request }) => {
    const [a, b] = await addWaypoints(request, [`Undo Link A ${rand()}`, `Undo Link B ${rand()}`]);
    const edgeLabel = `undo key link ${rand()}`;
    const edgeId = await addEdge(request, a, b, edgeLabel);

    await page.goto('/');
    const edge = page.getByTestId(`rf__edge-${edgeId}`);
    await expect(edge).toHaveCount(1);
    // Double-click the link itself, as React Flow's onEdgeDoubleClick receives it
    // (the label's SVG text isn't a reliable click target).
    await edge.locator('path').first().dispatchEvent('dblclick');
    await expect(edge).toHaveCount(0);
    await expect(page.getByTestId('undo-toast')).toContainText('Deleted link');
    await expect.poll(async () => (await getData(request)).edges.some(e => e.id === edgeId)).toBe(false);

    await page.keyboard.press('ControlOrMeta+z');
    await expect(edge).toHaveCount(1);
    await expect.poll(async () => (await getData(request)).edges.some(e => e.id === edgeId && e.label === edgeLabel)).toBe(true);

    await page.reload();
    await expect(page.getByTestId(`rf__edge-${edgeId}`)).toHaveCount(1);
  });
});
