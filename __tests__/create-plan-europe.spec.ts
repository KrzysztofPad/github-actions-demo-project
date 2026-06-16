import { test } from '@playwright/test';
import { hasCredentials, login } from './helpers/auth';
import { createOneLegTruckPlan, pickTwoDistinct, randomTripId } from './helpers/plan';

/**
 * Creates a one-leg truck shipment plan between two random European cities,
 * departing yesterday, then asserts the plan was saved. See tests/helpers/plan.ts
 * for the wizard steps and the app quirks handled along the way.
 */

/**
 * European cities, each as the full exact autocomplete option string (the
 * geocoder format varies: some "City, Region, Country", some "City, Country").
 * Verified against the live autocomplete to each yield exactly one exact match.
 */
const EU_CITIES = [
  'London, England, United Kingdom',
  'Paris, Île-de-France, France',
  'Berlin, Berlin, Germany',
  'Madrid, Community of Madrid, Spain',
  'Rome, Latium, Italy',
  'Amsterdam, Netherlands',
  'Vienna, Austria',
  'Brussels, Belgium',
  'Munich, Bavaria, Germany',
  'Barcelona, Catalonia, Spain',
  'Lisbon, Portugal',
  'Warsaw, Poland',
  'Prague, Czechia',
  'Hamburg, Hamburg, Germany',
  'Milan, Lombardy, Italy',
  'Frankfurt, Hesse, Germany',
  'Copenhagen, Denmark',
  'Stockholm, Sweden',
  'Zurich, Switzerland',
  'Dublin, Ireland',
];

test('creates a one-leg truck plan between two random European cities departing yesterday', async ({ page }) => {
  test.skip(!hasCredentials, 'Set GRI_USERNAME and GRI_PASSWORD in .env');
  // Login + the multi-step plan wizard is slow, more so under parallel projects.
  test.setTimeout(180_000);

  const [origin, destination] = pickTwoDistinct(EU_CITIES);
  const tripId = randomTripId('QA-EU');
  console.log(`Creating plan "${tripId}": ${origin} → ${destination}`);

  await login(page);
  await createOneLegTruckPlan(page, { tripId, origin, destination });

  const path = `out/created-plan-europe-${test.info().project.name}.png`;
  await page.screenshot({ path, fullPage: true });
  await test.info().attach('created-plan-europe', { path, contentType: 'image/png' });
});
