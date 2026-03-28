import { SummaryLineStub } from './summary-line.stub';
import { summaryLineContract } from './summary-line-contract';

describe('summaryLineContract', () => {
  describe('valid input', () => {
    it('VALID: {value: error message} => parses successfully', () => {
      const result = SummaryLineStub({ value: 'Expected true to be false' });

      expect(result).toBe('Expected true to be false');
    });

    it('VALID: {value: timeout annotation} => parses successfully', () => {
      const result = SummaryLineStub({
        value: 'TIMEOUT: Test killed before reaching any expect() calls.',
      });

      expect(result).toBe('TIMEOUT: Test killed before reaching any expect() calls.');
    });
  });

  describe('invalid input', () => {
    it('INVALID_VALUE: {value: empty string} => throws min length error', () => {
      expect(() => summaryLineContract.parse('')).toThrow(/too_small/u);
    });
  });
});
