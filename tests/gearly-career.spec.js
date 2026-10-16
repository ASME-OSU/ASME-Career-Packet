const { test, expect } = require('@playwright/test');

const ROOT = '.cg-root';
const PANEL = '.cg-panel';
const INPUT = 'Ask Gearly about the career packet';
const LAUNCH = 'Open Gearly career guide';

async function ask(page, question) {
  const previousReplies = await page.locator('.cg-message.cg-bot').count();
  const box = page.getByRole('textbox', { name: INPUT });
  await box.fill(question);
  await page.getByRole('button', { name: 'Send question', exact: true }).click();
  const last = page.locator('.cg-message.cg-bot').last();
  await expect(page.locator('.cg-message.cg-bot')).toHaveCount(previousReplies + 1);
  await expect(last).toBeVisible();
  return last;
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: LAUNCH })).toBeVisible();
});

test('packet-grounded questions return real, relevant local sources', async ({ page }) => {
  const cases = [
    ['How do I improve my resume bullets?', 'resume', /action|result|verb|quantif|metric|bullet/i],
    ['Show me a freshman resume example without an internship', 'resume', /part.time|introductory|high school|internship|freshman/i],
    ['What is the STAR method?', 'interviews', /situation|task|action|result/i],
    ['What should I wear to an interview?', 'dress', /suit|professional|business|dress/i],
    ['How should I improve my LinkedIn headline?', 'linkedin', /headline|linkedin|skills|project/i],
    ['Can I share confidential internship CAD in my portfolio?', 'portfolio', /permission|internal CAD|confidential|employer|lab/i],
    ['How do I prepare for a career fair?', 'careerfair', /employer|research|resume|pitch|prepare/i],
    ['What should I compare in a full-time offer?', 'offer', /pay|benefit|written|location|compensation|salary/i],
    ['How do I prepare for graduate school research?', 'gradschool', /research|program|advisor|faculty|recommender/i],
    ['Show me a post interview thank you email template', 'templates', /thank|interview|subject/i]
  ];
  const answers = await page.evaluate(questions => {
    const engine = window.GearlyCareerEngine.create(document);
    return questions.map(([query]) => ({ query, ...engine.answer(query) }));
  }, cases);
  for (let index = 0; index < cases.length; index++) {
    const [query, section, evidence] = cases[index];
    const answer = answers[index];
    expect(answer.kind, query).toBe('answer');
    expect(answer.context.section, query).toBe(section);
    expect(answer.text, query).toMatch(evidence);
    expect(answer.sources.length, query).toBeGreaterThan(0);
    for (const source of answer.sources) {
      const target = page.locator(`[id=${JSON.stringify(source.id)}]`);
      await expect(target, `${query}: #${source.id}`).toHaveCount(1);
      expect(source.excerpt.length, query).toBeGreaterThan(20);
      const actual = (await target.textContent()).replace(/\s+/g, ' ').trim();
      expect(actual, `${query}: quoted evidence must occur in cited packet section`).toContain(source.excerpt);
    }
  }
});

test('follow-up examples retain the verified topic and unrelated questions decline', async ({ page }) => {
  const results = await page.evaluate(() => {
    const engine = window.GearlyCareerEngine.create(document);
    const first = engine.answer('How do I prepare for graduate school?');
    return {
      first,
      followup: engine.answer('Tell me more.', first.context),
      unrelated: engine.answer('What is the weather in Columbus?'),
      job: engine.answer('Which live jobs are open at Honda today?'),
      salary: engine.answer('What is the exact current salary for an intern at Honda today?')
    };
  });
  expect(results.first.context.section).toBe('gradschool');
  expect(results.followup.context.section).toBe('gradschool');
  for (const result of [results.unrelated, results.job]) {
    expect(result.kind).toBe('fallback');
    expect(result.sources).toEqual([]);
  }
  // Generic compensation guidance is acceptable; a fabricated current pay figure is not.
  expect(results.salary.text).not.toMatch(/\$\s*\d/);
  if (results.salary.kind === 'answer') expect(results.salary.context.section).toBe('offer');
});

