import { WardSummaryStub } from './ward-summary.stub';
import { wardSummaryContract } from './ward-summary-contract';

describe('wardSummaryContract', () => {
  describe('valid input', () => {
    it('VALID: {value: summary string} => returns branded WardSummary', () => {
      const result = WardSummaryStub({ value: 'run: 1739625600000-a3f1\nlint: PASS 10 packages' });

      expect(result).toBe('run: 1739625600000-a3f1\nlint: PASS 10 packages');
    });
  });

  describe('invalid input', () => {
    it('INVALID_VALUE: {value: number} => throws ZodError', () => {
      expect(() => wardSummaryContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});
