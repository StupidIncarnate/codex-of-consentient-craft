import { lifecycleVerifyHarness } from './lifecycle-verify.harness';

describe('Harness lifecycle hook wiring (Jest)', () => {
  const harness = lifecycleVerifyHarness();

  it('VALID: {first test} => beforeEach fired before test execution', () => {
    const log = harness.getCallLog();
    // Clear log for next test, then assert
    const snapshot = [...log];
    log.length = 0;

    expect(snapshot).toStrictEqual(['beforeEach']);
  });

  it('VALID: {second test} => afterEach fired after first test, beforeEach fired before this test', () => {
    const log = harness.getCallLog();

    expect(log).toStrictEqual(['afterEach', 'beforeEach']);
  });
});
