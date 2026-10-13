import { chromium } from '@playwright/test';
import path from 'path';

const outDir = 'C:/Users/GhoshCode/.gemini/antigravity-ide/brain/b59f24ba-542d-4d7b-ae75-9188ca6724df';

async function runVisualSimulation() {
  console.log('🚀 Starting Playwright Visual Testing Simulation...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina-crisp 2x captures
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  // 1. Load initial page
  console.log('📍 1. Navigating to startup page...');
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('[data-category-id]').first().waitFor({ state: 'visible' });
  await page.waitForTimeout(600);

  // 2. Check 0 window scrollbars at 1440x900
  const initialScroll = await page.evaluate(() => ({
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    overflowY: window.getComputedStyle(document.body).overflowY,
  }));
  console.log(`✓ Body window scroll check: scrollX=${initialScroll.scrollX}, scrollY=${initialScroll.scrollY}, overflowY=${initialScroll.overflowY}`);

  // 3. Capture Dark Mode Grid View
  console.log('📸 2. Capturing Dark Mode (Grid View)...');
  await page.screenshot({ path: path.join(outDir, 'sim_01_deck_dark_grid.png'), fullPage: false });

  // 4. Switch first category to List View
  console.log('📸 3. Switching first category to List View & Capturing...');
  const firstListBtn = page.locator('button[aria-label="List view"]').first();
  await firstListBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'sim_02_deck_dark_list.png'), fullPage: false });

  // Switch back to Grid View
  const firstGridBtn = page.locator('button[aria-label="Grid view"]').first();
  await firstGridBtn.click();
  await page.waitForTimeout(200);

  // 5. Test Search Bar & Google-style Suggestions
  console.log('📸 4. Testing Search Bar & Query Suggestions...');
  const searchInput = page.locator('input[aria-label="Direct search bar"]');
  await searchInput.fill('react');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'sim_03_search_suggestions.png'), fullPage: false });
  await page.keyboard.press('Escape'); // dismiss suggestions
  await searchInput.fill('');

  // 6. Test Command Palette in Dark Mode
  console.log('📸 5. Testing Command Palette in Dark Mode...');
  const searchOptionBtn = page.locator('button[aria-label="Open command palette"]');
  await searchOptionBtn.click();
  const palette = page.locator('[role="dialog"][aria-label="Command palette"]');
  await palette.waitFor({ state: 'visible' });
  const paletteInput = palette.locator('input');
  await paletteInput.fill('git');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'sim_04_command_palette_dark.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await palette.waitFor({ state: 'hidden' });
  await page.waitForTimeout(200);

  // 7. Open Settings Modal & Switch to Light Mode
  console.log('📸 6. Opening Settings & Switching to Light Mode...');
  const settingsBtn = page.getByRole('button', { name: 'Settings' });
  await settingsBtn.click();
  const settingsModal = page.getByRole('dialog', { name: 'DevDeck Settings' });
  await settingsModal.waitFor({ state: 'visible' });

  // Switch to Appearance Tab
  const appearanceTab = settingsModal.getByRole('button', { name: /Appearance/i });
  await appearanceTab.click();
  await page.waitForTimeout(300);

  // Click Default Light
  const lightBtn = settingsModal.getByRole('button', { name: /Default Light/i });
  await lightBtn.click();
  await page.waitForTimeout(400);

  // Capture Settings Modal - Appearance Tab
  console.log('📸 7. Capturing Settings Modal (Appearance Tab - Light Mode)...');
  await page.screenshot({ path: path.join(outDir, 'sim_05_settings_appearance_light.png'), fullPage: false });

  // Switch to Library Tab
  console.log('📸 8. Capturing Settings Modal (Library Tab - Light Mode)...');
  const libraryTab = settingsModal.getByRole('button', { name: /Library/i });
  await libraryTab.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'sim_06_settings_library_light.png'), fullPage: false });

  // Switch to Quick Links Tab
  console.log('📸 9. Capturing Settings Modal (Quick Links Tab - Light Mode)...');
  const quickLinksTab = settingsModal.getByRole('button', { name: /Quick Links/i });
  await quickLinksTab.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'sim_07_settings_quicklinks_light.png'), fullPage: false });

  // Switch to Data Tab
  console.log('📸 10. Capturing Settings Modal (Data Tab - Light Mode)...');
  const dataTab = settingsModal.getByRole('button', { name: /Data/i });
  await dataTab.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'sim_08_settings_data_light.png'), fullPage: false });

  // Switch to Sitemap Tab
  console.log('📸 11. Capturing Settings Modal (Sitemap Tab - Light Mode)...');
  const sitemapTab = settingsModal.getByRole('button', { name: /Sitemap/i });
  await sitemapTab.click();
  await page.waitForTimeout(600); // Allow ReactFlow layout to settle
  await page.screenshot({ path: path.join(outDir, 'sim_09_settings_sitemap_light.png'), fullPage: false });

  // Close Settings Modal
  console.log('📸 12. Closing Settings & Capturing Main Deck in Light Mode...');
  await page.keyboard.press('Escape');
  await settingsModal.waitFor({ state: 'hidden' });
  await page.waitForTimeout(400);

  // Capture Main Deck Light Mode (Grid View)
  await page.screenshot({ path: path.join(outDir, 'sim_10_deck_light_grid.png'), fullPage: false });

  // Switch first category to List View in Light Mode
  console.log('📸 13. Capturing Main Deck Light Mode (List View)...');
  await firstListBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'sim_11_deck_light_list.png'), fullPage: false });

  // Test Command Palette in Light Mode
  console.log('📸 14. Testing Command Palette in Light Mode...');
  await searchOptionBtn.click();
  await palette.waitFor({ state: 'visible' });
  await paletteInput.fill('python');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'sim_12_command_palette_light.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await palette.waitFor({ state: 'hidden' });
  await page.waitForTimeout(200);

  // 8. Test Viewport Responsive Scales (1920x1080 and 1280x800)
  console.log('📸 15. Testing 1920x1080 Full HD Viewport...');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'sim_13_deck_1080p_light.png'), fullPage: false });

  console.log('📸 16. Testing 1280x800 Compact Viewport...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'sim_14_deck_1280p_compact_light.png'), fullPage: false });

  // 9. Subcategory smooth switching test in Light Mode
  console.log('📍 17. Testing rapid subcategory back-and-forth switching (10 cycles)...');
  const pills = page.locator('[data-category-id]').first().locator('[data-group-id]');
  const count = await pills.count();
  for (let i = 0; i < 10; i++) {
    await pills.nth(i % count).click();
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(200);

  // Final Console check
  console.log('\n========================================');
  console.log(`Simulation complete!`);
  console.log(`Total console errors intercepted: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  } else {
    console.log('✨ Clean bill of health: 0 console errors/exceptions detected throughout entire run!');
  }
  console.log('========================================\n');

  await browser.close();
}

runVisualSimulation().catch(console.error);
