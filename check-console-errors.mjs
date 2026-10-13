import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.toString());
  });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(500);

  // Switch to light theme
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Appearance/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Default Light/ }).click();
  await page.waitForTimeout(500);

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Click tabs and interactions
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(300);

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors));
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors));

  await browser.close();
})();
