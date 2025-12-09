import { preEditLintConfigContract } from './pre-edit-lint-config-contract';
import { PreEditLintConfigStub } from './pre-edit-lint-config.stub';

describe('preEditLintConfigContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = PreEditLintConfigStub();

    expect(result).toStrictEqual({
      rules: ['@dungeonmaster/enforce-project-structure'],
    });
  });

  it('VALID: {multiple rules} => parses successfully', () => {
    const result = PreEditLintConfigStub({
      rules: ['rule1', 'rule2', 'rule3'],
    });

    expect(result.rules).toHaveLength(3);
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return preEditLintConfigContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
