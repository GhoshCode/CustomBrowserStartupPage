const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

(async () => {
  console.log('--- Starting DevDeck QA Automation ---');

  // Launch preview server
  const previewProcess = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '4173'], {
    cwd: __dirname,
    stdio: 'pipe',
  });

  previewProcess.stdout.on('data', (d) => console.log(`[Vite] ${d}`));
  previewProcess.stderr.on('data', (d) => console.error(`[Vite Err] ${d}`));

  // Wait for server to start
  await new Promise((res) => setTimeout(res, 2000));

  const consoleErrors = [];

  try {
    const browser = await chromium.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: true,
    });

    const page = await browser.newPage();
    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.log(`[HTTP ${response.status()}] ${response.url()}`);
      }
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('[Browser Error]', msg.text());
      }
    });

    await page.setViewportSize({ width: 1650, height: 950 });
    console.log('Navigating to http://localhost:4173...');
    await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    // 1. Verify header and clock
    const clock = await page.textContent('[aria-label="Digital clock"]');
    console.log('Clock reading:', clock?.trim());

    // 2. Verify categories
    const categories = await page.$$eval('[data-category-id]', (els) => els.length);
    console.log(`Rendered categories: ${categories} (expected 3)`);

    // 3. Verify primary rows
    const primaryTiles = await page.$$eval('[aria-label="Primary sites rail"] a', (els) => els.length);
    console.log(`Rendered primary tiles across cards: ${primaryTiles}`);

    // 4. Verify Command Palette opening on keyboard shortcut
    console.log('Triggering Command Palette (Ctrl+K)...');
    await page.keyboard.press('Control+KeyK');
    await page.waitForTimeout(400);
    const isPaletteVisible = await page.isVisible('[aria-label="Command palette"]');
    console.log('Command palette visible:', isPaletteVisible);

    // Close palette
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 5. Open Settings Modal
    console.log('Opening Settings Modal...');
    await page.click('button[title="Open Settings"]');
    await page.waitForTimeout(600);
    const isSettingsVisible = await page.isVisible('[aria-label="DevDeck Settings"]');
    console.log('Settings modal visible:', isSettingsVisible);

    // Close Settings
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Capture final screenshot
    await page.screenshot({ path: 'screenshot.png', fullPage: true });
    console.log('Saved screenshot to screenshot.png');

    await browser.close();

    if (consoleErrors.length > 0) {
      console.error(`QA Warning: Encountered ${consoleErrors.length} console errors.`);
      process.exit(1);
    } else {
      console.log('QA Pass: Zero console errors, all core flows verified!');
    }
  } catch (err) {
    console.error('QA Failed with exception:', err);
    process.exit(1);
  } finally {
    previewProcess.kill();
  }
})();
