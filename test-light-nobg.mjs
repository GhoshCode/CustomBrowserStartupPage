import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(500);

  // Set store settings: themeMode = 'light', backgroundImage = null
  await page.evaluate(() => {
    const raw = localStorage.getItem('devdeck');
    const data = raw ? JSON.parse(raw) : {};
    data.state = data.state || {};
    data.state.settings = data.state.settings || {};
    data.state.settings.themeMode = 'light';
    data.state.settings.backgroundImage = null;
    localStorage.setItem('devdeck', JSON.stringify(data));
  });

  await page.reload();
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'light-nobg.png', fullPage: true });

  await browser.close();
})();
