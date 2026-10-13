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

  // Open Settings to switch to light mode
  const settingsBtn = page.getByRole('button', { name: 'Settings' });
  await settingsBtn.click();
  const settingsModal = page.getByRole('dialog', { name: 'DevDeck Settings' });
  await settingsModal.waitFor({ state: 'visible' });

  // Appearance tab
  const appearanceTab = settingsModal.getByRole('button', { name: /Appearance/i });
  await appearanceTab.click();
  await page.waitForTimeout(300);

  // Switch to Default Light
  const lightBtn = settingsModal.getByRole('button', { name: /Default Light/i });
  await lightBtn.click();
  await page.waitForTimeout(400);

  // Capture Settings Modal in Light Mode (Appearance Tab)
  await page.screenshot({ path: path.join(outDir, 'light_theme_settings_appearance.png') });
  console.log('Saved light_theme_settings_appearance.png');

  // Switch to Library tab to see table/cards inside settings in light mode
  const libraryTab = settingsModal.getByRole('button', { name: /Library/i });
  await libraryTab.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'light_theme_settings_library.png') });
  console.log('Saved light_theme_settings_library.png');

  // Close settings to capture main deck in light mode
  await page.keyboard.press('Escape');
  await settingsModal.waitFor({ state: 'hidden' });
  await page.waitForTimeout(500);

  // Capture Main Deck in Light Mode
  await page.screenshot({ path: path.join(outDir, 'light_theme_deck.png') });
  console.log('Saved light_theme_deck.png');

  // Switch first category card to list mode to see list mode in light mode
  const listBtn = page.locator('button[aria-label="List view"]').first();
  await listBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'light_theme_deck_list.png') });
  console.log('Saved light_theme_deck_list.png');

  await browser.close();
}

main().catch(console.error);
