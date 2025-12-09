import { ruleConfigContract } from './rule-config-contract';
import { RuleConfigStub } from './rule-config.stub';

describe('ruleConfigContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = RuleConfigStub();

    expect(result).toStrictEqual({
      rule: '@dungeonmaster/enforce-project-structure',
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

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return ruleConfigContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
