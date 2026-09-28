import { eslintRuleNameContract } from './eslint-rule-name-contract';
import { EslintRuleNameStub } from './eslint-rule-name.stub';

describe('eslintRuleNameContract', () => {
  describe('valid names', () => {
    it('VALID: {value: "no-console"} => parses successfully', () => {
      const name = EslintRuleNameStub({ value: 'no-console' });

      const result = eslintRuleNameContract.parse(name);

      expect(result).toBe('no-console');
    });
  });

  describe('invalid names', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => eslintRuleNameContract.parse(123 as never)).toThrow(/expected string/u);
    });
  });
});
