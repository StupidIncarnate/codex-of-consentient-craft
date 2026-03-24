import { test, expect } from '@playwright/test';
import { wireHarnessLifecycle } from './fixtures/test-helpers';
import { lifecycleVerifyHarness } from '../../test/harnesses/lifecycle-verify/lifecycle-verify.harness';

test.describe('Harness lifecycle hook wiring (Playwright)', () => {
  const harness = wireHarnessLifecycle({ harness: lifecycleVerifyHarness(), testObj: test });

  test('first test — beforeEach fired before test', () => {
    const log = harness.getCallLog();

    expect(log).toStrictEqual(['beforeEach']);

    log.length = 0;
  });

  test('second test — afterEach + beforeEach fired', () => {
    const log = harness.getCallLog();

    expect(log).toStrictEqual(['afterEach', 'beforeEach']);
  });
});
