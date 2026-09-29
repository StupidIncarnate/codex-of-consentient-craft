import { eslintConfigFilterTransformer } from './eslint-config-filter-transformer';
import { PreEditLintConfigStub } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config.stub';
import { RawEslintConfigStub } from '../../contracts/raw-eslint-config/raw-eslint-config.stub';
import { FlatConfigStub } from '#gateway/npm/typescript-eslint__utils/flat-config/flat-config.stub';

describe('eslintConfigFilterTransformer', () => {
  describe('valid input', () => {
    it('VALID: {eslintConfig with rules, hookConfig} => returns filtered config', () => {
      const eslintConfig = FlatConfigStub({
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
      const eslintConfig = FlatConfigStub({
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
      const eslintConfig = FlatConfigStub({ rules: {} });
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
      const eslintConfig = FlatConfigStub({
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
      const eslintConfig = FlatConfigStub({ rules: {} });
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

  describe('pre-edit rules registered off by the host', () => {
    it("VALID: {pre-edit rule 'off'} => runs at 'error'", () => {
      const eslintConfig = FlatConfigStub({
        rules: { '@dungeonmaster/ban-jsx-outside-widgets-and-flows': 'off' },
      });
      const hookConfig = PreEditLintConfigStub({
        rules: ['@dungeonmaster/ban-jsx-outside-widgets-and-flows'],
      });

      const result = eslintConfigFilterTransformer({ eslintConfig, hookConfig });

      expect(result).toStrictEqual({
        rules: { '@dungeonmaster/ban-jsx-outside-widgets-and-flows': 'error' },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('VALID: {pre-edit rule severity 0} => runs at error', () => {
      const eslintConfig = FlatConfigStub({
        rules: { '@dungeonmaster/ban-jsx-outside-widgets-and-flows': 0 },
      });
      const hookConfig = PreEditLintConfigStub({
        rules: ['@dungeonmaster/ban-jsx-outside-widgets-and-flows'],
      });

      const result = eslintConfigFilterTransformer({ eslintConfig, hookConfig });

      expect(result).toStrictEqual({
        rules: { '@dungeonmaster/ban-jsx-outside-widgets-and-flows': 'error' },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it("VALID: {pre-edit rule ['off', options]} => runs at 'error' with the options kept", () => {
      const eslintConfig = FlatConfigStub({
        rules: {
          '@dungeonmaster/ban-jsx-outside-widgets-and-flows': [
            'off',
            { workspacePackageNames: ['shared', 'hooks'] },
          ],
        },
      });
      const hookConfig = PreEditLintConfigStub({
        rules: ['@dungeonmaster/ban-jsx-outside-widgets-and-flows'],
      });

      const result = eslintConfigFilterTransformer({ eslintConfig, hookConfig });

      expect(result).toStrictEqual({
        rules: {
          '@dungeonmaster/ban-jsx-outside-widgets-and-flows': [
            'error',
            { workspacePackageNames: ['shared', 'hooks'] },
          ],
        },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it("VALID: {pre-edit rule ['warn', options]} => host severity and options pass through", () => {
      const eslintConfig = FlatConfigStub({
        rules: { '@dungeonmaster/ban-jsx-outside-widgets-and-flows': ['warn', { a: 1 }] },
      });
      const hookConfig = PreEditLintConfigStub({
        rules: ['@dungeonmaster/ban-jsx-outside-widgets-and-flows'],
      });

      const result = eslintConfigFilterTransformer({ eslintConfig, hookConfig });

      expect(result).toStrictEqual({
        rules: { '@dungeonmaster/ban-jsx-outside-widgets-and-flows': ['warn', { a: 1 }] },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it("VALID: {rule not tagged pre-edit, host 'off'} => stays 'off'", () => {
      const eslintConfig = FlatConfigStub({ rules: { 'no-console': 'off' } });
      const hookConfig = PreEditLintConfigStub({ rules: ['no-console'] });

      const result = eslintConfigFilterTransformer({ eslintConfig, hookConfig });

      expect(result).toStrictEqual({
        rules: { 'no-console': 'off' },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('EMPTY: {pre-edit rule the host does not register} => omitted', () => {
      const eslintConfig = FlatConfigStub({ rules: { 'no-console': 'error' } });
      const hookConfig = PreEditLintConfigStub({
        rules: ['@dungeonmaster/ban-jsx-outside-widgets-and-flows'],
      });

      const result = eslintConfigFilterTransformer({ eslintConfig, hookConfig });

      expect(result).toStrictEqual({ rules: {}, files: ['**/*.ts', '**/*.tsx'] });
    });
  });
});
