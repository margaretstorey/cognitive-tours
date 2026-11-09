import { test, expect, type Page } from '@playwright/test';
import { START_HERE_SEEN_KEY } from '../app/components/StartHere';
import { keepPositions } from './keep-positions';

keepPositions(test);

// The red "new" halo (app/lib/seen.ts): waypoints and tour stops added since
// this browser last looked, until clicked or written in. Each test gets a
// fresh browser, so its first load is the baseline.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '1'), START_HERE_SEEN_KEY);
});

const rand = () => Math.random().toString(36).slice(2, 8);

/** Load the map and wait until this browser has recorded what it has seen. */
async function firstLoad(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => localStorage.getItem('cognitiveTours.seen') !== null);
}

test.describe('red halo on new waypoints and stops', () => {
  const made: { waypoints: string[]; tours: string[] } = { waypoints: [], tours: [] };

  test.afterEach(async ({ request }) => {
    for (const id of made.tours) await request.delete(`/api/tours/${id}`);
    for (const id of made.waypoints) await request.delete(`/api/waypoints/${id}`);
    made.waypoints = [];
    made.tours = [];
  });

  async function addWaypoint(request: import('@playwright/test').APIRequestContext, label: string, description = '') {
    const id = `w-${Date.now()}-${rand()}`;
    const res = await request.post('/api/waypoints', {
      data: { id, label, type: 'Feature', description, notes: null, filePath: null, position: { x: 100, y: 80 } },
    });
    expect(res.ok()).toBeTruthy();
    made.waypoints.push(id);
    return id;
  }

  test('nothing has a halo on a first visit', async ({ page, request }) => {
    await addWaypoint(request, `Halo Baseline ${rand()}`);
    await firstLoad(page);
    await expect(page.locator('.react-flow__node').first()).toBeVisible();
    await expect(page.locator('[data-new="true"]')).toHaveCount(0);
  });

  test('a waypoint added later keeps its halo through a click, until its Description field is clicked', async ({ page, request }) => {
    await firstLoad(page);
    const label = `Halo New ${rand()}`;
    await addWaypoint(request, label);
    await page.reload();

    const waypoint = page.locator('.react-flow__node', { hasText: label });
    await expect(waypoint.locator('[data-new]')).toHaveAttribute('data-new', 'true');

    // A plain click (selecting it) no longer clears the halo.
    await waypoint.click();
    await expect(waypoint.locator('[data-new]')).toHaveAttribute('data-new', 'true');

    // Opening the form doesn't either; clicking into Description does, even if you cancel.
    await waypoint.dblclick();
    const description = page.getByPlaceholder('What is this waypoint about?');
    await expect(description).toBeVisible();
    await expect(waypoint.locator('[data-new]')).toHaveAttribute('data-new', 'true');
    await description.click();
    await page.keyboard.press('Escape');
    await expect(description).toHaveCount(0);
    await expect(waypoint.locator('[data-new]')).toHaveCount(0);

    // Seen stays seen after a reload.
    await page.reload();
    await expect(page.locator('.react-flow__node', { hasText: label })).toBeVisible();
    await expect(page.locator('.react-flow__node', { hasText: label }).locator('[data-new]')).toHaveCount(0);
  });

  test('the map zooms to a batch a skill added', async ({ page, request }) => {
    await firstLoad(page);
    const a = `Halo Batch A ${rand()}`;
    const b = `Halo Batch B ${rand()}`;
    const ida = await addWaypoint(request, a);
    const idb = await addWaypoint(request, b);
    // Two spots inside the seeded map, apart from each other.
    await request.put(`/api/waypoints/${ida}`, { data: { position: { x: 100, y: 80 } } });
    await request.put(`/api/waypoints/${idb}`, { data: { position: { x: 940, y: 80 } } });
    await page.reload();

    const pane = (await page.locator('.react-flow__pane').boundingBox())!;
    const inView = async (label: string) => {
      const box = await page.locator('.react-flow__node', { hasText: label }).boundingBox();
      return !!box && box.x >= pane.x && box.x + box.width <= pane.x + pane.width && box.y >= pane.y && box.y + box.height <= pane.y + pane.height;
    };
    // Fitted to the two: both in view, and far apart on screen (zoomed in
    // further than the whole map would be).
    await expect.poll(async () => (await inView(a)) && (await inView(b)), { timeout: 5000 }).toBe(true);
    await expect.poll(async () => {
      const box = (await page.locator('.react-flow__node', { hasText: a }).boundingBox())!;
      const other = (await page.locator('.react-flow__node', { hasText: b }).boundingBox())!;
      return Math.abs(other.x - box.x);
    }, { timeout: 5000 }).toBeGreaterThan(pane.width * 0.5);
  });

  test('"New to you only" in the filter panel shows just the haloed waypoints, and unticks itself', async ({ page, request }) => {
    const baseline = `Halo Filter Old ${rand()}`;
    await addWaypoint(request, baseline, 'Already here.');
    await firstLoad(page);
    const label = `Halo Filter New ${rand()}`;
    await addWaypoint(request, label);
    await page.reload();

    const waypoint = page.locator('.react-flow__node', { hasText: label });
    const old = page.locator('.react-flow__node', { hasText: baseline });
    await expect(waypoint).toBeVisible();
    await expect(old).toBeVisible();

    // Other test files run in parallel and may add waypoints that are also
    // new to this browser, so counts are checked loosely (at least ours).
    const filterButton = page.getByRole('button', { name: /^Filter/ });
    await filterButton.click();
    const newOnly = page.getByRole('checkbox', { name: /New to you only/ });
    await expect(newOnly).toBeEnabled();
    await expect(page.getByText(/New to you only \([1-9]\d*\)/)).toBeVisible();
    await newOnly.check();
    await expect(waypoint).toBeVisible();
    await expect(old).toHaveCount(0);
    await expect(filterButton).toHaveText('Filter (1 hidden)');

    // Close the panel and open the edit form from the Waypoint panel: select
    // it, then Edit. (Not a double-click: other tests' new waypoints, at the
    // same spot and also shown by this filter, can be under the pointer.)
    await filterButton.click();
    const description = page.getByPlaceholder('What is this waypoint about?');
    await expect(async () => {
      await waypoint.click();
      await expect(page.getByRole('heading', { name: label })).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(description).toBeVisible();

    // Clear the halo: into Description and out again.
    await description.click();
    await page.keyboard.press('Escape');
    await expect(description).toHaveCount(0);

    // Ours is no longer new: either nothing new is left, so the filter turned
    // itself off and the rest are back, or (another test's waypoint is still
    // new) ours has dropped out of the filtered view.
    await expect.poll(async () => (await old.count()) > 0 || (await waypoint.count()) === 0).toBe(true);
    if ((await old.count()) > 0) {
      await expect(filterButton).toHaveText('Filter');
      await filterButton.click();
      await expect(newOnly).not.toBeChecked();
    }
  });

  test('a waypoint added later with a description has no halo', async ({ page, request }) => {
    await firstLoad(page);
    const label = `Halo Described ${rand()}`;
    await addWaypoint(request, label, 'Already written.');
    await page.reload();
    await expect(page.locator('.react-flow__node', { hasText: label })).toBeVisible();
    await expect(page.locator('.react-flow__node', { hasText: label }).locator('[data-new]')).toHaveCount(0);
  });

  test('a stop added to a tour has a halo in Edit tour until its narrative box is clicked', async ({ page, request }) => {
    const first = await addWaypoint(request, `Halo Stop One ${rand()}`, 'One.');
    const secondLabel = `Halo Stop Two ${rand()}`;
    const second = await addWaypoint(request, secondLabel, 'Two.');
    const tourId = `t-${Date.now()}-${rand()}`;
    const tourName = `Halo Tour ${rand()}`;
    expect((await request.post('/api/tours', {
      data: { id: tourId, name: tourName, description: '', stops: [{ waypointId: first, narrative: 'On to two.' }] },
    })).ok()).toBeTruthy();
    made.tours.push(tourId);

    await firstLoad(page);
    // Added after this browser's first look, as a skill would.
    expect((await request.put(`/api/tours/${tourId}`, {
      data: { stops: [{ waypointId: first, narrative: 'On to two.' }, { waypointId: second, narrative: null }] },
    })).ok()).toBeTruthy();
    await page.reload();

    await page.getByLabel('Tour:').selectOption({ label: tourName });
    await page.getByRole('button', { name: 'Edit tour' }).click();
    const rows = page.getByTestId('tour-editor-stop');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).not.toHaveAttribute('data-new', 'true');
    await expect(rows.nth(1)).toHaveAttribute('data-new', 'true');
    await expect(rows.nth(1)).toContainText('new');

    await rows.nth(1).locator('textarea').click();
    await expect(rows.nth(1)).not.toHaveAttribute('data-new', 'true');
  });
});
