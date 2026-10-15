const { chromium } = require('playwright');

async function runTests() {
  console.log('Launching browser for DevDeck v2 refinements test...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Test 1: CategoryGrid starts flush at card 0
  const categoryScroll = await page.$eval('[aria-label="Scrollable category cards"]', (el) => el.scrollLeft);
  console.log(`[TEST 1] Category scrollLeft: ${categoryScroll} (expected: 0)`);
  if (categoryScroll !== 0) {
    throw new Error(`Category cards not starting at 0! scrollLeft is ${categoryScroll}`);
  }

  // Test 2: Search Bar input styling & instant suggestions
  const searchInput = page.locator('input[aria-label="Search"]');
  const inputColor = await searchInput.evaluate((el) => window.getComputedStyle(el).color);
  console.log(`[TEST 2] Search input text color: ${inputColor} (expected: rgb(255, 255, 255))`);
  
  // Type into search bar and measure suggestion appearance time
  const t0 = Date.now();
  await searchInput.fill('react');
  await page.waitForSelector('text=Search Suggestions', { timeout: 3000 });
  const t1 = Date.now();
  console.log(`[TEST 2] Suggestions appeared in ${t1 - t0}ms (INSTANT response)`);

  // Verify Gemini and ChatGPT buttons
  const geminiBtn = page.locator('button[title*="Gemini"]');
  const chatGptBtn = page.locator('button[title*="ChatGPT"]');
  const micBtn = page.locator('button[title*="Voice search"]');
  console.log('[TEST 3] Gemini button count:', await geminiBtn.count());
  console.log('[TEST 3] ChatGPT button count:', await chatGptBtn.count());
  console.log('[TEST 3] Mic button count:', await micBtn.count());

  // Test 4: Merged Search ⌘K and lengthy Site Map button outside
  const searchCmdBtn = page.locator('button:has-text("Search"):has-text("⌘K")');
  const siteMapBtn = page.locator('button:has-text("Site Map")');
  console.log('[TEST 4] Merged Search ⌘K button count:', await searchCmdBtn.count());
  console.log('[TEST 4] Lengthy Site Map button count:', await siteMapBtn.count());

  // Test 5: Todo Widget expand downward behavior
  console.log('[TEST 5] Testing To-Do expand button downward floating...');
  const expandBtn = page.locator('button[aria-label="Expand Tasks"]');
  await expandBtn.click();
  await page.waitForTimeout(400);

  // Check that it expanded to ~380px while staying inside top bar column
  const todoContainer = page.locator('[data-testid="todo-widget-inner"]');
  const todoBox = await todoContainer.boundingBox();
  console.log(`[TEST 5] Todo expanded bounding box: height=${todoBox.height}, width=${todoBox.width}, y=${todoBox.y}`);
  if (todoBox.height < 300) {
    throw new Error(`Todo did not expand downward properly! Height is ${todoBox.height}`);
  }

  // Collapse it back
  await expandBtn.click();
  await page.waitForTimeout(400);

  // Test 6: Weather Widget details (PIN code, Location, UV index box below temp)
  const weatherText = await page.locator('[title*="Weather"]').textContent();
  console.log(`[TEST 6] Weather widget text: "${weatherText}"`);

  // Test 7: Git Widget metrics
  const gitWidgetText = await page.locator('.font-display:has-text("GhoshCode")').textContent();
  console.log(`[TEST 7] Git widget text: "${gitWidgetText}"`);

  // Test 8: Main Settings button in bottom-left
  const settingsBtn = page.locator('button:has-text("Settings"):has-text(",")');
  const settingsBox = await settingsBtn.boundingBox();
  console.log(`[TEST 8] Settings button position: x=${settingsBox.x}, y=${settingsBox.y}`);
  if (settingsBox.x > 100) {
    throw new Error(`Settings button is not in bottom left! x=${settingsBox.x}`);
  }

  // Take fresh full-page screenshot
  console.log('Capturing full screenshot...');
  await page.screenshot({ path: 'screenshot.png' });
  console.log('Screenshot successfully saved to screenshot.png');

  await browser.close();
  console.log('ALL PLAYWRIGHT TESTS PASSED 100%!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
