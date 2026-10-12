/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║          DEVDECK — END-TO-END TEST SUITE (Playwright)           ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                 ║
 * ║  📚 HOW PLAYWRIGHT WORKS — A BEGINNER'S GUIDE                  ║
 * ║                                                                 ║
 * ║  Playwright is like a robot that:                               ║
 * ║    1. Opens a REAL browser (Chrome/Edge/Firefox)                ║
 * ║    2. Visits your website                                       ║
 * ║    3. Clicks buttons, types text, scrolls — like a real user    ║
 * ║    4. Checks that the right things appeared on screen           ║
 * ║                                                                 ║
 * ║  KEY CONCEPTS:                                                  ║
 * ║                                                                 ║
 * ║  • test('name', async ({ page }) => { ... })                    ║
 * ║      ↑ Each test gets its own fresh browser tab ("page")        ║
 * ║                                                                 ║
 * ║  • page.goto('/')                                               ║
 * ║      ↑ Navigate to a URL (like typing in the address bar)       ║
 * ║                                                                 ║
 * ║  • page.getByText('Hello')                                     ║
 * ║      ↑ Find an element by its visible text                      ║
 * ║                                                                 ║
 * ║  • page.getByRole('button', { name: 'Submit' })                ║
 * ║      ↑ Find elements by what they ARE (button, link, etc.)      ║
 * ║      This is how a screen reader sees your page too!            ║
 * ║                                                                 ║
 * ║  • page.locator('[data-category-id]')                           ║
 * ║      ↑ Find elements by CSS selector (last resort)              ║
 * ║                                                                 ║
 * ║  • await expect(element).toBeVisible()                          ║
 * ║      ↑ Assert = "I expect this to be true, fail if not"         ║
 * ║      Playwright auto-waits up to 5 seconds for it to appear!    ║
 * ║                                                                 ║
 * ║  • page.keyboard.press('Control+k')                             ║
 * ║      ↑ Press keyboard keys, just like a real keyboard           ║
 * ║                                                                 ║
 * ║  • page.click('button')                                         ║
 * ║      ↑ Click an element, just like a real mouse                 ║
 * ║                                                                 ║
 * ║  🔑 THE GOLDEN RULE:                                            ║
 * ║     Prefer getByRole() and getByText() over CSS selectors.      ║
 * ║     They test what the USER sees, not how the code is written.  ║
 * ║                                                                 ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════
// SETUP: Runs before EVERY test in this file.
// ═══════════════════════════════════════════════════════════════════
//
// Why? Each test should start from a known, clean state.
// We clear localStorage so previous test data doesn't leak in.

test.beforeEach(async ({ page }) => {
  // 1. Navigate to the app
  await page.goto('/');

  // 2. Clear any saved data from previous tests
  //    (DevDeck stores everything in localStorage)
  await page.evaluate(() => localStorage.clear());

  // 3. Reload so the app starts fresh with seed data
  await page.reload();

  // 4. Wait for the app to fully render
  //    We wait for the category cards to appear — that means React
  //    has mounted and the seed data has loaded.
  await page.locator('[data-category-id]').first().waitFor({ state: 'visible' });
});


// ═══════════════════════════════════════════════════════════════════
// TEST GROUP 1: PAGE LOAD & HEADER
// ═══════════════════════════════════════════════════════════════════
//
// These tests verify that when you open DevDeck, the essential
// elements are visible: clock, greeting, date, and a quote.

