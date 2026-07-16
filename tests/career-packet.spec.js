const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('loads current edition without browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('.topbar-meta .title')).toContainText('2026–27');
  await expect(page.locator('[data-stat="sections"]')).toHaveText('21');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', 'manifest.webmanifest');
  expect(errors).toEqual([]);
});

test('builds and restores a personalized prep plan', async ({ page }) => {
  await page.locator('#prep-type').selectOption('interview');
  await page.locator('#prep-date').fill('2027-02-15');
  await page.getByRole('button', { name: 'Build My Plan' }).click();
  await expect(page.locator('#prep-output')).toContainText('Interview prep plan');
  const firstTask = page.locator('#prep-output input[type="checkbox"]').first();
  await firstTask.check();
  await page.reload();
  await expect(page.locator('#prep-output')).toHaveClass(/show/);
  await expect(page.locator('#prep-output input[type="checkbox"]').first()).toBeChecked();
});

test('compares multiple offers by value and weighted fit', async ({ page }) => {
  const cards = page.locator('.offer-card');
  await expect(cards).toHaveCount(2);
  const firstInputs = cards.nth(0).locator('.offer-field input');
  await firstInputs.nth(0).fill('Columbus Engineering');
  await firstInputs.nth(1).fill('25');
  await firstInputs.nth(2).fill('40');
  await firstInputs.nth(3).fill('12');
  await firstInputs.nth(4).fill('1000');
  await firstInputs.nth(5).fill('900');
  await expect(page.locator('.offer-ranking')).toContainText('Columbus Engineering');
  await expect(page.locator('.offer-ranking')).toContainText('$10,506');
  await page.locator('#add-offer').click();
  await expect(cards).toHaveCount(3);
  await page.reload();
  await expect(page.locator('.offer-card')).toHaveCount(3);
});

test('supports keyboard search and remembers searches', async ({ page }) => {
  await page.keyboard.press('/');
  await page.locator('#search-input').fill('landing gear');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#resume$/);
  await page.keyboard.press('/');
  await expect(page.locator('#search-results')).toContainText('landing gear');
});

test('exports a complete backup and supports focused print mode', async ({ page }) => {
  await page.locator('#p-name').fill('Taylor');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Data & Backup' }).click();
  await page.getByRole('button', { name: 'Export All Data' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^ASME_Career_Packet_Backup_/);

  await page.evaluate(() => { window.print = () => {}; });
  await page.locator('#data-dialog .dialog-close').click();
  await page.getByRole('button', { name: 'Print / PDF' }).click();
  await page.getByRole('button', { name: /Current section/ }).click();
  await expect(page.locator('body')).toHaveClass(/print-current/);
  await expect(page.locator('main > section.print-target')).toHaveCount(1);
});
