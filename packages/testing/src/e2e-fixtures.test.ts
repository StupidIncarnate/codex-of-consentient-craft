/**
 * PURPOSE: Tests wireHarnessLifecycle utility for bridging harness hooks to test frameworks
 *
 * USAGE: npm run ward -- --only unit -- packages/testing/src/e2e-fixtures.test.ts
 */
import { wireHarnessLifecycle } from './e2e-fixtures';

const PlaywrightTestObjStub = (): {
  beforeEach: jest.Mock;
  afterEach: jest.Mock;
} => ({
  beforeEach: jest.fn(),
  afterEach: jest.fn(),
});

const HarnessWithBothHooksStub = (): {
  beforeEach: jest.Mock;
  afterEach: jest.Mock;
  someMethod: jest.Mock;
} => ({
  beforeEach: jest.fn(),
  afterEach: jest.fn(),
  someMethod: jest.fn(),
});

const HarnessWithBeforeEachOnlyStub = (): {
  beforeEach: jest.Mock;
  someMethod: jest.Mock;
} => ({
  beforeEach: jest.fn(),
  someMethod: jest.fn(),
});

const HarnessWithAfterEachOnlyStub = (): {
  afterEach: jest.Mock;
} => ({
  afterEach: jest.fn(),
});

const HarnessWithNoHooksStub = (): {
  someOtherMethod: jest.Mock;
} => ({
  someOtherMethod: jest.fn(),
});

describe('wireHarnessLifecycle', () => {
  describe('beforeEach registration', () => {
    it('VALID: {harness with beforeEach} => registers beforeEach on test object', () => {
      const testObj = PlaywrightTestObjStub();
      const harness = HarnessWithBeforeEachOnlyStub();

      const result = wireHarnessLifecycle({ harness, testObj });

      expect(testObj.beforeEach).toHaveBeenCalledWith(harness.beforeEach);
      expect(testObj.afterEach).not.toHaveBeenCalled();
      expect(result).toBe(harness);
    });
  });

  describe('afterEach registration', () => {
    it('VALID: {harness with afterEach} => registers afterEach on test object', () => {
      const testObj = PlaywrightTestObjStub();
      const harness = HarnessWithAfterEachOnlyStub();

      wireHarnessLifecycle({ harness, testObj });

      expect(testObj.afterEach).toHaveBeenCalledWith(harness.afterEach);
      expect(testObj.beforeEach).not.toHaveBeenCalled();
    });
  });

  describe('both hooks', () => {
    it('VALID: {harness with both hooks} => registers both on test object', () => {
      const testObj = PlaywrightTestObjStub();
      const harness = HarnessWithBothHooksStub();

      wireHarnessLifecycle({ harness, testObj });

      expect(testObj.beforeEach).toHaveBeenCalledWith(harness.beforeEach);
      expect(testObj.afterEach).toHaveBeenCalledWith(harness.afterEach);
    });
  });

  describe('no hooks', () => {
    it('VALID: {harness with no hooks} => registers nothing, returns harness', () => {
      const testObj = PlaywrightTestObjStub();
      const harness = HarnessWithNoHooksStub();

      const result = wireHarnessLifecycle({ harness, testObj });

      expect(testObj.beforeEach).not.toHaveBeenCalled();
      expect(testObj.afterEach).not.toHaveBeenCalled();
      expect(result).toBe(harness);
    });
  });
});