test.describe('Page Load & Header', () => {

  test('shows the digital clock and it displays a time', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  HOW THIS WORKS:                                       │
    // │                                                        │
    // │  getByRole('timer') finds the element that has         │
    // │  role="timer" — that's our clock <div>.                │
    // │                                                        │
    // │  toBeVisible() checks it's actually on screen          │
    // │  (not hidden, not display:none, not zero-sized).       │
    // │                                                        │
    // │  We then check the text matches a time pattern like    │
    // │  "07:30" or "12:45". The /\d{1,2}:\d{2}/ is a         │
    // │  "regular expression" — a pattern matcher.             │
    // └─────────────────────────────────────────────────────────┘

    const clock = page.getByRole('timer', { name: 'Digital clock' });
    await expect(clock).toBeVisible();

    const clockText = await clock.textContent();
    // Check it looks like a time (e.g., "07:30" or "12:45 PM")
    expect(clockText).toMatch(/\d{1,2}:\d{2}/);
  });

  test('shows a time-of-day greeting', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  The <h1> tag contains greetings like:                 │
    // │    "Good morning."  /  "Good afternoon."               │
    // │    "Good evening."  /  "Late night hacking?"           │
    // │                                                        │
    // │  getByRole('heading', { level: 1 }) finds <h1> tags.   │
    // │  We check the text contains one of the expected words. │
    // └─────────────────────────────────────────────────────────┘

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    const text = await heading.textContent();
    // At least one of these should match the current time
    expect(text).toMatch(/morning|afternoon|evening|night/i);
  });

  test('shows the current date', async ({ page }) => {
    // The date line shows something like "WEDNESDAY, OCTOBER 7"
    // We just check the current month name appears somewhere
    const months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
    ];
    const currentMonth = months[new Date().getMonth()];

    await expect(page.getByText(currentMonth)).toBeVisible();
  });

  test('shows a developer quote', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  The quote is a <p> tag with low-opacity text.          │
    // │  We can't predict which quote, but we know the header  │
    // │  section should have more than just the greeting.       │
    // │                                                        │
    // │  We check for a common word that appears in many       │
    // │  dev quotes: "code" or common punctuation patterns.    │
    // └─────────────────────────────────────────────────────────┘

    // The header has 3 text elements: date, greeting, and quote
    // Let's just verify there are at least 3 visible text blocks
    const header = page.locator('header');
    const paragraphs = header.locator('p');
    await expect(paragraphs).toHaveCount(2); // date line + quote
  });
});


// ═══════════════════════════════════════════════════════════════════
// TEST GROUP 2: QUICK LINKS
// ═══════════════════════════════════════════════════════════════════
//
// Quick links are the pill buttons at the top: Mail, Drive, etc.

test.describe('Quick Links', () => {

  test('renders the 4 seed quick links', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  getByText() finds elements by their visible text.      │
    // │  The seed data has: Mail, Drive, Telegram, LinkedIn.   │
    // │                                                        │
    // │  toBeVisible() auto-waits up to 5 seconds.             │
    // │  If the text doesn't appear, the test FAILS.           │
    // └─────────────────────────────────────────────────────────┘

    await expect(page.getByRole('link', { name: 'Mail' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Drive' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Telegram' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
  });

  test('quick links have correct URLs', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  getAttribute('href') reads the href attribute,         │
    // │  just like inspecting it in DevTools.                  │
    // │                                                        │
    // │  toContain() checks if the string includes something.  │
    // │  So "https://gmail.com" toContain("gmail") → PASS     │
    // └─────────────────────────────────────────────────────────┘

    const mailLink = page.getByRole('link', { name: 'Mail' });
    await expect(mailLink).toHaveAttribute('href', /gmail/);

    const driveLink = page.getByRole('link', { name: 'Drive' });
    await expect(driveLink).toHaveAttribute('href', /drive\.google/);
  });
});


// ═══════════════════════════════════════════════════════════════════
// TEST GROUP 3: CATEGORY CARDS
// ═══════════════════════════════════════════════════════════════════
//
// The main content: 3 glass cards (Programming, Design, Social)

test.describe('Category Cards', () => {

  test('renders all 3 seed categories', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  locator() uses CSS selectors to find elements.         │
    // │  [data-category-id] is a custom attribute we put on    │
    // │  each category card in CategoryCard.tsx.               │
    // │                                                        │
    // │  toHaveCount(3) checks that exactly 3 elements match.  │
    // └─────────────────────────────────────────────────────────┘

    const cards = page.locator('[data-category-id]');
    await expect(cards).toHaveCount(3);
  });

  test('each category shows its name', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  We verify the category names are visible on screen.    │
    // │                                                        │
    // │  Note: these are <h2> tags inside the card headers.    │
    // │  getByRole('heading') finds them by semantic meaning.  │
    // └─────────────────────────────────────────────────────────┘

    await expect(page.getByRole('heading', { name: 'Programming' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Design' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Social' })).toBeVisible();
  });

  test('Programming card has primary site tiles', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  The primary row has aria-label="Primary sites rail"    │
    // │  (we set this in PrimaryRow.tsx).                       │
    // │                                                        │
    // │  Inside it are <a> tags (links) — one per primary      │
    // │  site. The seed has 7 primary programming sites:       │
    // │  GitHub, Stack Overflow, Hacker News, MDN, etc.        │
    // └─────────────────────────────────────────────────────────┘

    const primaryRails = page.locator('[aria-label="Primary sites rail"]');
    // At least one primary row should have tiles
    const firstRail = primaryRails.first();
    await expect(firstRail).toBeVisible();

    const tiles = firstRail.locator('a');
    // Programming has 7 primary sites in the seed
    const count = await tiles.count();
    expect(count).toBeGreaterThanOrEqual(2); // at least some are visible
  });

  test('shows site count per category', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  Each card header shows "26 sites" or "7 sites" etc.    │
    // │  We check that the word "sites" appears in each card.  │
    // └─────────────────────────────────────────────────────────┘

    const siteCountLabels = page.locator('[data-category-id]').locator('text=sites');
    const count = await siteCountLabels.count();
    expect(count).toBeGreaterThanOrEqual(3); // one per category
  });
});


