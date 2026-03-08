import { blockingReasonContract } from './blocking-reason-contract';
import { BlockingReasonStub } from './blocking-reason.stub';

describe('blockingReasonContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "Waiting for dependency"} => parses valid reason', () => {
      const result = blockingReasonContract.parse('Waiting for dependency');

      expect(result).toBe('Waiting for dependency');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => blockingReasonContract.parse('')).toThrow(/String must contain at least 1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid blocking reason', () => {
      const result = BlockingReasonStub();

      expect(result).toBe('Waiting for dependency step-1');
    });

    it('VALID: {value: "Rate limited"} => creates with custom value', () => {
      const result = BlockingReasonStub({ value: 'Rate limited' });

      expect(result).toBe('Rate limited');
    });
  });
});
