import { LintMessageStub } from './lint-message.stub';

describe('lintMessageContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = LintMessageStub();

    expect(result.ruleId).toBe('@typescript-eslint/no-explicit-any');
    expect(result.message).toBe('Unexpected any. Specify a different type.');
    expect(result.line).toBe(1);
    expect(result.column).toBe(1);
    expect(result.severity).toBe(2);
  });

  it('VALID: {custom lint message} => parses successfully', () => {
    const result = LintMessageStub({
      ruleId: 'no-console',
      message: 'Unexpected console statement',
      line: 10,
      column: 5,
      severity: 1,
    });

    expect(result.ruleId).toBe('no-console');
    expect(result.severity).toBe(1);
  });
});
