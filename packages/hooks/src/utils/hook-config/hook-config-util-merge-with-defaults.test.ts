import { hookConfigUtilMergeWithDefaults } from './hook-config-util-merge-with-defaults';
import type { PreEditLintConfig } from '../../types/config-type';

describe('hookConfigUtilMergeWithDefaults', () => {
  describe('valid input', () => {
    it('VALID: {config: {rules: ["custom-rule"]}} => returns config with custom rules', () => {
      const config: PreEditLintConfig = {
        rules: ['custom-rule'],
      };

      const result = hookConfigUtilMergeWithDefaults({ config });

      expect(result).toStrictEqual({
        rules: ['custom-rule'],
      });
    });

    it('VALID: {config: {rules: []}} => returns empty rules array', () => {
      const config: PreEditLintConfig = {
        rules: [],
      };

      const result = hookConfigUtilMergeWithDefaults({ config });

      expect(result).toStrictEqual({
        rules: [],
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {config: {}} => returns default rules', () => {
      const config = {} as PreEditLintConfig;

      const result = hookConfigUtilMergeWithDefaults({ config });

      expect(result).toStrictEqual({
        rules: [
          '@typescript-eslint/no-explicit-any',
          '@typescript-eslint/ban-ts-comment',
          'eslint-comments/no-use',
        ],
      });
    });
  });
});