test('saved forms and generated private tool output never enter the packet index', async ({ page }) => {
  const sentinel = 'PRIVATE_UNIQUE_SALARY_STORY_876543';
  const output = await page.evaluate(secret => {
    for (const input of document.querySelectorAll('#ai-resume, #ai-jd, #ai-company, .offer-field input, #story-form textarea, .pfields input')) input.value = secret;
    for (const id of ['story-list', 'offer-ranking', 'ai-out', 'pitch-out', 'prep-output', 'print-story-list']) {
      const node = document.getElementById(id);
      if (node) node.textContent = `Resume portfolio offer research story ${secret}`;
    }
    const engine = window.GearlyCareerEngine.create(document);
    return {
      answers: ['How do I write a resume?', 'How do I compare offers?', secret, 'Read my saved stories'].map(query => engine.answer(query)),
      count: engine.sourceCount
    };
  }, sentinel);
  expect(output.count).toBeGreaterThan(100);
  expect(JSON.stringify(output)).not.toContain(sentinel);
  expect(output.answers[3].kind).toBe('fallback');
  expect(output.answers[3].sources).toEqual([]);
});

test('compact chat keeps launcher hidden, input visible and avatars beside completed replies', async ({ page }) => {
  const launcher = page.getByRole('button', { name: LAUNCH });
  await launcher.click();
  await expect(page.getByRole('dialog', { name: 'Gearly career packet guide' })).toBeVisible();
  await expect(launcher).toBeHidden();
  const reply = await ask(page, 'What is the STAR method?');
  await expect(reply).toContainText(/situation|task|action|result/i);
  await expect(reply.locator('.cg-message-avatar')).toBeVisible();
  await expect(page.getByRole('textbox', { name: INPUT })).toBeVisible();
  const bounds = await page.locator(PANEL).boundingBox();
  const viewport = page.viewportSize();
  expect(bounds.width).toBeLessThanOrEqual(402);
  expect(bounds.height).toBeLessThanOrEqual(620);
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
  await page.getByRole('button', { name: 'Close Gearly', exact: true }).click();
  await expect(launcher).toBeVisible();
  await expect(launcher).toBeFocused();
});

test('source links reveal the correct chapter and hidden example on mobile too', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => localStorage.removeItem('asme-career-mobile-view'));
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/mobile-chapter-mode/);
  await page.getByRole('button', { name: LAUNCH }).click();
  const reply = await ask(page, 'Show me a sophomore resume example');
  const source = reply.locator('.cg-source[href="#resume-sophomore"]').first();
  await expect(source).toBeVisible();
  await source.click();
  await expect(page).toHaveURL(/#resume-sophomore$/);
  await expect(page.locator('#resume')).toBeVisible();
  await expect(page.locator('#resume-sophomore')).toHaveAttribute('open', '');
  await expect(page.locator('#resume-sophomore .sample-layout')).toBeVisible();
});

test('reset removes conversation, survives malicious text, and keeps output literal', async ({ page }) => {
  await page.getByRole('button', { name: LAUNCH }).click();
  const payload = '<img src=x onerror="window.gearlyInjected=true"> help with resume';
  await ask(page, payload);
  await expect(page.locator('.cg-message').filter({ hasText: payload })).toHaveCount(1);
  expect(await page.evaluate(() => window.gearlyInjected)).toBeUndefined();
  await expect(page.locator(`${ROOT} img[onerror]`)).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset conversation', exact: true }).click();
  await expect(page.locator('.cg-message').filter({ hasText: payload })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: INPUT })).toHaveValue('');
  await expect(page.locator('.cg-message.cg-bot')).toHaveCount(1);
});

