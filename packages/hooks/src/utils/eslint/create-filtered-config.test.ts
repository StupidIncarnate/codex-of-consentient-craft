import { createFilteredConfig } from './create-filtered-config';
import { HookConfigUtil } from '../hook-config/hook-config-util';
import type { Linter } from 'eslint';

jest.mock('../hook-config/hook-config-util');

describe('createFilteredConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test helper
  const mockHookConfigUtilWithRules = (rules: string[]): void => {
    jest.mocked(HookConfigUtil.getRuleNames).mockReturnValue(rules);
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
      const hookConfig = {
        rules: ['no-unused-vars', 'no-console'],
      };

      const result = createFilteredConfig({
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
      const hookConfig = {
        rules: ['no-unused-vars'],
      };

      const result = createFilteredConfig({
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
      const hookConfig = {
        rules: ['no-unused-vars'],
      };

      const result = createFilteredConfig({
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
      const hookConfig = {
        rules: ['no-unused-vars'],
      };

      const result = createFilteredConfig({
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
      const hookConfig = {
        rules: ['prefer-const'],
      };

      const result = createFilteredConfig({
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
      const hookConfig = {
        rules: ['no-unused-vars'],
      };

      const result = createFilteredConfig({
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
