const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: true,
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    console.log('Capturing pristine clean screenshot...');
    await page.screenshot({ path: 'screenshot.png' });
    await browser.close();
    console.log('Clean screenshot saved to screenshot.png');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
