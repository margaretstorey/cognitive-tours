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

  test('a waypoint added later has a halo until it is clicked', async ({ page, request }) => {
    await firstLoad(page);
    const label = `Halo New ${rand()}`;
    await addWaypoint(request, label);
    await page.reload();

    const node = page.locator('.react-flow__node', { hasText: label }).locator('[data-new]');
    await expect(node).toHaveAttribute('data-new', 'true');
    await page.locator('.react-flow__node', { hasText: label }).click();
    await expect(page.locator('.react-flow__node', { hasText: label }).locator('[data-new]')).toHaveCount(0);

    // Seen stays seen after a reload.
    await page.reload();
    await expect(page.locator('.react-flow__node', { hasText: label })).toBeVisible();
    await expect(page.locator('.react-flow__node', { hasText: label }).locator('[data-new]')).toHaveCount(0);
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
