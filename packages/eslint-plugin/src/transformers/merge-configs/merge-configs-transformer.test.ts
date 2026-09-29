import { mergeConfigsTransformer } from './merge-configs-transformer';
import { FlatConfigStub } from '#gateway/npm/typescript-eslint__utils/flat-config/flat-config.stub';

describe('mergeConfigsTransformer', () => {
  describe('merge()', () => {
    it('VALID: {configs: []} => returns empty config', () => {
      const result = mergeConfigsTransformer({ configs: [] });

      expect(result).toStrictEqual({
        plugins: {},
        rules: {},
        languageOptions: {},
        files: [],
        ignores: [],
      });
    });

    it('VALID: {configs: [singleConfig]} => returns single config merged', () => {
      const singleConfig = FlatConfigStub({
        plugins: { test: {} },
        rules: { 'test-rule': 'error' },
      });

      const result = mergeConfigsTransformer({ configs: [singleConfig] });

      expect(result).toStrictEqual({
        plugins: { test: {} },
        rules: { 'test-rule': 'error' },
        languageOptions: {},
        files: ['**/*.ts'],
        ignores: ['dist/**'],
      });
    });

    it('VALID: {configs: [config1, config2]} => returns merged configs with combined properties', () => {
      const config1 = FlatConfigStub({
        plugins: { plugin1: {} },
        rules: { rule1: 'error' },
        files: ['*.ts'],
        ignores: ['build/'],
      });
      const config2 = FlatConfigStub({
        plugins: { plugin2: {} },
        rules: { rule2: 'warn' },
        files: ['**/*.ts'],
        ignores: ['dist/'],
      });

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: { plugin1: {}, plugin2: {} },
        rules: { rule1: 'error', rule2: 'warn' },
        languageOptions: {},
        files: ['*.ts', '**/*.ts'],
        ignores: ['build/', 'dist/'],
      });
    });

    it('VALID: {configs: [overlappingConfigs]} => returns merged with later config overriding earlier', () => {
      const config1 = FlatConfigStub({
        plugins: { shared: { meta: { version: '1' } } },
        rules: { 'shared-rule': 'warn' },
      });
      const config2 = FlatConfigStub({
        plugins: { shared: { meta: { version: '2' } } },
        rules: { 'shared-rule': 'error' },
      });

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: { shared: { meta: { version: '2' } } },
        rules: { 'shared-rule': 'error' },
        languageOptions: {},
        files: ['**/*.ts', '**/*.ts'],
        ignores: ['dist/**', 'dist/**'],
      });
    });

    it('VALID: {configs: [configWithLanguageOptions]} => returns merged with language options', () => {
      const config1 = FlatConfigStub({
        rules: {},
        languageOptions: {
          ecmaVersion: 2020,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
      });
      const config2 = FlatConfigStub({
        rules: {},
        languageOptions: {
          globals: { window: true },
        },
      });

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: {},
        rules: {},
        languageOptions: {
          ecmaVersion: 2020,
          parserOptions: { ecmaFeatures: { jsx: true } },
          globals: { window: true },
        },
        files: ['**/*.ts', '**/*.ts'],
        ignores: ['dist/**', 'dist/**'],
      });
    });

    it('VALID: {configs: [multipleFilesAndIgnores]} => returns merged arrays', () => {
      const config1 = FlatConfigStub({
        rules: {},
        files: ['*.ts', '*.tsx'],
        ignores: ['dist/', 'build/'],
      });
      const config2 = FlatConfigStub({
        rules: {},
        files: ['*.js'],
        ignores: ['node_modules/'],
      });

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: {},
        rules: {},
        languageOptions: {},
        files: ['*.ts', '*.tsx', '*.js'],
        ignores: ['dist/', 'build/', 'node_modules/'],
      });
    });
  });
});
