/**
 * PURPOSE: Gateway entry for the npm package '@playwright/test'. Every raw export passes through
 * except `chromium`, which this subpath overrides with OUR wrapped version — see `./chromium/chromium`.
 *
 * USAGE:
 * import { chromium, expect } from '#gateway/npm/playwright__test';
 */

export * from '@playwright/test';
export { chromium } from './chromium/chromium';
