/**
 * PURPOSE: Bridges harness lifecycle hooks (beforeEach/afterEach) to Playwright's test.beforeEach/test.afterEach
 *
 * USAGE:
 * import { wireHarnessLifecycle } from './fixtures/harness-wire';
 * const guilds = wireHarnessLifecycle({ harness: guildHarness(), testObj: test });
 * // Registers guilds.beforeEach and guilds.afterEach with Playwright
 */

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
