import { eslintConfigFilterTransformer } from './eslint-config-filter-transformer';
import { PreEditLintConfigStub } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config.stub';
import { LinterConfigStub } from '../../contracts/linter-config/linter-config.stub';
import { RawEslintConfigStub } from '../../contracts/raw-eslint-config/raw-eslint-config.stub';

describe('eslintConfigFilterTransformer', () => {
  describe('valid input', () => {
    it('VALID: {eslintConfig with rules, hookConfig} => returns filtered config', () => {
      const eslintConfig = LinterConfigStub({
        rules: {
          'no-unused-vars': 'error',
          'no-console': 'warn',
          'prefer-const': 'error',
        },
      });
      const hookConfig = PreEditLintConfigStub({
        rules: ['no-unused-vars', 'no-console'],
      });

      const result = eslintConfigFilterTransformer({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: {
          'no-unused-vars': 'error',
          'no-console': 'warn',
        },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('VALID: {eslintConfig with matching rules, hookConfig} => includes matching rules only', () => {
      const eslintConfig = LinterConfigStub({
        rules: {
          'no-unused-vars': 'error',
          'prefer-const': 'error',
          'no-var': 'error',
        },
      });
      const hookConfig = PreEditLintConfigStub({
        rules: ['no-unused-vars'],
      });

      const result = eslintConfigFilterTransformer({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: {
          'no-unused-vars': 'error',
        },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('VALID: {eslintConfig with language property, hookConfig} => removes language property', () => {
      const eslintConfig = RawEslintConfigStub({
        rules: { 'no-unused-vars': 'error' },
        language: { fileType: 'text' },
      });
      const hookConfig = PreEditLintConfigStub({
        rules: ['no-unused-vars'],
      });

      const result = eslintConfigFilterTransformer({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: { 'no-unused-vars': 'error' },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {eslintConfig without rules, hookConfig} => returns config with empty rules', () => {
      const eslintConfig = LinterConfigStub({ rules: {} });
      const hookConfig = PreEditLintConfigStub({
        rules: ['no-unused-vars'],
      });

      const result = eslintConfigFilterTransformer({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: {},
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('EDGE: {eslintConfig with rules, hookConfig with no matching rules} => returns config with empty rules', () => {
      const eslintConfig = LinterConfigStub({
        rules: {
          'no-unused-vars': 'error',
          'no-console': 'warn',
        },
      });
      const hookConfig = PreEditLintConfigStub({
        rules: ['prefer-const'],
      });

      const result = eslintConfigFilterTransformer({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: {},
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('EDGE: {eslintConfig with undefined rules property, hookConfig} => returns config with empty rules', () => {
      const eslintConfig = LinterConfigStub({ rules: {} });
      const hookConfig = PreEditLintConfigStub({
        rules: ['no-unused-vars'],
      });

      const result = eslintConfigFilterTransformer({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: {},
        files: ['**/*.ts', '**/*.tsx'],
      });
    });
  });
});
