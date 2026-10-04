const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const iconsDir = path.join(__dirname, 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });

  const page = await browser.newPage();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
      <defs>
        <linearGradient id="acc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff2e9a" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#19102c" />
          <stop offset="100%" stop-color="#0b0713" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="url(#bg)" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
      
      <!-- Back card -->
      <rect x="28" y="24" width="72" height="48" rx="10" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="3" />
      
      <!-- Front card glowing -->
      <rect x="22" y="38" width="84" height="66" rx="14" fill="#130b22" stroke="url(#acc)" stroke-width="3" />
      
      <!-- Terminal prompt >_ -->
      <path d="M38 58 L52 70 L38 82" fill="none" stroke="url(#acc)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
      <line x1="60" y1="82" x2="78" y2="82" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" />
    </svg>
  `;

  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;">${svg}</body></html>`);

  const sizes = [16, 48, 128];
  for (const sz of sizes) {
    const el = await page.$('svg');
    if (el) {
      await el.evaluate((node, size) => {
        node.setAttribute('width', size);
        node.setAttribute('height', size);
      }, sz);
      await page.setViewportSize({ width: sz, height: sz });
      await page.screenshot({
        path: path.join(iconsDir, `icon-${sz}.png`),
        omitBackground: true,
      });
      console.log(`Generated icon-${sz}.png`);
    }
  }

  await browser.close();
  console.log('All icons generated successfully!');
})();
