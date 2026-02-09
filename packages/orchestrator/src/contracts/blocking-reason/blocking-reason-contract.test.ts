import { BlockingReasonStub } from './blocking-reason.stub';
import { blockingReasonContract } from './blocking-reason-contract';

describe('blockingReasonContract', () => {
  describe('valid inputs', () => {
    it('VALID: {string} => parses as branded type', () => {
      const result = blockingReasonContract.parse('User input needed');

      expect(result).toBe('User input needed');
    });

    it('VALID: {stub} => returns branded string', () => {
      const stub = BlockingReasonStub();

      expect(stub).toBe('User input needed');
    });

    it('VALID: {custom value} => returns custom branded string', () => {
      const stub = BlockingReasonStub({ value: 'Custom blocking reason' });

      expect(stub).toBe('Custom blocking reason');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {number} => throws error', () => {
      expect(() => blockingReasonContract.parse(123)).toThrow(/Expected string/u);
    });

    it('INVALID: {null} => throws error', () => {
      expect(() => blockingReasonContract.parse(null)).toThrow(/Expected string/u);
    });
  });
});
