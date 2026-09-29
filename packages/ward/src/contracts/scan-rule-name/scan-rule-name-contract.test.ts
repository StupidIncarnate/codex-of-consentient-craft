import { ScanRuleNameStub } from './scan-rule-name.stub';
import { scanRuleNameContract } from './scan-rule-name-contract';

describe('scanRuleNameContract', () => {
  describe('valid input', () => {
    it('VALID: {value: plugin rule} => returns the rule id unchanged', () => {
      const result = ScanRuleNameStub({ value: '@dungeonmaster/ban-primitives' });

      expect(result).toBe('@dungeonmaster/ban-primitives');
    });

    it('VALID: {value: core rule} => returns the rule id unchanged', () => {
      const result = ScanRuleNameStub({ value: 'no-console' });

      expect(result).toBe('no-console');
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {value: empty string} => throws ZodError', () => {
      expect(() => scanRuleNameContract.parse('')).toThrow(/too small/iu);
    });

    it('INVALID: {value: contains whitespace} => throws ZodError', () => {
      expect(() => scanRuleNameContract.parse('no console')).toThrow(/invalid string/iu);
    });
  });
});
