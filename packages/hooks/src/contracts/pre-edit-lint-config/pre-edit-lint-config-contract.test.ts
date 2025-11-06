import { PreEditLintConfigStub } from './pre-edit-lint-config.stub';

describe('preEditLintConfigContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = PreEditLintConfigStub();

    expect(result).toStrictEqual({
      rules: ['@questmaestro/enforce-project-structure'],
    });
  });

  it('VALID: {multiple rules} => parses successfully', () => {
    const result = PreEditLintConfigStub({
      rules: ['rule1', 'rule2', 'rule3'],
    });

    expect(result.rules).toHaveLength(3);
  });
});
