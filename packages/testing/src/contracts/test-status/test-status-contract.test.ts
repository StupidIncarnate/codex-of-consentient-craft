import { testStatusContract } from './test-status-contract';
import { TestStatusStub } from './test-status.stub';

describe('testStatusContract', () => {
  describe('valid values', () => {
    it('VALID: {value: "passed"} => parses successfully', () => {
      const status = TestStatusStub({ value: 'passed' });

      expect(testStatusContract.parse(status)).toBe('passed');
    });

    it('VALID: {value: "failed"} => parses failed status', () => {
      const status = TestStatusStub({ value: 'failed' });

      expect(testStatusContract.parse(status)).toBe('failed');
    });
  });

  describe('invalid values', () => {
    it('INVALID_VALUE: {value: "unknown"} => throws validation error', () => {
      expect(() => {
        return testStatusContract.parse('unknown');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
