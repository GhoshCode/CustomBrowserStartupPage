import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });

  await page.waitForTimeout(500);

  // Take screenshot of light mode
  await page.screenshot({ path: 'light-mode-debug.png', fullPage: true });

  // Open settings modal
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.waitForTimeout(500);

  // Take screenshot of settings in light mode
  await page.screenshot({ path: 'settings-light-debug.png', fullPage: true });

  // Check computed styles of key elements
  const info = await page.evaluate(() => {
    const body = window.getComputedStyle(document.body);
    const h1 = document.querySelector('h1');
    const h1Style = h1 ? window.getComputedStyle(h1) : null;
    const settings = document.querySelector('[aria-label="DevDeck Settings"]');
    const settingsStyle = settings ? window.getComputedStyle(settings) : null;
    const firstCard = document.querySelector('[data-category-id]');
    const cardStyle = firstCard ? window.getComputedStyle(firstCard) : null;

    return {
      bodyBg: body.backgroundColor,
      bodyColor: body.color,
      h1Color: h1Style ? h1Style.color : null,
      settingsBg: settingsStyle ? settingsStyle.backgroundColor : null,
      settingsColor: settingsStyle ? settingsStyle.color : null,
      cardBg: cardStyle ? cardStyle.backgroundColor : null,
      cardColor: cardStyle ? cardStyle.color : null,
    };
  });

  console.log('COMPUTED_STYLES:', JSON.stringify(info, null, 2));

  await browser.close();
})();
