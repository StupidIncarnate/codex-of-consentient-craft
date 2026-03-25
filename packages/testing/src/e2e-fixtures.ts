/**
 * PURPOSE: Extends Playwright test with automatic network recording via auto-fixture
 *          and provides wireHarnessLifecycle for bridging harness hooks to Playwright
 *
 * USAGE:
 * import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
 * // Network recording runs automatically for every test — no setup needed
 * // wireHarnessLifecycle bridges harness beforeEach/afterEach to Playwright's test hooks
 */
import { test as base, expect } from '@playwright/test';
import { networkHarness } from '../test/harnesses/network/network.harness';

interface NetworkRecordingFixture {
  _networkRecording: undefined;
}

export const test = base.extend<NetworkRecordingFixture>({
  _networkRecording: [
    async ({ page }, use, testInfo) => {
      const harness = networkHarness({ page });
      harness.beforeEach();
      await use(undefined);
      await harness.dump({ testInfo });
    },
    { auto: true },
  ],
});

export { expect };

type HarnessWithLifecycle = Record<PropertyKey, unknown> & {
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
};

interface PlaywrightTestObj {
  beforeEach: (fn: () => void | Promise<void>) => void;
  afterEach: (fn: () => void | Promise<void>) => void;
}

export const wireHarnessLifecycle = <T extends HarnessWithLifecycle>({
  harness,
  testObj,
}: {
  harness: T;
  testObj: PlaywrightTestObj;
}): T => {
  if (typeof harness.beforeEach === 'function') {
    testObj.beforeEach(harness.beforeEach);
  }

  if (typeof harness.afterEach === 'function') {
    testObj.afterEach(harness.afterEach);
  }

  return harness;
};
