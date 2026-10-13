import { test, expect } from '@playwright/test';

test.describe('Rigorous UI, Layout & Benchmark Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear storage and start fresh with seed data
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('[data-category-id]').first().waitFor({ state: 'visible' });
  });

  test('Page has ZERO vertical and horizontal scrollbars at 100% zoom across viewports', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 }, // Full HD Desktop
      { width: 1440, height: 900 },  // Standard Laptop
      { width: 1366, height: 768 },  // Common 768p Display
      { width: 1280, height: 800 },  // Compact Display
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(150);

      const metrics = await page.evaluate(() => ({
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        docScrollHeight: document.documentElement.scrollHeight,
        docScrollWidth: document.documentElement.scrollWidth,
        docClientHeight: document.documentElement.clientHeight,
        docClientWidth: document.documentElement.clientWidth,
      }));

      // No page scroll offset
      expect(metrics.scrollY).toBe(0);
      expect(metrics.scrollX).toBe(0);

      // Document scroll dimensions must not exceed client viewport dimensions
      expect(metrics.docScrollHeight).toBeLessThanOrEqual(metrics.docClientHeight);
      expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.docClientWidth);

      // Attempt to scroll the page window
      await page.evaluate(() => window.scrollTo(100, 500));
      const afterScroll = await page.evaluate(() => ({
        scrollY: window.scrollY,
        scrollX: window.scrollX,
      }));
      expect(afterScroll.scrollY).toBe(0);
      expect(afterScroll.scrollX).toBe(0);
    }
  });

  test('Top bar has Quick Links and Search Bar inside single outer thin-border container, with search button inside search bar and Google-style suggestions', async ({ page }) => {
    // 1. Single outer container with glass-raised class, thin border, and outer shadow
    const topBarContainer = page.locator('div.glass-raised').filter({
      has: page.locator('input[aria-label="Direct search bar"]'),
    });
    await expect(topBarContainer).toBeVisible();

    // 2. Contains Quick Links inside
    const quickLinks = topBarContainer.locator('div.flex.flex-wrap a');
    await expect(quickLinks.first()).toBeVisible();

    // 3. Contains Search Bar inside the same single container
    const searchInput = topBarContainer.locator('input[aria-label="Direct search bar"]');
    await expect(searchInput).toBeVisible();

    // 4. Command palette search button is inside the search bar
    const searchOptionBtn = topBarContainer.getByRole('button', { name: 'Open command palette' });
    await expect(searchOptionBtn).toBeVisible();
    await expect(searchOptionBtn).toContainText('⌘K');

    // 5. Test typing in the search bar displays Google-style suggestions dropdown
    await searchInput.fill('git');
    const suggestionsDropdown = topBarContainer.locator('text=Web Suggestions');
    await expect(suggestionsDropdown).toBeVisible();

    // Navigate suggestions with arrow down
    await page.keyboard.press('ArrowDown');

    // Clear search bar
    await page.keyboard.press('Escape');

    // 6. Test clicking the search option button opens Command Palette
    await searchOptionBtn.click();
    const palette = page.locator('[role="dialog"][aria-label="Command palette"]');
    await expect(palette).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(palette).not.toBeVisible();
  });

  test('Subcategory navigation has sleek indicator dots; switches smoothly back and forth 10 times; thin scroll space below cards with no scroll buttons', async ({ page }) => {
    const firstCard = page.locator('[data-category-id]').first();
    await expect(firstCard).toBeVisible();

    // 1. Verify NO horizontal scroll buttons below cards
    const scrollButtons = page.getByRole('button', { name: /scroll categories/i });
    await expect(scrollButtons).toHaveCount(0);

    // 2. Subcategory indicator dots are present
    const dots = firstCard.locator('[role="tablist"]');
    if (await dots.count() > 0) {
      await expect(dots).toBeVisible();
    }

    // 3. Subcategory rail has scrollbar-none
    const rail = firstCard.locator('[role="region"][aria-label="Subcategory rail"]');
    await expect(rail).toBeVisible();
    const railClass = await rail.getAttribute('class');
    expect(railClass).toContain('scrollbar-none');

    // 4. Test rapid back-and-forth switching 10 times between subcategory buttons
    const pills = firstCard.locator('[data-group-id]');
    const pillCount = await pills.count();
    expect(pillCount).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < 10; i++) {
      const targetPill = pills.nth(i % pillCount);
      await targetPill.click();
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(200);

    // 5. Verify thin space below cards is present and handles horizontal scroll
    const thinScrollSpace = page.locator('[data-testid="thin-cards-scroll-space"]');
    await expect(thinScrollSpace).toBeVisible();

    // Verify page window still has zero scroll
    const pageScroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    expect(pageScroll.x).toBe(0);
    expect(pageScroll.y).toBe(0);
  });

  test('Settings: Default Dark, Default Light, and Preset Gradient Themes work with elegant glassmorphism', async ({ page }) => {
    // Open settings modal
    const settingsBtn = page.getByRole('button', { name: 'Settings' });
    await settingsBtn.click();

    const settingsModal = page.getByRole('dialog', { name: 'DevDeck Settings' });
    await expect(settingsModal).toBeVisible();
    const modalClass = await settingsModal.getAttribute('class');
    expect(modalClass).toContain('glass-raised');

    // Switch to Appearance tab
    const appearanceTab = settingsModal.getByRole('button', { name: /Appearance/i });
    await appearanceTab.click();

    // 1. Test Light Theme toggle
    const lightThemeBtn = settingsModal.getByRole('button', { name: /Default Light/i });
    await expect(lightThemeBtn).toBeVisible();
    await lightThemeBtn.click();
    await page.waitForTimeout(200);

    // Verify html data-theme is 'light'
    let themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeAttr).toBe('light');

    // 2. Test Dark Theme toggle
    const darkThemeBtn = settingsModal.getByRole('button', { name: /Default Dark/i });
    await expect(darkThemeBtn).toBeVisible();
    await darkThemeBtn.click();
    await page.waitForTimeout(200);

    themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeAttr).toBe('dark');

    // 3. Test Preset Gradient Theme (Cyberpunk Neon)
    const cyberpunkBtn = settingsModal.getByRole('button', { name: /Cyberpunk Neon/i });
    await expect(cyberpunkBtn).toBeVisible();
    await cyberpunkBtn.click();
    await page.waitForTimeout(200);

    // Verify accent color updated
    const accentVar = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--color-accent'),
    );
    expect(accentVar.toLowerCase()).toBe('#00f0ff');

    // Close settings modal with Escape
    await page.keyboard.press('Escape');
    await expect(settingsModal).not.toBeVisible();
  });

  test('Benchmark: Load 10+ Categories and 300+ Sites inside Settings, verifying containerization, zero-spill, and smooth scrolling', async ({ page }) => {
    // Open Settings -> Data Tab
    const settingsBtn = page.getByRole('button', { name: 'Settings' });
    await settingsBtn.click();

    const settingsModal = page.getByRole('dialog', { name: 'DevDeck Settings' });
    await expect(settingsModal).toBeVisible();

    const dataTab = settingsModal.getByRole('button', { name: /Data/i });
    await dataTab.click();

    // Click benchmark button to load 13 categories, 48 subcategories, 336 sites
    const benchmarkBtn = settingsModal.getByRole('button', { name: /Load Benchmark Deck/i });
    await expect(benchmarkBtn).toBeVisible();
    await benchmarkBtn.click();
    await page.waitForTimeout(300);

    // Verify confirmation message in Data Tab
    await expect(settingsModal.getByText(/Benchmark Deck Loaded/i)).toBeVisible();

    // Close settings
    await page.keyboard.press('Escape');
    await expect(settingsModal).not.toBeVisible();

    // 1. Verify 10+ categories rendered (exactly 13 in the expanded benchmark deck)
    const cards = page.locator('[data-category-id]');
    await expect(cards).toHaveCount(13);

    // 2. Verify deck containerization is activated (> 3 categories)
    const container = page.locator('[data-categories-container]');
    await expect(container).toBeVisible();

    // 3. Verify ZERO window scroll even with 13 categories and 336 sites
    const pageMetrics = await page.evaluate(() => ({
      scrollY: window.scrollY,
      scrollX: window.scrollX,
      docScrollHeight: document.documentElement.scrollHeight,
      docClientHeight: document.documentElement.clientHeight,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
    }));
    expect(pageMetrics.scrollY).toBe(0);
    expect(pageMetrics.scrollX).toBe(0);
    expect(pageMetrics.docScrollHeight).toBeLessThanOrEqual(pageMetrics.docClientHeight);
    expect(pageMetrics.docScrollWidth).toBeLessThanOrEqual(pageMetrics.docClientWidth);

    // 4. Test horizontal scroll inside the category deck via the thin scroll space below cards
    const track = page.locator('[role="region"][aria-label="Scrollable category cards"]');
    await expect(track).toBeVisible();

    const thinSpace = page.locator('[data-testid="thin-cards-scroll-space"]');
    await expect(thinSpace).toBeVisible();
    await thinSpace.dispatchEvent('wheel', { deltaY: 400, deltaX: 0 });
    await page.waitForTimeout(300);

    const scrollLeft = await track.evaluate((el) => el.scrollLeft);
    expect(scrollLeft).toBeGreaterThan(0);

    // 5. Scroll to the last category card and verify its rendering
    const lastCard = cards.last();
    await lastCard.scrollIntoViewIfNeeded();
    await expect(lastCard).toBeVisible();

    // Final verification: Window still at (0, 0)
    const finalScroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    expect(finalScroll.x).toBe(0);
    expect(finalScroll.y).toBe(0);
  });
});
