import { type Page, expect } from '@playwright/test';

export const USERNAME = process.env.GRI_USERNAME;
export const PASSWORD = process.env.GRI_PASSWORD;

/** True when credentials are available; specs use this to skip otherwise. */
export const hasCredentials = Boolean(USERNAME && PASSWORD);

/**
 * Logs in to https://dev.gritracking.com/ via its Microsoft Entra External ID
 * (ciamlogin.com) OAuth flow and waits for the dashboard to render:
 *   landing → "Login" → Entra email step → password step → "Stay signed in? → Yes"
 *   → /dashboard
 *
 * Credentials come from env vars (GRI_USERNAME / GRI_PASSWORD, see .env.example).
 */
export async function login(page: Page): Promise<void> {
  // 1. Landing page → Login, which redirects to Microsoft Entra.
  await page.goto('https://dev.gritracking.com/');
  await page.getByRole('button', { name: 'Login' }).first().click();
  await page.waitForURL(/ciamlogin\.com/, { timeout: 20_000 });

  // 2. Email step.
  const email = page.locator('input[name="username"]');
  await email.waitFor({ state: 'visible', timeout: 20_000 });
  await email.fill(USERNAME!);
  await page.getByRole('button', { name: 'Next' }).click();

  // 3. Password step.
  const password = page.locator('input[type="password"]');
  await password.waitFor({ state: 'visible', timeout: 20_000 });
  await password.fill(PASSWORD!);
  await page.getByRole('button', { name: /^(Sign in|Log in)$/ }).click();

  // 4. "Stay signed in?" → Yes (or Microsoft redirects straight through).
  const stayPrompt = page.getByRole('heading', { name: 'Stay signed in?' });
  await Promise.race([
    stayPrompt
      .waitFor({ timeout: 30_000 })
      .then(() => page.getByRole('button', { name: 'Yes' }).click()),
    page.waitForURL(/dev\.gritracking\.com\/dashboard/, { timeout: 30_000 }),
  ]).catch(() => {});

  // 5. Land on the dashboard. It's a real-time app (open websockets), so wait
  //    for a concrete nav element rather than 'networkidle', which never settles.
  await page.waitForURL(/dev\.gritracking\.com\/dashboard/, { timeout: 60_000 });
  await expect(page.getByText('Live Ops').first()).toBeVisible({ timeout: 30_000 });
}
