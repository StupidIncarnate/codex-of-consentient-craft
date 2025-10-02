import { mergeWithDefaults } from './merge-with-defaults';
import type { PreEditLintConfig } from '../../types/config-type';

describe('mergeWithDefaults', () => {
  describe('valid input', () => {
    it('VALID: {config: {rules: ["custom-rule"]}} => returns config with custom rules', () => {
      const config: PreEditLintConfig = {
        rules: ['custom-rule'],
      };

      const result = mergeWithDefaults({ config });

      expect(result).toStrictEqual({
        rules: ['custom-rule'],
      });
    });

    it('VALID: {config: {rules: []}} => returns empty rules array', () => {
      const config: PreEditLintConfig = {
        rules: [],
      };

      const result = mergeWithDefaults({ config });

      expect(result).toStrictEqual({
        rules: [],
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {config: {rules: []}} with empty array => returns default rules', () => {
      // When config has empty rules array, mergeWithDefaults should return defaults
      // This test was originally testing undefined rules, but that violates the type contract
      const config: PreEditLintConfig = {
        rules: [],
      };

      const result = mergeWithDefaults({ config });

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