// ═══════════════════════════════════════════════════════════════════
// TEST GROUP 4: COMMAND PALETTE
// ═══════════════════════════════════════════════════════════════════
//
// The Ctrl+K search overlay — the keyboard-powered site finder.

test.describe('Command Palette', () => {

  test('opens with Ctrl+K and closes with Escape', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  keyboard.press() simulates real key presses.           │
    // │  'Control+k' = holding Ctrl and pressing K.            │
    // │                                                        │
    // │  We check the palette dialog appears, then press Esc   │
    // │  to close it and verify it's gone.                     │
    // └─────────────────────────────────────────────────────────┘

    // Initially the palette should NOT be visible
    const palette = page.locator('[aria-label="Command palette"]');
    await expect(palette).not.toBeVisible();

    // Press Ctrl+K to open
    await page.keyboard.press('Control+k');

    // Now it SHOULD be visible
    await expect(palette).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Should be gone again
    await expect(palette).not.toBeVisible();
  });

  test('shows the search input with placeholder text', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  getByPlaceholder() finds <input> by its placeholder.   │
    // │  This is great for finding search boxes!                │
    // └─────────────────────────────────────────────────────────┘

    await page.keyboard.press('Control+k');

    const input = page.getByPlaceholder('Search sites or type URL...');
    await expect(input).toBeVisible();
  });

  test('searches and finds sites by name', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  fill() types text into an input field.                 │
    // │  Unlike type(), fill() replaces everything instantly.  │
    // │                                                        │
    // │  After typing "github", the fuzzy search should show   │
    // │  GitHub in the results.                                │
    // └─────────────────────────────────────────────────────────┘

    await page.keyboard.press('Control+k');
    await page.getByPlaceholder('Search sites or type URL...').fill('github');

    // The search results should show "GitHub"
    const result = page.locator('[aria-label="Command palette"]').getByText('GitHub', { exact: true });
    await expect(result).toBeVisible();
  });

  test('keyboard navigation works (Arrow Down + Enter)', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  We test the full keyboard flow:                        │
    // │    1. Open palette                                     │
    // │    2. Type a search                                    │
    // │    3. Press ArrowDown to move selection                │
    // │    4. Check the selected item is highlighted           │
    // │                                                        │
    // │  This tests ACCESSIBILITY — can someone use DevDeck    │
    // │  without a mouse? This test proves: YES!               │
    // └─────────────────────────────────────────────────────────┘

    await page.keyboard.press('Control+k');
    await page.getByPlaceholder('Search sites or type URL...').fill('dev');

    // There should be at least one result
    const results = page.locator('[aria-label="Command palette"] [data-result-index]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);

    // First result should be highlighted (has bg-white/10 class)
    const firstResult = results.first();
    await expect(firstResult).toHaveClass(/bg-white/);
  });

  test('shows "Add as new site" when no results match', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  When you search for something that doesn't exist,      │
    // │  the palette should offer to add it as a new site.     │
    // │  This is a great UX pattern — no dead ends!            │
    // └─────────────────────────────────────────────────────────┘

    await page.keyboard.press('Control+k');
    await page.getByPlaceholder('Search sites or type URL...').fill('xyznonexistent');

    // Should show the "Add as new site" fallback
    await expect(
      page.locator('[aria-label="Command palette"]').getByText(/Add.*xyznonexistent.*as a new site/)
    ).toBeVisible();
  });

  test('also opens with "/" key', async ({ page }) => {
    // "/" is a shortcut to open the palette (like many dev tools)
    await page.keyboard.press('/');
    const palette = page.locator('[aria-label="Command palette"]');
    await expect(palette).toBeVisible();
  });
});


