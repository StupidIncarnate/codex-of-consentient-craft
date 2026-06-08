/**
 * PURPOSE: Verification harness that tracks lifecycle hook invocations
 *
 * USAGE:
 * const harness = lifecycleVerifyHarness();
 * // harness.getCallLog() returns ordered list of hook calls
 */

type HookName = 'beforeEach' | 'afterEach';

export const lifecycleVerifyHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  getCallLog: () => HookName[];
} => {
  const callLog: HookName[] = [];

  return {
    beforeEach: (): void => {
      callLog.push('beforeEach');
    },
    afterEach: (): void => {
      callLog.push('afterEach');
    },
    getCallLog: (): HookName[] => callLog,
  };
};
