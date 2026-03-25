/**
 * PURPOSE: Extends Playwright test with automatic network recording via auto-fixture
 *
 * USAGE:
 * import { test, expect } from '@dungeonmaster/testing/e2e';
 * // Network recording runs automatically for every test — no setup needed
 */
import { test as base, expect } from '@playwright/test';
import { networkHarness } from '../test/harnesses/network/network.harness';

export const test = base.extend<{ _networkRecording: void }>({
  _networkRecording: [
    async ({ page }, use, testInfo) => {
      const harness = networkHarness({ page });
      harness.beforeEach();
      await use();
      await harness.dump({ testInfo });
    },
    { auto: true },
  ],
});

export { expect };
