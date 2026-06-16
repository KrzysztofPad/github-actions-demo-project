import { type Page, expect } from '@playwright/test';

/** Yesterday at 09:00, formatted as the date field expects: MM/DD/YYYY hh:mm aa */
export function yesterdayAt9am(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()} 09:00 AM`;
}

/** A unique Trip ID so repeated runs never collide. */
export function randomTripId(prefix = 'QA-AUTO'): string {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return `${prefix} ${suffix}`;
}

/** Two distinct random items [a, b] from a pool (a !== b). */
export function pickTwoDistinct<T>(pool: T[]): [T, T] {
  const a = Math.floor(Math.random() * pool.length);
  let b = Math.floor(Math.random() * (pool.length - 1));
  if (b >= a) b += 1;
  return [pool[a], pool[b]];
}

/** Escape a string for safe use inside a RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Fills a location autocomplete: types the city part of an exact option string,
 * then clicks that exact option and verifies it stuck.
 *
 * `option` must be the full geocoder string (e.g. "Berlin, Berlin, Germany");
 * we type everything before the first comma to trigger the suggestions.
 */
async function fillLocation(page: Page, placeholder: string, option: string): Promise<void> {
  const field = page.getByPlaceholder(placeholder);
  const query = option.split(',')[0];
  await field.click();
  await field.fill('');
  await field.pressSequentially(query, { delay: 60 });
  await page.getByText(option, { exact: true }).first().click();
  await expect(field).toHaveValue(new RegExp(escapeRegExp(query)));
}

/**
 * Creates and saves a one-leg truck shipment plan, then asserts the saved-plan
 * page is shown. Assumes the caller is already logged in and on the dashboard.
 *
 * `origin`/`destination` are full autocomplete option strings.
 *
 * App quirks handled here:
 *  - Only "Trip ID / Project Name" is required to unlock "Manage route".
 *  - The form's text inputs are React-controlled and don't reliably register a
 *    plain .fill(); we type with pressSequentially so onChange fires.
 *  - Transportation modes are icon buttons; truck = the "road" icon.
 */
export async function createOneLegTruckPlan(
  page: Page,
  opts: { tripId: string; origin: string; destination: string },
): Promise<void> {
  // --- Open the create-plan wizard ---
  await page.getByRole('button', { name: /Create\s*Plan/i }).first().click();
  await page.waitForURL(/order\/create/, { timeout: 20_000 });

  // --- Order section ---
  const tripId = page.locator('input[type="text"]').first();
  await tripId.waitFor({ state: 'visible' });
  // Let React finish hydrating before typing, or onChange won't register.
  await page.waitForTimeout(1_000);
  // Cargo type first so its re-render can't wipe the Trip ID we type next.
  await page.locator('label').filter({ hasText: /^General$/ }).click();
  await tripId.click();
  await tripId.pressSequentially(opts.tripId, { delay: 25 });

  const manageRoute = page.getByRole('button', { name: /Manage route/i });
  await expect(manageRoute).toBeEnabled({ timeout: 10_000 });
  await manageRoute.click();

  // --- Route builder: a single leg A → B ---
  await fillLocation(page, 'Departure Location', opts.origin);

  // Transportation = truck (the "road" icon button)
  await page.locator('label:has(i.icon-road)').click();

  // Departure date = yesterday 09:00
  const dateField = page.getByPlaceholder('MM/DD/YYYY hh:mm aa');
  await dateField.click();
  await dateField.pressSequentially(yesterdayAt9am(), { delay: 30 });

  await fillLocation(page, 'End destination', opts.destination);

  // --- Review and save ---
  await page.getByRole('button', { name: /Overview plan/i }).click();
  await page.getByRole('button', { name: /Save plan/i }).click();

  // On success the app redirects to the saved plan and shows "View Shipment plan".
  await page.waitForURL(/\/order\/[0-9a-f-]{36}/, { timeout: 30_000 });
  await expect(page.getByText('View Shipment plan')).toBeVisible({ timeout: 15_000 });
}
