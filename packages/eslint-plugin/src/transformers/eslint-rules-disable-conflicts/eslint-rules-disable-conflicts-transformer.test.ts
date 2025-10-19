import { eslintRulesDisableConflictsTransformer } from './eslint-rules-disable-conflicts-transformer';
import { EslintRulesStub } from '../../contracts/eslint-rules/eslint-rules.stub';

describe('eslintRulesDisableConflictsTransformer', () => {
  it('VALID: {mergedRules with base rule, overrideRules with plugin rule} => disables base rule', () => {
    const mergedRules = EslintRulesStub({
      'no-unused-vars': 'error',
      'no-console': 'warn',
    });

    const overrideRules = EslintRulesStub({
      '@typescript-eslint/no-unused-vars': 'error',
    });

    eslintRulesDisableConflictsTransformer({ mergedRules, overrideRules });

    expect(mergedRules).toStrictEqual({
      'no-unused-vars': 'off',
      'no-console': 'warn',
    });
  });

  it('VALID: {multiple base rules, multiple plugin overrides} => disables all conflicting base rules', () => {
    const mergedRules = EslintRulesStub({
      'no-unused-vars': 'error',
      'no-use-before-define': 'error',
      'dot-notation': 'error',
      'no-console': 'warn',
    });

    const overrideRules = EslintRulesStub({
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/dot-notation': 'error',
    });

    eslintRulesDisableConflictsTransformer({ mergedRules, overrideRules });

    expect(mergedRules).toStrictEqual({
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'dot-notation': 'off',
      'no-console': 'warn',
    });
  });

  it('VALID: {base rules, non-conflicting plugin rules} => keeps base rules unchanged', () => {
    const mergedRules = EslintRulesStub({
      'no-console': 'error',
      'prefer-const': 'error',
    });

    const overrideRules = EslintRulesStub({
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    });

    eslintRulesDisableConflictsTransformer({ mergedRules, overrideRules });

    expect(mergedRules).toStrictEqual({
      'no-console': 'error',
      'prefer-const': 'error',
    });
  });

  it('VALID: {base rules, rules without slash} => ignores non-plugin rules', () => {
    const mergedRules = EslintRulesStub({
      'no-console': 'error',
    });

    const overrideRules = EslintRulesStub({
      'standalone-rule': 'error',
      'no-console': 'warn',
    });

    eslintRulesDisableConflictsTransformer({ mergedRules, overrideRules });

    expect(mergedRules).toStrictEqual({
      'no-console': 'error',
    });
  });

  it('EMPTY: {empty mergedRules, plugin rules} => no changes', () => {
    const mergedRules = EslintRulesStub({});

    const overrideRules = EslintRulesStub({
      '@typescript-eslint/no-unused-vars': 'error',
    });

    eslintRulesDisableConflictsTransformer({ mergedRules, overrideRules });

    expect(mergedRules).toStrictEqual({});
  });

  it('EMPTY: {base rules, empty overrideRules} => no changes', () => {
    const mergedRules = EslintRulesStub({
      'no-console': 'error',
    });

    const overrideRules = EslintRulesStub({});

    eslintRulesDisableConflictsTransformer({ mergedRules, overrideRules });

    expect(mergedRules).toStrictEqual({
      'no-console': 'error',
    });
  });

  it('VALID: {base rule with array config, plugin override} => disables base rule preserving type', () => {
    const mergedRules = EslintRulesStub({
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    });

    const overrideRules = EslintRulesStub({
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    });

    eslintRulesDisableConflictsTransformer({ mergedRules, overrideRules });

    expect(mergedRules).toStrictEqual({
      'no-unused-vars': 'off',
    });
  });
});
