import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // 1. Check main container scrollable element
  const container = page.locator('[data-categories-container]');
  const scrollableRegion = container.locator('[role="region"][aria-label="Scrollable category cards"]');
  
  const initScrollLeft = await scrollableRegion.evaluate((el) => el.scrollLeft);
  console.log('Main container initial scrollLeft:', initScrollLeft);

  // Try wheel on main container cards
  const firstCard = page.locator('[data-category-id]').first();
  const cardBox = await firstCard.boundingBox();
  console.log('First card box:', cardBox);

  // Dispatch wheel over first card
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + 30); // over card header
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(300);

  const scrollLeftAfterHeaderWheel = await scrollableRegion.evaluate((el) => el.scrollLeft);
  console.log('Main container scrollLeft after wheel over card header:', scrollLeftAfterHeaderWheel);

  // Dispatch wheel over middle of card (over subcategory area)
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(300);

  const scrollLeftAfterCardMiddleWheel = await scrollableRegion.evaluate((el) => el.scrollLeft);
  console.log('Main container scrollLeft after wheel over card middle:', scrollLeftAfterCardMiddleWheel);

  // Dispatch wheel over thin scroll space
  const thinSpace = page.locator('[data-testid="thin-cards-scroll-space"]');
  const thinBox = await thinSpace.boundingBox();
  await page.mouse.move(thinBox.x + thinBox.width / 2, thinBox.y + thinBox.height / 2);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(300);

  const scrollLeftAfterThinSpace = await scrollableRegion.evaluate((el) => el.scrollLeft);
  console.log('Main container scrollLeft after wheel over thin space:', scrollLeftAfterThinSpace);

  // Check subcategory rail scrolling inside first card
  const rail = firstCard.locator('[aria-label="Subcategory rail"]');
  const railScrollLeft = await rail.evaluate((el) => el.scrollLeft);
  console.log('Rail initial scrollLeft:', railScrollLeft);

  // Wheel inside rail (over site list)
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.wheel(300, 0); // horizontal wheel
  await page.waitForTimeout(300);

  const railScrollAfterWheel = await rail.evaluate((el) => el.scrollLeft);
  console.log('Rail scrollLeft after wheel:', railScrollAfterWheel);

  await browser.close();
})();
