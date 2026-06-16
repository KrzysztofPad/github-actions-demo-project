import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://dev.gritracking.com/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Login' }).first().click();
await page.waitForURL(/ciamlogin\.com/, { timeout: 15000 });
await page.locator('input[name="username"]').waitFor({ state: 'visible', timeout: 20000 });
console.log('=== EMAIL STEP ===  TITLE:', await page.title());
const dump = async () => {
  const inputs = await page.locator('input:visible').evaluateAll(els =>
    els.map(e => ({ type: e.getAttribute('type'), name: e.getAttribute('name'), id: e.id, placeholder: e.getAttribute('placeholder') })));
  const btns = await page.locator('button:visible, input[type=submit]:visible').evaluateAll(els =>
    els.map(e => ({ id: e.id, text: (e.textContent||'').trim().slice(0,30), value: e.getAttribute('value') })));
  console.log('INPUTS:', JSON.stringify(inputs));
  console.log('BUTTONS:', JSON.stringify(btns));
};
await dump();
await page.screenshot({ path: 'out/login-email.png' });
await browser.close();