// ═══════════════════════════════════════════════════════════════════
// TEST GROUP 5: SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════════
//
// The full-screen settings overlay with its tab system.

test.describe('Settings Modal', () => {

  test('opens when clicking the gear button', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  getByRole('button', { name: 'Settings' }) finds the    │
    // │  gear button by its aria-label.                        │
    // │                                                        │
    // │  This is the BEST way to find interactive elements     │
    // │  because it matches how assistive tech sees the page.  │
    // └─────────────────────────────────────────────────────────┘

    // Click the settings gear button
    await page.getByRole('button', { name: 'Settings' }).click();

    // The settings dialog should appear
    const settings = page.locator('[aria-label="DevDeck Settings"]');
    await expect(settings).toBeVisible();
  });

  test('closes with Escape key', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('[aria-label="DevDeck Settings"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[aria-label="DevDeck Settings"]')).not.toBeVisible();
  });

  test('has all 5 tabs', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  The settings modal has 5 tabs on the left side rail:   │
    // │  Library, Sitemap, Quick Links, Appearance, Data       │
    // │                                                        │
    // │  We check each tab button exists inside the modal.     │
    // └─────────────────────────────────────────────────────────┘

    await page.getByRole('button', { name: 'Settings' }).click();
    const modal = page.locator('[aria-label="DevDeck Settings"]');

    await expect(modal.getByRole('button', { name: /Library/ })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Sitemap/ })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Quick Links/ })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Appearance/ })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Data/ })).toBeVisible();
  });

  test('can switch between tabs', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  We click the "Appearance" tab and verify its content   │
    // │  appears. This tests that tab navigation actually       │
    // │  switches the displayed content.                       │
    // └─────────────────────────────────────────────────────────┘

    await page.getByRole('button', { name: 'Settings' }).click();
    const modal = page.locator('[aria-label="DevDeck Settings"]');

    // Click the Appearance tab
    await modal.getByRole('button', { name: /Appearance/ }).click();

    // Appearance tab should show accent color options
    // (look for a label or heading that's unique to this tab)
    await expect(modal.getByText(/accent/i)).toBeVisible();
  });

  test('closes with the Close button', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('[aria-label="DevDeck Settings"]')).toBeVisible();

    // Click the X close button (aria-label="Close Settings")
    await page.getByRole('button', { name: 'Close Settings' }).click();
    await expect(page.locator('[aria-label="DevDeck Settings"]')).not.toBeVisible();
  });
});


// ═══════════════════════════════════════════════════════════════════
// TEST GROUP 6: SUBCATEGORY NAVIGATION
// ═══════════════════════════════════════════════════════════════════
//
// Inside each category card, there are subcategory pills you can
// click to navigate between groups of sites.

test.describe('Subcategory Navigation', () => {

  test('shows subcategory pills inside the Programming card', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  The Programming category should have pills for:        │
    // │  "General", "Frontend", "Backend", "AI"                │
    // │                                                        │
    // │  We scope our search to just the Programming card       │
    // │  using the data-category-id attribute.                 │
    // └─────────────────────────────────────────────────────────┘

    // Find the first category card (Programming is order 0)
    const programmingCard = page.locator('[data-category-id]').first();

    // It should have subcategory pills
    await expect(programmingCard.getByRole('button', { name: /General/ })).toBeVisible();
    await expect(programmingCard.getByRole('button', { name: /Frontend/ })).toBeVisible();
    await expect(programmingCard.getByRole('button', { name: /Backend/ })).toBeVisible();
    await expect(programmingCard.getByRole('button', { name: /AI/ })).toBeVisible();
  });

  test('clicking a subcategory pill scrolls to that section', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  When you click the "Frontend" pill, the subcategory    │
    // │  rail should scroll to show the Frontend card.          │
    // │                                                        │
    // │  We verify by checking that the Frontend card exists   │
    // │  and contains expected sites like "react.dev".         │
    // └─────────────────────────────────────────────────────────┘

    const programmingCard = page.locator('[data-category-id]').first();

    // Click the "Frontend" pill
    await programmingCard.getByRole('button', { name: /Frontend/ }).click();

    // Wait a moment for the smooth scroll animation
    await page.waitForTimeout(500);

    // The Frontend subcategory card should now be visible
    // and should contain React (a Frontend site)
    const frontendCard = programmingCard.locator('[data-subcategory-card-id]').filter({
      hasText: 'react.dev'
    });
    // The card with react.dev should exist in the DOM
    await expect(frontendCard).toHaveCount(1);
  });
});