test('dark mode, reduced motion and print preserve the guide experience', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: LAUNCH }).click();
  await ask(page, 'What should I wear to an interview?');
  const visual = await page.locator(PANEL).evaluate(panel => {
    const style = getComputedStyle(panel);
    const animations = [...document.querySelectorAll('.cg-root img')].map(image => getComputedStyle(image).animationName);
    return { foreground: style.color, background: style.backgroundColor, animations };
  });
  expect(visual.foreground).not.toBe(visual.background);
  // White text needs a deep scarlet surface even when the packet's dark-theme accent is pink.
  for (const selector of ['.cg-user', '.cg-send']) {
    const colors = await page.locator(selector).last().evaluate(node => {
      const style = getComputedStyle(node);
      const luminance = color => {
        const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
      };
      const fg = luminance(style.color), bg = luminance(style.backgroundColor);
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    });
    expect(colors).toBeGreaterThanOrEqual(4.5);
  }
  expect(visual.animations.every(name => name === 'none')).toBe(true);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator(ROOT)).toBeHidden();
  await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
  await expect(page.locator(PANEL)).toBeVisible();
});

test('questions work offline without sending conversation to external services', async ({ page, context }) => {
  const outbound = [];
  page.on('request', request => {
    const target = new URL(request.url());
    if (target.protocol.startsWith('http') && target.origin !== new URL(page.url()).origin) outbound.push({ url: request.url(), body: request.postData() || '' });
  });
  await page.getByRole('button', { name: LAUNCH }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: LAUNCH }).click();
  const reply = await ask(page, 'How do I prepare for a career fair?');
  await expect(reply).toContainText(/employer|research|resume|pitch/i);
  // The existing packet reloads its Google fonts/analytics. Chat must add no remote service
  // and must never place the question in those existing requests.
  const existingHosts = ['fonts.googleapis.com', 'fonts.gstatic.com', 'www.googletagmanager.com', 'www.google-analytics.com', 'www.google.com'];
  expect(outbound.filter(request => !existingHosts.includes(new URL(request.url).hostname))).toEqual([]);
  for (const request of outbound) expect(decodeURIComponent(request.url + request.body)).not.toContain('How do I prepare for a career fair?');
  await context.setOffline(false);
});


test('conversation survives reload, clears permanently, and Escape returns focus', async ({ page }) => {
  await page.getByRole('button', { name: LAUNCH }).click();
  await ask(page, 'How do I prepare for graduate school?');
  await page.reload();
  await page.getByRole('button', { name: LAUNCH }).click();
  await expect(page.locator('.cg-message.cg-user')).toContainText('How do I prepare for graduate school?');
  await expect(page.locator('.cg-message.cg-bot').last().locator('.cg-message-avatar')).toBeVisible();
  await page.getByRole('button', { name: 'Reset conversation', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: LAUNCH }).click();
  await expect(page.locator('.cg-message.cg-user')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator(PANEL)).toBeHidden();
  await expect(page.getByRole('button', { name: LAUNCH })).toBeFocused();
});

test('thinking state finishes cleanly and reset cancels a pending answer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: LAUNCH }).click();
  await page.getByRole('textbox', { name: INPUT }).fill('What is the STAR method?');
  await page.getByRole('button', { name: 'Send question', exact: true }).click();
  await expect(page.locator('.cg-activity')).toBeVisible();
  await expect(page.locator('.cg-activity img')).toBeVisible();
  await expect(page.locator('.cg-activity')).toHaveCount(0);
  await expect(page.locator('.cg-message.cg-bot').last().locator('.cg-message-avatar')).toBeVisible();
  await page.getByRole('textbox', { name: INPUT }).fill('Help with my resume');
  await page.getByRole('button', { name: 'Send question', exact: true }).click();
  await page.getByRole('button', { name: 'Reset conversation', exact: true }).click();
  await page.waitForTimeout(450);
  await expect(page.locator('.cg-message.cg-user')).toHaveCount(0);
  await expect(page.locator('.cg-message.cg-bot')).toHaveCount(1);
  await expect(page.locator('.cg-activity')).toHaveCount(0);
});
