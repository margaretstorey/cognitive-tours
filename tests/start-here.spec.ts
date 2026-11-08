import { test, expect } from '@playwright/test';
import { keepPositions } from './keep-positions';

keepPositions(test);

// The "Start here" walkthrough (app/components/StartHere.tsx).

test.describe('Start here walkthrough', () => {
  test('opens on a first visit, steps through, and not again after Done', async ({ page }) => {
    await page.goto('/');
    const card = page.getByRole('dialog', { name: 'Start here' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('The map');
    await expect(card).toContainText('1 of 4');
    await expect(page.getByTestId('start-here-highlight')).toBeVisible();

    await card.getByRole('button', { name: 'Next' }).click();
    await expect(card).toContainText('Tours');

    // Step 3 starts the first tour so Tour Controls is on screen.
    await card.getByRole('button', { name: 'Next' }).click();
    await expect(card).toContainText('Step through a tour');
    await expect(page.getByText(/Step 1 of/)).toBeVisible();

    await card.getByRole('button', { name: 'Back' }).click();
    await expect(card).toContainText('2 of 4');
    await card.getByRole('button', { name: 'Next' }).click();
    await card.getByRole('button', { name: 'Next' }).click();
    await expect(card).toContainText('Make your own');
    await card.getByRole('button', { name: 'Done' }).click();
    await expect(card).toHaveCount(0);
    // The tour it started is left running, ready to step through.
    await expect(page.getByText(/Step 1 of/)).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Start here' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Start here' })).toHaveCount(0);
  });

  test('Skip closes it, and the header button replays it', async ({ page }) => {
    await page.goto('/');
    const card = page.getByRole('dialog', { name: 'Start here' });
    await card.getByRole('button', { name: 'Skip' }).click();
    await expect(card).toHaveCount(0);

    await page.getByRole('button', { name: 'Start here' }).click();
    await expect(card).toContainText('1 of 4');
  });

  test('Escape closes it without leaving an active tour', async ({ page }) => {
    await page.goto('/');
    const card = page.getByRole('dialog', { name: 'Start here' });
    await card.getByRole('button', { name: 'Next' }).click();
    await card.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText(/Step 1 of/)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(page.getByText(/Step 1 of/)).toBeVisible();
  });

  test('on an empty map it has two steps and skips the tour ones', async ({ page }) => {
    await page.route('**/api/data', route =>
      route.fulfill({ json: { waypoints: [], edges: [], tours: [] } }),
    );
    await page.goto('/');
    const card = page.getByRole('dialog', { name: 'Start here' });
    await expect(card).toContainText('This map is empty');
    await expect(card).toContainText('1 of 2');
    await card.getByRole('button', { name: 'Next' }).click();
    await expect(card).toContainText('Or start from a draft');
    await card.getByRole('button', { name: 'Done' }).click();
    await expect(card).toHaveCount(0);
  });
});