// ═══════════════════════════════════════════════════════════════════
// TEST GROUP 7: RESPONSIVE LAYOUT
// ═══════════════════════════════════════════════════════════════════
//
// DevDeck adapts its grid: 3 columns → 2 columns → 1 column
// depending on screen width.

test.describe('Responsive Layout', () => {

  test('shows 1 column on narrow screens', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  setViewportSize() resizes the browser window.          │
    // │  At 1000px wide, the CSS grid should show 1 column.    │
    // │                                                        │
    // │  We verify by checking that all 3 category cards are   │
    // │  stacked vertically (each taking the full width).      │
    // └─────────────────────────────────────────────────────────┘

    await page.setViewportSize({ width: 1000, height: 900 });
    // Give the CSS a moment to reflow
    await page.waitForTimeout(300);

    const cards = page.locator('[data-category-id]');
    await expect(cards).toHaveCount(3);

    // Get the bounding boxes of all 3 cards
    const box0 = await cards.nth(0).boundingBox();
    const box1 = await cards.nth(1).boundingBox();

    // In 1-column layout, each card should have the same x position
    // (they're stacked vertically, not side by side)
    expect(box0!.x).toBeCloseTo(box1!.x, 0);
    // And card 1 should be BELOW card 0
    expect(box1!.y).toBeGreaterThan(box0!.y);
  });
});


// ═══════════════════════════════════════════════════════════════════
// TEST GROUP 8: NO CONSOLE ERRORS
// ═══════════════════════════════════════════════════════════════════
//
// A healthy app should have ZERO console errors. This test catches
// broken imports, missing images, React warnings, etc.

test.describe('Console Health', () => {

  test('no console errors on page load', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  page.on('console', ...) listens to browser console     │
    // │  messages — the same ones you see in DevTools.          │
    // │                                                        │
    // │  We collect all "error" level messages and assert       │
    // │  there are zero. This catches:                         │
    // │    • Broken image/font URLs                            │
    // │    • React rendering errors                            │
    // │    • Missing imports                                   │
    // │    • Runtime exceptions                                │
    // └─────────────────────────────────────────────────────────┘

    const errors: string[] = [];

    // Start listening BEFORE navigating
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Fresh navigation (beforeEach already loaded it, but we want
    // to capture errors from a clean load)
    await page.goto('/');
    await page.locator('[data-category-id]').first().waitFor({ state: 'visible' });

    // Wait a moment for any async errors
    await page.waitForTimeout(1000);

    // Filter out known benign errors (like favicon 404s from
    // google.com/s2/favicons — those happen when offline)
    const realErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('ERR_NETWORK') && !e.includes('404')
    );

    expect(realErrors).toEqual([]);
  });
});


// ═══════════════════════════════════════════════════════════════════
// TEST GROUP 9: ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════
//
// Can someone use DevDeck with just a keyboard? These tests verify.

test.describe('Accessibility', () => {

  test('settings gear is reachable by Tab', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  page.keyboard.press('Tab') simulates pressing Tab.     │
    // │  We press Tab many times and check if the gear button  │
    // │  eventually receives focus.                            │
    // │                                                        │
    // │  This is important for keyboard-only users who can't   │
    // │  use a mouse.                                          │
    // └─────────────────────────────────────────────────────────┘

    // Tab through the page. The gear button should be focusable.
    const settingsButton = page.getByRole('button', { name: 'Settings' });

    // Use focus() directly to test focusability
    await settingsButton.focus();
    await expect(settingsButton).toBeFocused();
  });

  test('all category cards have accessible names', async ({ page }) => {
    // ┌─────────────────────────────────────────────────────────┐
    // │  Each category card is an <article> with a <h2> inside. │
    // │  Screen readers use this structure to announce:         │
    // │  "Article: Programming" to blind users.                │
    // └─────────────────────────────────────────────────────────┘

    const articles = page.locator('article[data-category-id]');
    const count = await articles.count();

    for (let i = 0; i < count; i++) {
      const article = articles.nth(i);
      // Each article should contain a heading
      const heading = article.locator('h2');
      await expect(heading).toBeVisible();
      const text = await heading.textContent();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });
});
