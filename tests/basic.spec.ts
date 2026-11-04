import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { generateFullMapMarkdown, generateTourMarkdown } from '../app/lib/tour-markdown';
import type { Tour, Waypoint } from '../app/lib/types';
import { githubFileLink, isLinkPath, linkLabel, normalizeGitHubRepo } from '../app/lib/repo';
import { vscodeLink } from '../app/lib/code-folder';
import { getSites } from '../app/lib/sites';
import { parseSiteColor, parseSiteNotice } from '../app/lib/project';

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

  test('a new waypoint appears where the cursor was on the map', async ({ page }) => {
    waypointLabel = `Playwright Cursor Waypoint ${Date.now()}`;
    await page.goto('/');
    const pane = (await page.locator('.react-flow__pane').boundingBox())!;
    const cursor = { x: pane.x + pane.width * 0.4, y: pane.y + pane.height * 0.6 };
    await page.mouse.move(cursor.x, cursor.y);
    // The waypoint panel's button, outside the map, so the last position the
    // map saw is the one above.
    await page.getByRole('button', { name: '+ Add Waypoint' }).and(page.locator(':not([data-testid])')).click();
    const form = page.locator('.fixed.inset-0.z-50');
    await form.getByPlaceholder('Short descriptive title').fill(waypointLabel);
    await form.locator('select').selectOption('Feature');
    await form.getByRole('button', { name: 'Save' }).click();

    const node = (await page.locator('.react-flow__node', { hasText: waypointLabel }).boundingBox())!;
    expect(Math.abs(node.x + node.width / 2 - cursor.x)).toBeLessThan(node.width);
    expect(Math.abs(node.y + node.height / 2 - cursor.y)).toBeLessThan(node.height);
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
  test('no notice and a black header when the site settings are unset', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Cognitive Tours' })).toBeVisible();
    await expect(page.getByTestId('site-notice')).toHaveCount(0);
    await expect(page.getByTestId('app-header')).toHaveClass(/bg-black/);
  });

  test('site notice and colour settings are cleaned up or ignored', () => {
    expect(parseSiteNotice(undefined)).toBeNull();
    expect(parseSiteNotice('   ')).toBeNull();
    expect(parseSiteNotice('  Demo site:\n  edits may be lost. ')).toBe('Demo site: edits may be lost.');
    expect(parseSiteNotice('x'.repeat(400))).toHaveLength(300);

    expect(parseSiteColor('#7f1d1d')).toBe('#7f1d1d');
    expect(parseSiteColor(' #abc ')).toBe('#abc');
    for (const bad of [undefined, '', 'red', '7f1d1d', '#12345', 'url(x)', '#7f1d1d; color: red']) {
      expect(parseSiteColor(bad), String(bad)).toBeNull();
    }
  });

  test('no project pill when NEXT_PUBLIC_PROJECT_NAME is unset', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Cognitive Tours' })).toBeVisible();
    await expect(page.getByTestId('project-name')).toHaveCount(0);
    await expect(page).toHaveTitle('Cognitive Tours');
  });

  test('exports carry the project name only when one is given', () => {
    const wp: Waypoint = { id: 'w1', label: 'A waypoint', type: 'Feature', position: { x: 0, y: 0 } };
    const tour: Tour = { id: 't1', name: 'A tour', description: '', stops: [{ waypointId: 'w1' }] };

    expect(generateTourMarkdown(tour, [wp], { projectName: 'Acme' })).toContain('*Project: Acme*');
    expect(generateTourMarkdown(tour, [wp])).not.toContain('Project:');

    expect(generateFullMapMarkdown([wp], { projectName: 'Acme' })).toMatch(/^# Full Map: Acme$/m);
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
    await form.getByPlaceholder(/MyComponent\.tsx/).fill('app/page.tsx');
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

test.describe('GitHub repo links', () => {
  const label = 'Repo Link Waypoint';
  const acme = 'https://github.com/acme-startup/acme';

  test.afterEach(async ({ request }) => {
    const { waypoints } = await (await request.get('/api/data')).json();
    const wp = waypoints.find((w: { label: string }) => w.label === label);
    if (wp) await request.delete(`/api/waypoints/${wp.id}`);
  });

  test('normalizes the repo addresses people paste', () => {
    for (const input of [
      acme, `${acme}/`, `${acme}.git`, `${acme}/tree/main/app`, 'github.com/acme-startup/acme',
      'git@github.com:acme-startup/acme.git',
    ]) {
      expect(normalizeGitHubRepo(input), input).toBe(acme);
    }
    for (const bad of ['https://gitlab.com/x/y', 'acme', 'https://github.com/acme-startup', '']) {
      expect(normalizeGitHubRepo(bad), bad).toBeNull();
    }
  });

  test('exports link file paths to GitHub only when a repo is known', () => {
    const wp: Waypoint = { id: 'w1', label: 'A', type: 'Code Component', filePath: 'app/page.tsx', position: { x: 0, y: 0 } };
    expect(generateFullMapMarkdown([wp], { repoUrl: acme })).toContain(`[\`app/page.tsx\`](${acme}/blob/HEAD/app/page.tsx)`);
    expect(generateFullMapMarkdown([wp])).toContain('`app/page.tsx`');
    expect(generateFullMapMarkdown([wp])).not.toContain('github.com');
  });

  test('a student sets the repo once and gets View on GitHub', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('canvas-add-waypoint').click();
    const form = page.locator('.fixed.inset-0.z-50');
    await form.getByPlaceholder('Short descriptive title').fill(label);
    await form.locator('select').selectOption('Code Component');
    await form.getByPlaceholder(/MyComponent\.tsx/).fill('app/page.tsx');
    await form.getByRole('button', { name: 'Save' }).click();
    await page.getByText(label).click();

    await expect(page.getByRole('link', { name: 'View on GitHub' })).toHaveCount(0);
    await page.getByRole('button', { name: "Set your team's GitHub repo" }).click();
    const input = page.getByLabel("Your team's GitHub repo");

    await input.fill('acme');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText("That doesn't look like a GitHub repo link.")).toBeVisible();

    await input.fill(`${acme}.git`);
    await page.getByRole('button', { name: 'Save' }).click();
    const link = page.getByRole('link', { name: 'View on GitHub' });
    await expect(link).toHaveAttribute('href', `${acme}/blob/HEAD/app/page.tsx`);

    await page.reload();
    await page.getByText(label).click();
    await expect(page.getByRole('link', { name: 'View on GitHub' })).toHaveAttribute('href', `${acme}/blob/HEAD/app/page.tsx`);

    // Removing the personal setting falls back to the site's (none in tests).
    await page.getByRole('button', { name: 'change repo' }).click();
    await page.getByRole('button', { name: 'Remove my repo setting' }).click();
    await expect(page.getByRole('link', { name: 'View on GitHub' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: "Set your team's GitHub repo" })).toBeVisible();
  });
});

test.describe('full links as file paths', () => {
  const notes = 'https://github.com/acme-startup/customer-notes/blob/main/acme.md';
  const doc = 'https://docs.example.com/interviews/acme';
  const labels = ['GitHub Link Waypoint', 'Doc Link Waypoint'];

  test.afterEach(async ({ request }) => {
    const { waypoints } = await (await request.get('/api/data')).json();
    for (const wp of waypoints.filter((w: { label: string }) => labels.includes(w.label))) {
      await request.delete(`/api/waypoints/${wp.id}`);
    }
  });

  test('link paths are used as-is, everywhere', () => {
    expect(isLinkPath(notes)).toBe(true);
    expect(isLinkPath('src/app.tsx')).toBe(false);
    expect(githubFileLink(null, notes)).toBe(notes);
    expect(githubFileLink('https://github.com/acme-startup/acme', notes)).toBe(notes);
    expect(vscodeLink('/Users/you/repo', notes)).toBeNull();
    expect(linkLabel(notes)).toBe('View on GitHub');
    expect(linkLabel(doc)).toBe('Open link');
    const wp: Waypoint = { id: 'w1', label: 'A', type: 'User Need', filePath: notes, position: { x: 0, y: 0 } };
    expect(generateFullMapMarkdown([wp])).toContain(`[\`${notes}\`](${notes})`);
  });

  test('a waypoint linked to another repo or a doc needs no setup', async ({ page }) => {
    await page.goto('/');
    for (const [label, link] of [[labels[0], notes], [labels[1], doc]]) {
      await page.getByTestId('canvas-add-waypoint').click();
      const form = page.locator('.fixed.inset-0.z-50');
      await form.getByPlaceholder('Short descriptive title').fill(label);
      await form.locator('select').selectOption('User Need');
      await form.getByPlaceholder(/MyComponent\.tsx/).fill(link);
      await form.getByRole('button', { name: 'Save' }).click();
    }

    await page.getByText(labels[0]).click();
    await expect(page.getByRole('link', { name: 'View on GitHub' })).toHaveAttribute('href', notes);
    await expect(page.getByRole('button', { name: "Set your team's GitHub repo" })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Set your code folder to open in VS Code' })).toHaveCount(0);

    await page.getByText(labels[1]).click();
    await expect(page.getByRole('link', { name: 'Open link' })).toHaveAttribute('href', doc);
  });
});

test.describe('download backup', () => {
  test('downloads this site\'s map as restorable JSON', async ({ page }) => {
    await page.goto('/');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download backup ↓' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/backup-\d{4}-\d{2}-\d{2}\.json$/);
    const backup = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    expect(Array.isArray(backup.waypoints)).toBe(true);
    expect(Array.isArray(backup.edges)).toBe(true);
    expect(Array.isArray(backup.tours)).toBe(true);
  });
});

test.describe('markdown view opens at the current stop', () => {
  const tourName = 'Markdown Jump Tour';

  test.afterEach(async ({ request }) => {
    const { tours } = await (await request.get('/api/data')).json();
    const tour = tours.find((t: { name: string }) => t.name === tourName);
    if (tour) await request.delete(`/api/tours/${tour.id}`);
  });

  test('switching to Markdown View jumps to the stop you are on', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '+ New Tour' }).click();
    const modal = page.locator('.fixed.inset-0.z-50');
    await modal.getByPlaceholder('Tour name').fill(tourName);
    const picker = modal.locator('select').filter({ hasText: 'Add a waypoint' });
    // Enough stops that the last one starts well below the fold.
    for (let i = 1; i <= 10; i++) await picker.selectOption({ index: i });
    await modal.getByRole('button', { name: 'Save' }).click();

    await page.getByLabel('Tour:').selectOption({ label: tourName });
    for (let i = 0; i < 9; i++) await page.getByRole('button', { name: 'Next →' }).click();
    await page.getByRole('button', { name: 'Markdown View' }).click();

    await expect(page.locator('#stop-9')).toBeInViewport();
    await expect(page.locator('#stop-0')).not.toBeInViewport();
  });
});

