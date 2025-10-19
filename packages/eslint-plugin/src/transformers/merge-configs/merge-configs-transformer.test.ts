import { mergeConfigsTransformer } from './merge-configs-transformer';
import { EslintConfigStub } from '../../contracts/eslint-config/eslint-config.stub';

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
      const singleConfig = EslintConfigStub({
        plugins: { test: {} },
        rules: { 'test-rule': 'error' },
      });

      const result = mergeConfigsTransformer({ configs: [singleConfig] });

      expect(result).toStrictEqual({
        plugins: { test: {} },
        rules: { 'test-rule': 'error' },
        languageOptions: {
          globals: {},
          parser: undefined,
          parserOptions: {},
        },
        files: ['**/*.ts'],
        ignores: ['node_modules'],
      });
    });

    it('VALID: {configs: [config1, config2]} => returns merged configs with combined properties', () => {
      const config1 = EslintConfigStub({
        plugins: { plugin1: {} },
        rules: { rule1: 'error' },
        files: ['*.ts'],
      });
      const config2 = EslintConfigStub({
        plugins: { plugin2: {} },
        rules: { rule2: 'warn' },
        ignores: ['dist/'],
      });

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: { plugin1: {}, plugin2: {} },
        rules: { rule1: 'error', rule2: 'warn' },
        languageOptions: {
          globals: {},
          parser: undefined,
          parserOptions: {},
        },
        files: ['*.ts', '**/*.ts'],
        ignores: ['node_modules', 'dist/'],
      });
    });

    it('VALID: {configs: [overlappingConfigs]} => returns merged with later config overriding earlier', () => {
      const config1 = EslintConfigStub({
        plugins: { shared: { version: 1 } },
        rules: { 'shared-rule': 'warn' },
      });
      const config2 = EslintConfigStub({
        plugins: { shared: { version: 2 } },
        rules: { 'shared-rule': 'error' },
      });

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: { shared: { version: 2 } },
        rules: { 'shared-rule': 'error' },
        languageOptions: {
          globals: {},
          parser: undefined,
          parserOptions: {},
        },
        files: ['**/*.ts', '**/*.ts'],
        ignores: ['node_modules', 'node_modules'],
      });
    });

    it('VALID: {configs: [configWithLanguageOptions]} => returns merged with language options', () => {
      const config1 = EslintConfigStub({
        languageOptions: {
          parser: { name: 'typescript' },
          parserOptions: { ecmaVersion: 2020 },
        },
      });
      const config2 = EslintConfigStub({
        languageOptions: {
          globals: { window: true },
        },
      });

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: {},
        rules: {},
        languageOptions: {
          parser: { name: 'typescript' },
          parserOptions: { ecmaVersion: 2020 },
          globals: { window: true },
        },
        files: ['**/*.ts', '**/*.ts'],
        ignores: ['node_modules', 'node_modules'],
      });
    });

    it('VALID: {configs: [multipleFilesAndIgnores]} => returns merged arrays', () => {
      const config1 = EslintConfigStub({
        files: ['*.ts', '*.tsx'],
        ignores: ['dist/', 'build/'],
      });
      const config2 = EslintConfigStub({
        files: ['*.js'],
        ignores: ['node_modules/'],
      });

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: {},
        rules: {},
        languageOptions: {
          globals: {},
          parser: undefined,
          parserOptions: {},
        },
        files: ['*.ts', '*.tsx', '*.js'],
        ignores: ['dist/', 'build/', 'node_modules/'],
      });
    });
  });
});
