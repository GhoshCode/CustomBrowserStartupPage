/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║            PLAYWRIGHT CONFIGURATION FILE                        ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  This file tells Playwright:                                    ║
 * ║   1. Where to find your test files                              ║
 * ║   2. Which browser(s) to test in                                ║
 * ║   3. How to start your dev server before testing                ║
 * ║                                                                 ║
 * ║  Think of it as the "settings panel" for your test suite.       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { defineConfig } from '@playwright/test';

// DevDeck's dev server port (matches .claude/launch.json "devdeck").
const PORT = 5180;

export default defineConfig({
  // ─── WHERE ARE YOUR TEST FILES? ───────────────────────────────
  // Playwright will look inside the "e2e/" folder for any file
  // ending in ".spec.ts" — that's where we'll write our tests.
  testDir: './e2e',

  // ─── TIMEOUTS ─────────────────────────────────────────────────
  // If a single test takes longer than 30 seconds, fail it.
  // This prevents a broken test from hanging forever.
  timeout: 30_000,

  // ─── RETRY FLAKY TESTS ───────────────────────────────────────
  // UI tests can sometimes fail due to animations/timing.
  // Retrying once catches most "flaky" failures.
  retries: 1,

  // Two workers: with the default (half the CPU threads) the heavier visual
  // tests starve each other and time out on a 16-thread machine.
  workers: 2,

  // ─── REPORTER ─────────────────────────────────────────────────
  // "html" generates a pretty report you can open in your browser.
  // After tests run, do: npx playwright show-report
  reporter: [['list'], ['html', { open: 'never' }]],

  // ─── SHARED SETTINGS FOR ALL TESTS ────────────────────────────
  use: {
    // Base URL — so tests can write page.goto('/') instead of the full URL.
    // DevDeck's own port (5173 is used by the original project's server).
    baseURL: `http://localhost:${PORT}`,

    // Take a screenshot only when a test FAILS (for debugging).
    screenshot: 'only-on-failure',

    // Record a video only when a test FAILS (for debugging).
    video: 'retain-on-failure',

    // Record a trace (step-by-step replay) on first retry.
    // Open with: npx playwright show-trace trace.zip
    trace: 'on-first-retry',
  },

  // ─── WHICH BROWSERS TO TEST IN ────────────────────────────────
  // Each "project" is one browser. You can add Firefox, Safari, etc.
  // We're using Chromium (Chrome/Edge engine) only for speed.
  projects: [
    {
      name: 'chromium',
      testIgnore: 'qa/**',
      use: {
        // Use Edge on your Windows machine since it's already installed
        channel: 'msedge',
        // Desktop viewport (1650px matches the design's 3-column grid)
        viewport: { width: 1650, height: 950 },
      },
    },
    // ─── MANUAL-QA PASS ──────────────────────────────────────────
    // `npm run qa`: walks the UI like a tester. Every test keeps a video,
    // a trace and step screenshots (qa-artifacts/), and measures smoothness,
    // load time and colour contrast with the helpers in e2e/qa/qa.ts.
    {
      name: 'qa',
      testMatch: 'qa/**/*.spec.ts',
      testIgnore: 'qa/perf.spec.ts',
      timeout: 120_000,
      retries: 0,
      use: {
        channel: 'msedge',
        // A 14" MacBook Pro's default resolution — the target customer.
        viewport: { width: 1512, height: 982 },
        video: 'on',
        trace: 'on',
        screenshot: 'on',
      },
    },
    // Frame-timing budgets are only meaningful with nothing else running:
    // this project starts after `qa` finishes, so no other worker is
    // recording video or screenshots while frames are measured.
    {
      name: 'qa-perf',
      testMatch: 'qa/perf.spec.ts',
      dependencies: ['qa'],
      fullyParallel: false,
      timeout: 180_000,
      retries: 0,
      use: {
        channel: 'msedge',
        viewport: { width: 1512, height: 982 },
      },
    },
  ],

  // ─── AUTO-START DEV SERVER ────────────────────────────────────
  // Before running tests, Playwright will start Vite for you.
  // It waits until the port responds, then runs tests.
  // After tests finish, it kills the server automatically.
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: true,   // If dev server is already running, reuse it
    timeout: 30_000,             // Wait up to 30s for it to start
  },
});
