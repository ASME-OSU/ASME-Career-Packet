const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('asme-career-mobile-view', 'all');
  });
  await page.reload();
});

test('loads current edition without browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('.topbar-meta .title')).toContainText('2026–27');
  await expect(page.locator('[data-stat="sections"]')).toHaveText('21');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', 'manifest.webmanifest');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'assets/asme-career-logo.png');
  await expect(page.locator('.logo-wrap img')).toHaveJSProperty('naturalWidth', 1254);
  const manifest = await page.evaluate(() => fetch('manifest.webmanifest').then(response => response.json()));
  expect(manifest.icons[0].src).toBe('./assets/asme-career-logo.png');
  expect(errors).toEqual([]);
});

test('switches theme and remembers the reader choice', async ({ page }) => {
  const toggle = page.locator('.theme-toggle');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('follows device appearance changes until the reader chooses a theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.theme-toggle')).toHaveAttribute('aria-label', 'Switch to light mode');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f7f6f2');
  await page.locator('.theme-toggle').click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('dark mode keeps key callouts, resource links, and badges readable', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('asme-career-theme', 'dark'));
  await page.reload();
  await page.locator('#prep-date').fill('2027-02-15');
  await page.getByRole('button', { name: 'Build My Plan' }).click();
  const ratios = await page.evaluate(() => {
    const luminance = color => {
      const channels = color.match(/\d+/g).slice(0, 3).map(value => {
        const normalized = Number(value) / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    return ['.tip strong', '.osu-resource-links a', '.ctag', '.prep-output', '.prep-output h4', '.prep-links a'].map(selector => {
      const element = document.querySelector(selector);
      const foreground = luminance(getComputedStyle(element).color);
      const background = luminance(getComputedStyle(['.tip strong', '.prep-output h4'].includes(selector) ? element.parentElement : element).backgroundColor);
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
  });
  ratios.forEach(ratio => expect(ratio).toBeGreaterThanOrEqual(4.5));
});

test('mobile readers can page through chapters or show the full guide', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => localStorage.removeItem('asme-career-mobile-view'));
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/mobile-chapter-mode/);
  await expect(page.locator('#start')).toBeVisible();
  await expect(page.locator('#paths')).toBeHidden();
  await page.getByRole('link', { name: 'Next chapter' }).click();
  await expect(page).toHaveURL(/#paths$/);
  await expect(page.locator('#paths')).toBeVisible();
  await expect(page.locator('#start')).toBeHidden();
  await page.goto('/#ai-interviewer');
  await expect(page.locator('#interviews')).toBeVisible();
  await expect(page.locator('#ai-interviewer')).toBeVisible();
  await page.getByRole('button', { name: 'Explore guide' }).click();
  await page.getByRole('button', { name: 'Full guide' }).click();
  await expect(page.locator('html')).not.toHaveClass(/mobile-chapter-mode/);
  await expect(page.locator('#start')).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass(/mobile-chapter-mode/);
});

test('mobile chapter menu opens, navigates, and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole('button', { name: 'Explore guide' });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('body')).toHaveClass(/mobile-menu-open/);
  await expect(page.locator('.mobile-menu-heading')).toBeVisible();
  await page.locator('.nav-group').filter({ has: page.getByText('Prepare', { exact: true }) }).locator('summary').click();
  await page.getByRole('link', { name: 'AI Interview Practice' }).click();
  await expect(page).toHaveURL(/#ai-interviewer$/);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('body')).not.toHaveClass(/mobile-menu-open/);
  await menu.click();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('mobile hero keeps all guide features available by swiping', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.hero-stats .hs')).toHaveCount(5);
  await expect(page.locator('.hero-stats .hs').last()).toBeVisible();
  const scrollable = await page.locator('.hero-stats').evaluate(element => element.scrollWidth > element.clientWidth);
  expect(scrollable).toBe(true);
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

test('adjusts prep tasks for a near-term deadline', async ({ page }) => {
  await page.locator('#prep-type').selectOption('careerfair');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.locator('#prep-date').fill(tomorrow.toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'Build My Plan' }).click();
  await expect(page.locator('#prep-output')).toContainText('Your next 48 hours');
  await expect(page.locator('#prep-output')).toContainText('Lay out your outfit');
});

test('reads and edits a saved STAR story', async ({ page }) => {
  await page.locator('#s-title').fill('Fixture redesign');
  await page.locator('#s-act').fill('Modeled and tested two mounting concepts.');
  await page.locator('#s-res').fill('Reduced setup time by 40%.');
  await page.getByRole('button', { name: '+ Add Story' }).click();
  await page.getByText('Read story').click();
  await expect(page.locator('.story-details')).toContainText('Reduced setup time by 40%.');
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.locator('#s-res').fill('Reduced setup time by 45%.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Read story').click();
  await expect(page.locator('.story-details')).toContainText('Reduced setup time by 45%.');
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
  const mobile = page.viewportSize().width <= 700;
  if (mobile) await page.getByRole('button', { name: 'Explore guide' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Data & Backup' }).click();
  await page.getByRole('button', { name: 'Export All Data' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^ASME_Career_Packet_Backup_/);

  await page.evaluate(() => { window.print = () => {}; });
  await page.locator('#data-dialog .dialog-close').click();
  if (mobile) await page.getByRole('button', { name: 'Explore guide' }).click();
  await page.getByRole('button', { name: 'Print / PDF' }).click();
  await page.getByRole('button', { name: /Current section/ }).click();
  await expect(page.locator('body')).toHaveClass(/print-current/);
  await expect(page.locator('main > section.print-target')).toHaveCount(1);
});

test('navigates the field guide with direct routes and keyboard menus', async ({ page }) => {
  if (page.viewportSize().width <= 700) await page.getByRole('button', { name: 'Explore starting paths' }).click();
  await page.getByRole('link', { name: /I’m getting application-ready/ }).click();
  await expect(page).toHaveURL(/#resume$/);
  await page.locator('#resume .chapter-next a').click();
  await expect(page).toHaveURL(/#linkedin$/);
  const mobile = page.viewportSize().width <= 700;
  if (mobile) await page.getByRole('button', { name: 'Explore guide' }).click();
  const menu = page.locator('.nav-group').first();
  await menu.locator('summary').click();
  await expect(menu).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open', '');
  if (mobile) await expect(page.getByRole('button', { name: 'Explore guide' })).toBeFocused();
  else await expect(menu.locator('summary')).toBeFocused();
});

test('keeps chapter navigation and tables within a narrow viewport', async ({ page }) => {
  for (const width of [360, 700, 1024]) {
    await page.setViewportSize({ width, height: 850 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test('configures an AI interviewer and copies the selected session', async ({ page }) => {
  await page.locator('#ai-mode').selectOption('technical');
  await page.locator('#ai-style').selectOption('realistic');
  await page.locator('#ai-count').selectOption('8');
  await page.locator('#ai-resume').fill('Built a sensor fixture in SolidWorks.');
  await page.locator('#ai-jd').fill('Test engineering intern');
  await page.locator('#ai-company').fill('Example Aerospace');
  const prompt = await page.locator('#ai-out').textContent();
  expect(prompt).toContain('Ask 8 main questions, ONE question at a time');
  expect(prompt).toContain('REALISTIC MODE');
  expect(prompt).toContain('Built a sensor fixture in SolidWorks.');
  expect(prompt).toContain('Test engineering intern');
  expect(prompt).toContain('COMPANY CONTEXT\nExample Aerospace');
  expect(prompt).toContain('Never invent company facts');
  expect(prompt).toContain('Supply enough data for any numerical exercise.');
  await page.evaluate(() => { window.copyText = async text => { window.copiedPrompt = text; return true; }; });
  await page.locator('#ai-copy-btn').click();
  expect(await page.evaluate(() => window.copiedPrompt)).toBe(prompt);
  await expect(page.locator('#ai-ready')).toContainText('Copied.');
});

test('offers a usable default AI session and a manual copy fallback', async ({ page }) => {
  await expect(page.locator('#ai-out')).toContainText('COACHING MODE');
  await expect(page.locator('#ai-out')).toContainText('No company supplied. Keep the session role-focused');
  await page.locator('#ai-company').fill('Example Motors');
  await expect(page.locator('#ai-out')).toContainText('COMPANY CONTEXT\nExample Motors');
  await page.locator('#ai-company').fill('');
  await expect(page.locator('#ai-out')).not.toContainText('Example Motors');
  await expect(page.locator('#ai-out')).toContainText('ask which role I am targeting');
  await page.evaluate(() => { window.copyText = async () => false; });
  await page.locator('#ai-copy-btn').click();
  await expect(page.locator('.ai-preview')).toHaveAttribute('open', '');
  await expect(page.locator('#ai-ready')).toContainText('Select and copy');
});

test('shows realistic resume examples in the requested section order', async ({ page }) => {
  await expect(page.locator('#resume-examples')).toContainText('fictional teaching examples');
  for (const year of ['freshman', 'sophomore', 'junior', 'senior']) {
    const example = page.locator(`#resume-${year}`);
    if (!(await example.getAttribute('open') !== null)) await example.locator('summary').click();
    await expect(example.locator('.sample-resume')).toBeVisible();
    expect(await example.locator('.sample-resume h4').allTextContents()).toEqual([
      'EDUCATION', 'SKILLS AND QUALIFICATIONS', 'EXPERIENCE', 'PROJECTS', 'ORGANIZATIONS AND LEADERSHIP'
    ]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
