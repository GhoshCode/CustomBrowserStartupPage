import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(500);

  // Open settings
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.waitForTimeout(300);

  // Click Appearance
  await page.getByRole('button', { name: /Appearance/ }).click();
  await page.waitForTimeout(300);

  // Click Default Light
  await page.getByRole('button', { name: /Default Light/ }).click();
  await page.waitForTimeout(500);

  // Take screenshot of Appearance tab in light mode
  await page.screenshot({ path: 'appearance-light-tab.png' });

  // Close modal to see the homepage
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'homepage-after-appearance-light.png' });

  await browser.close();
})();
