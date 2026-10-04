const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: true
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1650, height: 950 });
    console.log("Navigating to localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log("Taking screenshot...");
    await page.screenshot({ path: 'screenshot.png', fullPage: true });
    await browser.close();
    console.log("Screenshot saved to screenshot.png");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
