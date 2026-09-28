/**
 * PURPOSE: OUR `chromium`, the one place a caller launches a Playwright browser from. The barrel
 * (`../playwright__test.ts`) re-exports it by name, which makes it a WRAPPED export with its own
 * proxy instead of a pass-through. Narrowed to `launch`, the only `BrowserType` call this repo makes
 * — a caller needing another (`launchPersistentContext`, `connect`) extends this file rather than
 * reaching for the raw package. An arrow property rather than the real `BrowserType` method, so the
 * proxy can spy on it without detaching a `this`-bound method.
 *
 * USAGE:
 * import { chromium } from '#gateway/npm/playwright__test';
 * const browser = await chromium.launch({ headless: true });
 */
import { chromium as pkgChromium } from '@playwright/test';
import type { Browser, LaunchOptions } from '@playwright/test';

export const chromium = {
  launch: async (options?: LaunchOptions): Promise<Browser> => pkgChromium.launch(options),
};
