import { test, expect } from '@playwright/test';
import { generateFullMapMarkdown, generateTourMarkdown } from '../app/lib/tour-markdown';
import type { Tour, Waypoint } from '../app/lib/types';

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
    await page.getByTestId('canvas-add-waypoint').click();
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
    await page.getByTestId('canvas-add-waypoint').click();
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
  await page.getByLabel('Tour:')
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
    await page.getByLabel('Tour:').selectOption({ label: 'Docent Test Tour' });

    // Amber narrative bar should be visible with the stop's narrative
    const bar = page.getByTestId('docent-narrative-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText(narrative);
  });
});

test.describe('tour author and updated date', () => {
  test.afterEach(async ({ request }) => {
    const { tours } = await (await request.get('/api/data')).json();
    const tour = tours.find((t: { name: string }) => t.name === 'Author Test Tour');
    if (tour) await request.delete(`/api/tours/${tour.id}`);
  });

  test('markdown view shows the tour author and updated date after reload', async ({ page, request }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '+ New Tour' }).click();
    const modal = page.locator('.fixed.inset-0.z-50');
    await modal.getByPlaceholder('Tour name').fill('Author Test Tour');
    await modal.getByLabel('Author').fill('Playwright Author');
    await modal.getByRole('button', { name: 'Save' }).click();

    // The server stores the author and sets the timestamps.
    await expect(async () => {
      const { tours } = await (await request.get('/api/data')).json();
      const saved = tours.find((t: { name: string }) => t.name === 'Author Test Tour');
      expect(saved?.author).toBe('Playwright Author');
      expect(saved?.updatedAt).toBeTruthy();
    }).toPass();

    // Reload so the byline comes from the database, not optimistic state.
    await page.reload();
    await page.getByLabel('Tour:').selectOption({ label: 'Author Test Tour' });
    await page.getByRole('button', { name: 'Markdown View' }).click();

    const byline = page.getByTestId('tour-byline');
    await expect(byline).toContainText('By Playwright Author');
    await expect(byline).toContainText('Updated');
  });
});

test.describe('add waypoint while a tour has collapsed the panel', () => {
  const tourName = 'Collapsed Panel Tour';
  const waypointLabel = 'Added From Canvas';

  test.afterEach(async ({ request }) => {
    const { tours, waypoints } = await (await request.get('/api/data')).json();
    const tour = tours.find((t: { name: string }) => t.name === tourName);
    if (tour) await request.delete(`/api/tours/${tour.id}`);
    const wp = waypoints.find((w: { label: string }) => w.label === waypointLabel);
    if (wp) await request.delete(`/api/waypoints/${wp.id}`);
  });

  test('canvas Add Waypoint stays reachable after selecting a tour', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '+ New Tour' }).click();
    const modal = page.locator('.fixed.inset-0.z-50');
    await modal.getByPlaceholder('Tour name').fill(tourName);
    await modal.locator('select').filter({ hasText: 'Add a waypoint' }).selectOption({ index: 1 });
    await modal.getByRole('button', { name: 'Save' }).click();

    // Selecting a tour collapses the waypoint panel by design.
    await page.getByLabel('Tour:').selectOption({ label: tourName });
    await expect(page.getByTitle('Expand waypoint panel')).toBeVisible();
    await expect(page.getByTitle('Expand waypoint panel')).toContainText('Waypoints');

    await page.getByTestId('canvas-add-waypoint').click();
    const form = page.locator('.fixed.inset-0.z-50');
    await form.getByPlaceholder('Short descriptive title').fill(waypointLabel);
    await form.locator('select').selectOption('Feature');
    await form.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(waypointLabel)).toBeAttached();
  });
});

test('filter panel closes when clicking the graph canvas', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Filter/ }).click();
  const selectAll = page.getByRole('button', { name: 'Select all' });
  await expect(selectAll).toBeVisible();

  // Blank canvas, away from nodes and the top-right overlay.
  const pane = page.locator('.react-flow__pane');
  const box = await pane.boundingBox();
  if (!box) throw new Error('graph pane not found');
  // Find a point on the empty pane itself (not a node, edge or control).
  const point = await page.evaluate(({ x, y, w, h }) => {
    for (let fy = 0.1; fy < 0.9; fy += 0.1) {
      for (let fx = 0.1; fx < 0.9; fx += 0.1) {
        const px = x + w * fx, py = y + h * fy;
        if (document.elementFromPoint(px, py)?.classList.contains('react-flow__pane')) return { px, py };
      }
    }
    return null;
  }, { x: box.x, y: box.y, w: box.width, h: box.height });
  if (!point) throw new Error('no empty canvas point found');
  await page.mouse.click(point.px, point.py);

  await expect(selectAll).not.toBeVisible();
});

