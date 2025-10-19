import { EslintRulesStub } from './eslint-rules.stub';

describe('EslintRulesStub', () => {
  it('VALID: {rule with error level} => returns valid rules', () => {
    const result = EslintRulesStub({
      'no-console': 'error',
      'prefer-const': 'warn',
      'no-unused-vars': 'off',
    });

    expect(result).toStrictEqual({
      'no-console': 'error',
      'prefer-const': 'warn',
      'no-unused-vars': 'off',
    });
  });

  it('VALID: {rule with array configuration} => returns valid rules', () => {
    const result = EslintRulesStub({
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    });

    expect(result).toStrictEqual({
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    });
  });

  it('VALID: {plugin-prefixed rules} => returns valid rules', () => {
    const result = EslintRulesStub({
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
    });

    expect(result).toStrictEqual({
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
    });
  });

  it('VALID: {mixed rule types} => returns valid rules', () => {
    const result = EslintRulesStub({
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'warn',
    });

    expect(result).toStrictEqual({
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'warn',
    });
  });

  it('EMPTY: {empty rules object} => returns empty rules', () => {
    const result = EslintRulesStub({});

    expect(result).toStrictEqual({});
  });

  it('VALID: {} => returns default empty rules', () => {
    const result = EslintRulesStub();

    expect(result).toStrictEqual({});
  });
});
