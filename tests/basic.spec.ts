import { test, expect } from '@playwright/test';

test('create a waypoint', async ({ page }) => {
  const label = `Playwright Test Waypoint ${Date.now()}`;
  await page.goto('/');
  await page.getByText('+ Add Waypoint').click();
  const form = page.locator('.fixed.inset-0.z-50');
  await form.getByPlaceholder('Short descriptive title').fill(label);
  await form.locator('select').selectOption('Feature');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(label)).toBeVisible();
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

test('tour navigation increments step counter', async ({ page }) => {
  await page.goto('/');
  await page.locator('select').filter({ hasText: 'No tour selected' }).selectOption({ index: 1 });
  await expect(page.getByText(/Step 1 of/)).toBeVisible();
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.getByText(/Step 2 of/)).toBeVisible();
});
