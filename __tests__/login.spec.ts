import { test, expect } from '@playwright/test';
import { hasCredentials, login } from './helpers/auth';

/**
 * Verifies the full Microsoft Entra login flow lands on the dashboard, then
 * captures a screenshot of the signed-in app. Skipped without credentials so
 * the suite stays green. See tests/helpers/auth.ts for the shared login steps.
 */
test('logs in and lands on the dashboard', async ({ page }) => {
  test.skip(!hasCredentials, 'Set GRI_USERNAME and GRI_PASSWORD in .env');
  // The Entra OAuth flow has many redirects and is slow, especially when all
  // three browser projects run in parallel against the same account.
  test.setTimeout(120_000);

  await login(page);
  await expect(page).toHaveURL(/dev\.gritracking\.com\/dashboard/);

  // One screenshot per browser so the parallel projects don't clobber each
  // other, and attach it to the HTML report.
  const path = `out/dashboard-${test.info().project.name}.png`;
  await page.screenshot({ path, fullPage: true });
  await test.info().attach('dashboard', { path, contentType: 'image/png' });
});
