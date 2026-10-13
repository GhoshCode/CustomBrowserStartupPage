import { chromium } from '@playwright/test';
import path from 'path';

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/');
  await page.locator('[data-category-id]').first().waitFor({ state: 'visible' });
  await page.waitForTimeout(600);

  const outDir = 'C:/Users/GhoshCode/.gemini/antigravity-ide/brain/b59f24ba-542d-4d7b-ae75-9188ca6724df';

  // 1. Grid mode default
  await page.screenshot({ path: path.join(outDir, 'typography_grid_dark.png') });
  console.log('Saved typography_grid_dark.png');

  // 2. Switch first card to List mode
  const listBtn = page.locator('button[aria-label="List view"]').first();
  await listBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'typography_list_dark.png') });
  console.log('Saved typography_list_dark.png');

  // 3. Switch back to grid and test light mode
  const gridBtn = page.locator('button[aria-label="Grid view"]').first();
  await gridBtn.click();
  await page.waitForTimeout(200);

  // Switch to light mode via settings
  const settingsBtn = page.getByRole('button', { name: 'Settings' });
  await settingsBtn.click();
  const settingsModal = page.getByRole('dialog', { name: 'DevDeck Settings' });
  await settingsModal.waitFor({ state: 'visible' });

  const appearanceTab = settingsModal.getByRole('button', { name: /Appearance/i });
  await appearanceTab.click();
  const lightBtn = settingsModal.getByRole('button', { name: /Default Light/i });
  await lightBtn.click();
  await page.waitForTimeout(300);

  await page.keyboard.press('Escape');
  await settingsModal.waitFor({ state: 'hidden' });
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(outDir, 'typography_grid_light.png') });
  console.log('Saved typography_grid_light.png');

  await browser.close();
}

main().catch(console.error);
