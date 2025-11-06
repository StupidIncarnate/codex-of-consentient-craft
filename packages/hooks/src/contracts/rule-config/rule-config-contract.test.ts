import { RuleConfigStub } from './rule-config.stub';

describe('ruleConfigContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = RuleConfigStub();

    expect(result).toStrictEqual({
      rule: '@questmaestro/enforce-project-structure',
      displayName: 'Enforce Project Structure',
    });
  });

  it('VALID: {with message string} => parses successfully', () => {
    const result = RuleConfigStub({
      rule: 'no-console',
      displayName: 'No Console',
      message: 'Console statements are not allowed',
    });

    expect(result.message).toBe('Console statements are not allowed');
  });
});
