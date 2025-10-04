import { hookConfigMergeTransformer } from './hook-config-merge-transformer';
import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { preEditLintConfigContract } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';

describe('hookConfigMergeTransformer', () => {
  describe('valid input', () => {
    it('VALID: {config: {rules: ["custom-rule"]}} => returns config with custom rules', () => {
      const config: PreEditLintConfig = preEditLintConfigContract.parse({
        rules: ['custom-rule'],
      });

      const result = hookConfigMergeTransformer({ config });

      expect(result).toStrictEqual({
        rules: ['custom-rule'],
      });
    });

    it('VALID: {config: {rules: []}} => returns defaults array', () => {
      const config: PreEditLintConfig = preEditLintConfigContract.parse({
        rules: [],
      });

      const result = hookConfigMergeTransformer({ config });

      expect(result).toStrictEqual({
        rules: [
          '@typescript-eslint/no-explicit-any',
          '@typescript-eslint/ban-ts-comment',
          'eslint-comments/no-use',
        ],
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {config: {rules: []}} with empty array => returns default rules', () => {
      // When config has empty rules array, hookConfigMergeTransformer should return defaults
      // This test was originally testing undefined rules, but that violates the type contract
      const config: PreEditLintConfig = preEditLintConfigContract.parse({
        rules: [],
      });

      const result = hookConfigMergeTransformer({ config });

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
