import { sessionSummaryContract } from './session-summary-contract';
import { SessionSummaryStub } from './session-summary.stub';

describe('sessionSummaryContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "Built login page"} => parses string', () => {
      const result = sessionSummaryContract.parse('Built login page');

      expect(result).toBe('Built login page');
    });

    it('VALID: {value: ""} => parses empty string', () => {
      const result = sessionSummaryContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: 123} => throws for number', () => {
      expect(() => sessionSummaryContract.parse(123)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => sessionSummaryContract.parse(null)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid session summary', () => {
      const result = SessionSummaryStub();

      expect(result).toBe('Built login page with OAuth');
    });

    it('VALID: {value: "custom"} => creates session summary with custom value', () => {
      const result = SessionSummaryStub({ value: 'custom' });

      expect(result).toBe('custom');
    });
  });
});
