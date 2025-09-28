import { mergeConfigsTransformer } from './merge-configs-transformer';

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
      const singleConfig = {
        plugins: { test: {} },
        rules: { 'test-rule': 'error' as const },
      };

      const result = mergeConfigsTransformer({ configs: [singleConfig] });

      expect(result).toStrictEqual({
        plugins: { test: {} },
        rules: { 'test-rule': 'error' },
        languageOptions: {},
        files: [],
        ignores: [],
      });
    });

    it('VALID: {configs: [config1, config2]} => returns merged configs with combined properties', () => {
      const config1 = {
        plugins: { plugin1: {} },
        rules: { rule1: 'error' as const },
        files: ['*.ts'],
      };
      const config2 = {
        plugins: { plugin2: {} },
        rules: { rule2: 'warn' as const },
        ignores: ['dist/'],
      };

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: { plugin1: {}, plugin2: {} },
        rules: { rule1: 'error', rule2: 'warn' },
        languageOptions: {},
        files: ['*.ts'],
        ignores: ['dist/'],
      });
    });

    it('VALID: {configs: [overlappingConfigs]} => returns merged with later config overriding earlier', () => {
      const config1 = {
        plugins: { shared: { version: 1 } },
        rules: { 'shared-rule': 'warn' as const },
      };
      const config2 = {
        plugins: { shared: { version: 2 } },
        rules: { 'shared-rule': 'error' as const },
      };

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: { shared: { version: 2 } },
        rules: { 'shared-rule': 'error' },
        languageOptions: {},
        files: [],
        ignores: [],
      });
    });

    it('VALID: {configs: [configWithLanguageOptions]} => returns merged with language options', () => {
      const config1 = {
        languageOptions: {
          parser: { name: 'typescript' },
          parserOptions: { ecmaVersion: 2020 },
        },
      };
      const config2 = {
        languageOptions: {
          globals: { window: true },
        },
      };

      const result = mergeConfigsTransformer({ configs: [config1, config2] });

      expect(result).toStrictEqual({
        plugins: {},
        rules: {},
        languageOptions: {
          parser: { name: 'typescript' },
          parserOptions: { ecmaVersion: 2020 },
          globals: { window: true },
        },
        files: [],
        ignores: [],
      });
    });

    it('VALID: {configs: [multipleFilesAndIgnores]} => returns merged arrays', () => {
      const config1 = {
        files: ['*.ts', '*.tsx'],
        ignores: ['dist/', 'build/'],
      };
      const config2 = {
        files: ['*.js'],
        ignores: ['node_modules/'],
      };

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
