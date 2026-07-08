import { test, expect } from '@playwright/test';

test.describe('create a waypoint', () => {
  let waypointLabel: string;

  test.afterEach(async ({ request }) => {
    const { waypoints } = await (await request.get('/api/data')).json();
    const wp = waypoints.find((w: { label: string }) => w.label === waypointLabel);
    if (wp) await request.delete(`/api/waypoints/${wp.id}`);
  });

  test('create a waypoint', async ({ page }) => {
    waypointLabel = `Playwright Test Waypoint ${Date.now()}`;
    await page.goto('/');
    await page.getByText('+ Add Waypoint').click();
    const form = page.locator('.fixed.inset-0.z-50');
    await form.getByPlaceholder('Short descriptive title').fill(waypointLabel);
    await form.locator('select').selectOption('Feature');
    await form.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(waypointLabel)).toBeVisible();
  });
});

test.describe('delete a waypoint', () => {
  test.afterEach(async ({ request }) => {
    const { waypoints } = await (await request.get('/api/data')).json();
    const wp = waypoints.find((w: { label: string }) => w.label === 'Waypoint To Delete');
    if (wp) await request.delete(`/api/waypoints/${wp.id}`);
  });

  test('delete a waypoint', async ({ page }) => {
    await page.goto('/');
    await page.getByText('+ Add Waypoint').click();
    const form = page.locator('.fixed.inset-0.z-50');
    await form.getByPlaceholder('Short descriptive title').fill('Waypoint To Delete');
    await form.locator('select').selectOption('Feature');
    await form.getByRole('button', { name: 'Save' }).click();
    await page.getByText('Waypoint To Delete').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Waypoint To Delete')).not.toBeVisible();
  });
});

test('tour navigation increments step counter', async ({ page }) => {
  await page.goto('/');
  await page.locator('select').filter({ hasText: 'No tour selected' })
    .selectOption({ label: 'New Developer Orientation' });
  await expect(page.getByText(/Step 1 of/)).toBeVisible();
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.getByText(/Step 2 of/)).toBeVisible();
});

test.describe('docent mode', () => {
  test.afterEach(async ({ request }) => {
    const { tours } = await (await request.get('/api/data')).json();
    const tour = tours.find((t: { name: string }) => t.name === 'Docent Test Tour');
    if (tour) await request.delete(`/api/tours/${tour.id}`);
  });

  test('docent mode shows amber narrative bar for stops with narrative', async ({ page }) => {
    const narrative = 'Docent test narrative for Playwright.';
    await page.goto('/');

    // Create a tour with a narrative on the first stop
    await page.getByRole('button', { name: '+ New Tour' }).click();
    const modal = page.locator('.fixed.inset-0.z-50');
    await modal.getByPlaceholder('Tour name').fill('Docent Test Tour');
    await modal.locator('select').filter({ hasText: 'Add a waypoint' }).selectOption({ index: 1 });
    await modal.getByPlaceholder('Narrative for this stop (optional)').fill(narrative);
    await modal.getByRole('button', { name: 'Save' }).click();

    // Activate the tour
    await page.locator('select').filter({ hasText: 'No tour selected' }).selectOption({ label: 'Docent Test Tour' });

    // Amber narrative bar should be visible with the stop's narrative
    const bar = page.getByTestId('docent-narrative-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText(narrative);
  });
});
