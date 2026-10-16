import { test, expect } from '@playwright/test';

// Phase 3 — single-card pinning (plan §7 Q6).

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('[data-category-id]').first().waitFor({ state: 'visible' });
});

const cardNames = (page: import('@playwright/test').Page) =>
  page.locator('[data-category-id] h2').allTextContents();

test('pinning moves a card to the front and keeps it anchored while the row scrolls', async ({ page }) => {
  const before = await cardNames(page);
  const target = before[2];

  await page.getByRole('button', { name: `Pin ${target}` }).click();
  await expect.poll(async () => (await cardNames(page))[0]).toBe(target);

  const row = page.getByRole('region', { name: 'Scrollable category cards' });
  const pinned = page.locator('[data-pinned]');
  await expect(pinned).toHaveCount(1);

  await row.evaluate((el) => {
    el.style.scrollBehavior = 'auto';
    el.scrollLeft = 1200;
  });
  // After any layout animation settles, the pinned card sits at the row's left edge.
  await expect
    .poll(async () => {
      const [r, p] = [await row.boundingBox(), await pinned.boundingBox()];
      return Math.round(p!.x - r!.x);
    })
    .toBeLessThan(12);
});

test('only one card can be pinned and unpinning restores the original order', async ({ page }) => {
  const original = await cardNames(page);

  await page.getByRole('button', { name: `Pin ${original[1]}` }).click();
  await page.getByRole('button', { name: `Pin ${original[3]}` }).click();
  await expect(page.locator('[data-pinned]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /^Unpin / })).toHaveCount(1);
  await expect.poll(async () => (await cardNames(page))[0]).toBe(original[3]);

  await page.getByRole('button', { name: `Unpin ${original[3]}` }).click();
  await expect.poll(() => cardNames(page)).toEqual(original);
});

test('the pin survives a reload', async ({ page }) => {
  const original = await cardNames(page);
  await page.getByRole('button', { name: `Pin ${original[4]}` }).click();
  await page.reload();
  await expect.poll(async () => (await cardNames(page))[0]).toBe(original[4]);
});
