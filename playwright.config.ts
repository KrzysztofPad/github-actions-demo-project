import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Load credentials/config from .env if present (Node 25 built-in, no dependency).
if (existsSync('.env')) process.loadEnvFile('.env');

/**
 * Playwright configuration.
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  // Run tests within a file in parallel.
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source.
  forbidOnly: !!process.env.CI,
  // Retry failing tests on CI only.
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel workers on CI.
  workers: process.env.CI ? 1 : undefined,
  // HTML report — open with `npm run report`.
  reporter: 'html',

  use: {
    // Collect a trace when retrying a failed test (view with the trace viewer).
    trace: 'on-first-retry',
    // Capture a screenshot only when a test fails.
    screenshot: 'only-on-failure',
    // Record video only when a test fails.
    video: 'retain-on-failure',
  },

  // Run every test across all three engines.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
