import { eslintConfigFilterTransformer } from './eslint-config-filter-transformer';
import { PreEditLintConfigStub } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config.stub';
import { ruleNamesExtractTransformer } from '../rule-names-extract/rule-names-extract-transformer';

describe('eslintConfigFilterTransformer', () => {
  // Test helper
  const mockHookConfigUtilWithRules = (
    rules: string[],
  ): { mockReturnValue: (value: string[]) => void } => {
    return {
      mockReturnValue: (value: string[]) => {
        // Mock implementation using closure
        (ruleNamesExtractTransformer as unknown) = jest.fn().mockReturnValue(value);
      },
    };
  };

  describe('valid input', () => {
    it('VALID: {eslintConfig with rules, hookConfig} => returns filtered config', () => {
      mockHookConfigUtilWithRules(['no-unused-vars', 'no-console']);

      const eslintConfig: Linter.Config = {
        rules: {
          'no-unused-vars': 'error',
          'no-console': 'warn',
          'prefer-const': 'error',
        },
      };
      const hookConfig = preEditLintConfigContract.parse({
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
      mockHookConfigUtilWithRules(['no-unused-vars']);

      const eslintConfig: Linter.Config = {
        rules: {
          'no-unused-vars': 'error',
          'prefer-const': 'error',
          'no-var': 'error',
        },
      };
      const hookConfig = preEditLintConfigContract.parse({
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
      mockHookConfigUtilWithRules(['no-unused-vars']);

      const eslintConfig: Linter.Config = {
        rules: { 'no-unused-vars': 'error' },
        language: 'typescript',
      };
      const hookConfig = preEditLintConfigContract.parse({
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
      mockHookConfigUtilWithRules(['no-unused-vars']);

      const eslintConfig: Linter.Config = {};
      const hookConfig = preEditLintConfigContract.parse({
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
      mockHookConfigUtilWithRules(['prefer-const']);

      const eslintConfig: Linter.Config = {
        rules: {
          'no-unused-vars': 'error',
          'no-console': 'warn',
        },
      };
      const hookConfig = preEditLintConfigContract.parse({
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
      mockHookConfigUtilWithRules(['no-unused-vars']);

      const eslintConfig: Linter.Config = {};
      const hookConfig = preEditLintConfigContract.parse({
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
