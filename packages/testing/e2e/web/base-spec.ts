/**
 * PURPOSE: Extends Playwright test with network recording that dumps on each test completion
 *
 * USAGE:
 * import { test, expect } from './base-spec';
 * // Automatically records and dumps network activity per test
 */
import { test as base, expect } from '@playwright/test';
import { networkHarness } from '../../test/harnesses/network/network.harness';

const holder: { current?: ReturnType<typeof networkHarness> } = {};

const test = base;

test.beforeEach(({ page }) => {
  holder.current = networkHarness({ page });
  holder.current.beforeEach();
});

test.afterEach(async ({ page: _page }, testInfo) => {
  if (holder.current) {
    await holder.current.dump({ testInfo });
  }
});

export { test, expect };
