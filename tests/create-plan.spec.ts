import { test } from '@playwright/test';
import { hasCredentials, login } from './helpers/auth';
import { createOneLegTruckPlan, pickTwoDistinct, randomTripId } from './helpers/plan';

/**
 * Creates a one-leg truck shipment plan between two random US cities, departing
 * yesterday, then asserts the plan was saved. See tests/helpers/plan.ts for the
 * wizard steps and the app quirks handled along the way.
 */

/** US cities verified to resolve to an exact "City, ST" autocomplete option. */
const US_CITIES = [
  'Los Angeles, CA', 'New York, NY', 'Chicago, IL', 'Houston, TX',
  'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
  'Dallas, TX', 'Seattle, WA', 'Denver, CO', 'Boston, MA',
  'Atlanta, GA', 'Miami, FL', 'Portland, OR', 'Las Vegas, NV',
  'Nashville, TN', 'Minneapolis, MN', 'Kansas City, MO', 'Salt Lake City, UT',
];

test('creates a one-leg truck plan between two random US cities departing yesterday', async ({ page }) => {
  test.skip(!hasCredentials, 'Set GRI_USERNAME and GRI_PASSWORD in .env');
  // Login + the multi-step plan wizard is slow, more so under parallel projects.
  test.setTimeout(180_000);

  const [origin, destination] = pickTwoDistinct(US_CITIES);
  const tripId = randomTripId();
  console.log(`Creating plan "${tripId}": ${origin} → ${destination}`);

  await login(page);
  await createOneLegTruckPlan(page, { tripId, origin, destination });

  const path = `out/created-plan-${test.info().project.name}.png`;
  await page.screenshot({ path, fullPage: true });
  await test.info().attach('created-plan', { path, contentType: 'image/png' });
});
