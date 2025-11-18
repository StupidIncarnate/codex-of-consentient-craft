import { EslintConfigStub } from './eslint-config.stub';
import { eslintConfigContract } from './eslint-config-contract';

describe('EslintConfigStub', () => {
  it('VALID: {} => returns default EslintConfig', () => {
    const result = EslintConfigStub();

    expect(result).toStrictEqual({
      plugins: {},
      rules: {},
      files: ['**/*.ts'],
      ignores: ['node_modules'],
      languageOptions: {
        globals: {},
        parser: undefined,
        parserOptions: {},
      },
    });
  });

  it('VALID: {plugins: {test: {}}, rules: {"test-rule": "error"}} => returns custom EslintConfig', () => {
    const result = EslintConfigStub({
      plugins: {
        test: {},
      },
      rules: {
        'test-rule': 'error',
      },
    });

    expect(result).toStrictEqual({
      plugins: { test: {} },
      rules: { 'test-rule': 'error' },
      files: ['**/*.ts'],
      ignores: ['node_modules'],
      languageOptions: {
        globals: {},
        parser: undefined,
        parserOptions: {},
      },
    });
  });

  it('VALID: {rules: {"rule": ["error", {option: true}]}} => returns config with array rule', () => {
    const result = EslintConfigStub({
      rules: {
        'test-rule': ['error', { option: true }],
      },
    });

    expect(result).toStrictEqual({
      plugins: {},
      rules: { 'test-rule': ['error', { option: true }] },
      files: ['**/*.ts'],
      ignores: ['node_modules'],
      languageOptions: {
        globals: {},
        parser: undefined,
        parserOptions: {},
      },
    });
  });

  it('VALID: {files: ["*.ts"], ignores: ["dist/"]} => returns config with custom patterns', () => {
    const result = EslintConfigStub({
      files: ['*.ts', '*.tsx'],
      ignores: ['dist/', 'build/'],
    });

    expect(result).toStrictEqual({
      plugins: {},
      rules: {},
      files: ['*.ts', '*.tsx'],
      ignores: ['dist/', 'build/'],
      languageOptions: {
        globals: {},
        parser: undefined,
        parserOptions: {},
      },
    });
  });

  it('INVALID_RULE: {rules: {"test": "invalid"}} => throws ZodError', () => {
    expect(() => {
      eslintConfigContract.parse({
        plugins: {},
        rules: {
          test: 'invalid' as never,
        },
        files: ['**/*.ts'],
        ignores: ['node_modules'],
        languageOptions: {
          globals: {},
          parserOptions: {},
        },
      });
    }).toThrow('Invalid input');
  });

  it('INVALID_FILES: {files: [""]} => throws ZodError for empty string', () => {
    expect(() => {
      EslintConfigStub({
        files: [''],
      });
    }).toThrow('String must contain at least 1 character(s)');
  });
});
