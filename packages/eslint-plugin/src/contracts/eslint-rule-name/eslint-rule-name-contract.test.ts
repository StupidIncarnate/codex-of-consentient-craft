import { EslintRuleNameStub } from './eslint-rule-name.stub';
import { eslintRuleNameContract } from './eslint-rule-name-contract';

describe('eslintRuleNameContract', () => {
  describe('parse()', () => {
    it("VALID: {value: 'explicit-return-types'} => returns branded EslintRuleName", () => {
      eslintRuleNameContract.safeParse('');
      const result = EslintRuleNameStub({ value: 'explicit-return-types' });

      expect(result).toBe('explicit-return-types');
    });

    it("VALID: {value: 'enforce-test-colocation'} => returns branded EslintRuleName", () => {
      const result = EslintRuleNameStub({ value: 'enforce-test-colocation' });

      expect(result).toBe('enforce-test-colocation');
    });

    it("INVALID_EMPTY: {value: ''} => throws 'String must contain at least 1 character(s)'", () => {
      expect(() => {
        EslintRuleNameStub({ value: '' });
      }).toThrow('String must contain at least 1 character(s)');
    });
  });
});