test.describe('tour stop focus', () => {
  const tourName = 'Focus Test Tour';

  test.afterEach(async ({ request }) => {
    const { tours } = await (await request.get('/api/data')).json();
    const tour = tours.find((t: { name: string }) => t.name === tourName);
    if (tour) await request.delete(`/api/tours/${tour.id}`);
  });

  test('Next centers and spotlights the current stop; overview shows the whole tour', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '+ New Tour' }).click();
    const modal = page.locator('.fixed.inset-0.z-50');
    await modal.getByPlaceholder('Tour name').fill(tourName);
    const picker = modal.locator('select').filter({ hasText: 'Add a waypoint' });
    // Two stops far apart in the alphabetical list, so likely far apart on the map.
    await picker.selectOption({ index: 1 });
    const optionCount = await picker.locator('option').count();
    await picker.selectOption({ index: optionCount - 1 });
    await modal.getByRole('button', { name: 'Save' }).click();

    await page.getByLabel('Tour:').selectOption({ label: tourName });
    await page.getByRole('button', { name: 'Next →' }).click();

    const pane = page.locator('.react-flow__pane');
    const current = page.locator('[data-current-stop="true"]');
    await expect(current).toHaveCount(1);

    const centred = async () => {
      const p = (await pane.boundingBox())!;
      const n = (await current.boundingBox())!;
      const dx = Math.abs(n.x + n.width / 2 - (p.x + p.width / 2)) / p.width;
      const dy = Math.abs(n.y + n.height / 2 - (p.y + p.height / 2)) / p.height;
      return dx < 0.15 && dy < 0.15;
    };
    await expect.poll(centred).toBe(true);

    // Overview fits every stop inside the pane.
    await page.getByRole('button', { name: 'Show whole tour' }).click();
    // Tour stops are the nodes not dimmed to 0.2 (current stop and other stops).
    const stops = page.locator('.react-flow__node:not([style*="opacity: 0.2"])');
    await expect.poll(async () => {
      const p = (await pane.boundingBox())!;
      for (const box of await Promise.all((await stops.all()).map(s => s.boundingBox()))) {
        if (!box) return false;
        if (box.x < p.x || box.y < p.y || box.x + box.width > p.x + p.width || box.y + box.height > p.y + p.height) return false;
      }
      return true;
    }).toBe(true);

    await page.getByRole('button', { name: 'Back to stop' }).click();
    await expect.poll(centred).toBe(true);
  });
});

test.describe('tour live indicators', () => {
  const tourName = 'Live Indicator Tour';

  test.afterEach(async ({ request }) => {
    const { tours } = await (await request.get('/api/data')).json();
    const tour = tours.find((t: { name: string }) => t.name === tourName);
    if (tour) await request.delete(`/api/tours/${tour.id}`);
  });

  test('green selector and a top-bar Exit tour whenever Tour Controls is not visible', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '+ New Tour' }).click();
    const modal = page.locator('.fixed.inset-0.z-50');
    await modal.getByPlaceholder('Tour name').fill(tourName);
    await modal.locator('select').filter({ hasText: 'Add a waypoint' }).selectOption({ index: 1 });
    await modal.getByRole('button', { name: 'Save' }).click();

    const selector = page.getByLabel('Tour:');
    const topbarExit = page.getByTestId('topbar-exit-tour');

    await selector.selectOption({ label: tourName });
    await expect(selector).toHaveClass(/border-green-600/);
    await expect(topbarExit).toHaveCount(0);

    // Collapsed Tour Controls: the top bar offers Exit.
    await page.getByTitle('Collapse tour controls panel').click();
    await expect(page.getByTitle('Expand tour controls panel')).toContainText('Tour');
    await topbarExit.click();
    await expect(selector).toHaveValue('');
    await expect(selector).not.toHaveClass(/border-green-600/);

    // Markdown view hides Tour Controls entirely, so the top bar offers Exit there too.
    await selector.selectOption({ label: tourName });
    await page.getByRole('button', { name: 'Markdown View' }).click();
    await expect(topbarExit).toBeVisible();
  });
});

test.describe('project name', () => {
  test('no project pill when NEXT_PUBLIC_PROJECT_NAME is unset', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Cognitive Tours' })).toBeVisible();
    await expect(page.getByTestId('project-name')).toHaveCount(0);
    await expect(page).toHaveTitle('Cognitive Tours');
  });

  test('exports carry the project name only when one is given', () => {
    const wp: Waypoint = { id: 'w1', label: 'A waypoint', type: 'Feature', position: { x: 0, y: 0 } };
    const tour: Tour = { id: 't1', name: 'A tour', description: '', stops: [{ waypointId: 'w1' }] };

    expect(generateTourMarkdown(tour, [wp], 'Finito')).toContain('*Project: Finito*');
    expect(generateTourMarkdown(tour, [wp])).not.toContain('Project:');

    expect(generateFullMapMarkdown([wp], 'Finito')).toMatch(/^# Full Map: Finito$/m);
    expect(generateFullMapMarkdown([wp])).toMatch(/^# Full Map$/m);
  });
});

test.describe('code folder setting', () => {
  const label = 'Code Folder Waypoint';

  test.afterEach(async ({ request }) => {
    const { waypoints } = await (await request.get('/api/data')).json();
    const wp = waypoints.find((w: { label: string }) => w.label === label);
    if (wp) await request.delete(`/api/waypoints/${wp.id}`);
  });

  test('Open in VS Code uses the folder set in this browser, and remembers it', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('canvas-add-waypoint').click();
    const form = page.locator('.fixed.inset-0.z-50');
    await form.getByPlaceholder('Short descriptive title').fill(label);
    await form.locator('select').selectOption('Code Component');
    await form.getByPlaceholder('e.g. src/components/MyComponent.tsx').fill('app/page.tsx');
    await form.getByRole('button', { name: 'Save' }).click();
    await page.getByText(label).click();

    // No folder yet: no broken link, just the prompt to set one.
    await expect(page.getByRole('link', { name: 'Open in VS Code' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Set your code folder to open in VS Code' }).click();
    await page.getByLabel('Your code folder').fill('/tmp/repo/');
    await page.getByRole('button', { name: 'Save' }).click();

    const link = page.getByRole('link', { name: 'Open in VS Code' });
    await expect(link).toHaveAttribute('href', 'vscode://file/tmp/repo/app/page.tsx');

    await page.reload();
    await page.getByText(label).click();
    await expect(page.getByRole('link', { name: 'Open in VS Code' })).toHaveAttribute('href', 'vscode://file/tmp/repo/app/page.tsx');
  });
});
