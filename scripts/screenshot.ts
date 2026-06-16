import { chromium } from '@playwright/test';

/**
 * Ad-hoc screenshot grabber — runs outside the test runner.
 *
 * Usage:
 *   node scripts/screenshot.ts <url> [outfile] [--full]
 *
 * Examples:
 *   node scripts/screenshot.ts https://example.com
 *   node scripts/screenshot.ts https://example.com out/example.png --full
 *
 * Node 25 strips the TypeScript types natively, so no build step is needed.
 */
const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--'));
const outfile =
  args.filter((a) => !a.startsWith('--'))[1] ?? 'screenshot.png';
const fullPage = args.includes('--full');

if (!url) {
  console.error('Usage: node scripts/screenshot.ts <url> [outfile] [--full]');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

console.log(`→ Navigating to ${url}`);
await page.goto(url, { waitUntil: 'networkidle' });
await page.screenshot({ path: outfile, fullPage });
await browser.close();

console.log(`✓ Saved ${fullPage ? 'full-page ' : ''}screenshot to ${outfile}`);