test.describe('search highlights instead of hiding', () => {
  const word = `Zebrafish${Date.now()}`;
  const labels = [`${word} Alpha`, `${word} Beta`, `Unrelated ${Date.now()}`];

  test.afterEach(async ({ request }) => {
    for (const [i] of labels.entries()) await request.delete(`/api/waypoints/w-search-${i}`);
  });

  test('matches are spotlighted one at a time and nothing is hidden', async ({ page, request }) => {
    for (const [i, label] of labels.entries()) {
      await request.post('/api/waypoints', {
        data: { id: `w-search-${i}`, label, type: 'Feature', position: { x: 2000 + i * 250, y: 2000 } },
      });
    }
    await page.goto('/');
    const nodes = page.locator('.react-flow__node');
    await expect(nodes.filter({ hasText: labels[2] })).toHaveCount(1);
    const before = await nodes.count();

    const search = page.getByPlaceholder('Search…');
    await search.fill(word);
    await expect(nodes).toHaveCount(before);
    await expect(page.getByTestId('search-counter')).toHaveText(/1 of 2/);
    await expect(page.locator('[data-current-match]')).toHaveText(new RegExp(labels[0]));
    await expect(page.locator('.react-flow__node.selected')).toHaveText(new RegExp(labels[0]));

    await search.press('Enter');
    await expect(page.getByTestId('search-counter')).toHaveText(/2 of 2/);
    await expect(page.locator('[data-current-match]')).toHaveText(new RegExp(labels[1]));
    await expect(page.locator('.react-flow__node.selected')).toHaveText(new RegExp(labels[1]));

    await search.press('Shift+Enter');
    await expect(page.getByTestId('search-counter')).toHaveText(/1 of 2/);

    await search.press('Escape');
    await expect(search).toHaveValue('');
    await expect(page.getByTestId('search-counter')).toHaveCount(0);
    await expect(page.locator('[data-current-match]')).toHaveCount(0);
    await expect(nodes.filter({ hasText: labels[2] })).not.toHaveAttribute('style', /opacity/);

    // Clicking empty canvas ends the search too.
    await search.fill(word);
    await expect(page.locator('[data-current-match]')).toHaveCount(1);
    await page.locator('.react-flow__pane').click({ position: { x: 20, y: 20 } });
    await expect(search).toHaveValue('');
    await expect(page.getByTestId('search-counter')).toHaveCount(0);
    await expect(page.locator('[data-current-match]')).toHaveCount(0);

    // So does clicking a waypoint, which stays selected.
    await search.fill(word);
    await expect(page.locator('[data-current-match]')).toHaveCount(1);
    await nodes.filter({ hasText: labels[1] }).click();
    await expect(search).toHaveValue('');
    await expect(page.locator('[data-current-match]')).toHaveCount(0);
    await expect(page.locator('.react-flow__node.selected')).toHaveText(new RegExp(labels[1]));

    // So does the Exit search button.
    await search.fill(word);
    await expect(page.locator('[data-current-match]')).toHaveCount(1);
    await page.getByRole('button', { name: 'Exit search' }).click();
    await expect(search).toHaveValue('');
    await expect(page.getByTestId('search-counter')).toHaveCount(0);
    await expect(page.locator('[data-current-match]')).toHaveCount(0);
  });
});

test.describe('site list comes from SITE_NAMES', () => {
  const saved = process.env.SITE_NAMES;
  test.afterEach(() => {
    if (saved === undefined) delete process.env.SITE_NAMES;
    else process.env.SITE_NAMES = saved;
  });

  test('own site first, then the names, without duplicates', () => {
    process.env.SITE_NAMES = ' test, acme ,demo,acme,';
    expect(getSites()).toEqual([null, 'test', 'acme', 'demo']);
  });

  test('fails loudly when unset or invalid', () => {
    delete process.env.SITE_NAMES;
    expect(() => getSites()).toThrow(/SITE_NAMES is not set/);
    process.env.SITE_NAMES = 'test,Bad Name';
    expect(() => getSites()).toThrow(/invalid names: Bad Name/);
  });
});
