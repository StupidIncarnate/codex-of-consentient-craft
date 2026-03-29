import { lintMessageContract } from './lint-message-contract';
import { LintMessageStub } from './lint-message.stub';

describe('lintMessageContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = LintMessageStub();

    expect(result).toStrictEqual({
      ruleId: '@typescript-eslint/no-explicit-any',
      message: 'Unexpected any. Specify a different type.',
      line: 1,
      column: 1,
      severity: 2,
    });
  });

  it('VALID: {custom lint message} => parses successfully', () => {
    const result = LintMessageStub({
      ruleId: 'no-console',
      message: 'Unexpected console statement',
      line: 10,
      column: 5,
      severity: 1,
    });

    expect(result).toStrictEqual({
      ruleId: 'no-console',
      message: 'Unexpected console statement',
      line: 10,
      column: 5,
      severity: 1,
    });
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return lintMessageContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
