import { rawEslintConfigToPartialTransformer } from './raw-eslint-config-to-partial-transformer';
import { RawEslintConfigStub } from '../../contracts/raw-eslint-config/raw-eslint-config.stub';

describe('rawEslintConfigToPartialTransformer', () => {
  describe('valid raw configs', () => {
    it('VALID: {rawConfig with rules} => extracts rules only', () => {
      const rawConfig = RawEslintConfigStub({
        rules: { 'no-console': 'error' },
        language: { fileType: 'text' },
        plugins: { typescript: {} },
      });

      const result = rawEslintConfigToPartialTransformer({ rawConfig });

      expect(result).toStrictEqual({
        rules: { 'no-console': 'error' },
      });
    });

    it('VALID: {rawConfig with empty rules} => extracts empty rules', () => {
      const rawConfig = RawEslintConfigStub({
        rules: {},
        language: { fileType: 'text' },
      });

      const result = rawEslintConfigToPartialTransformer({ rawConfig });

      expect(result).toStrictEqual({
        rules: {},
      });
    });

    it('VALID: {rawConfig with multiple rules} => extracts all rules', () => {
      const rawConfig = RawEslintConfigStub({
        rules: {
          'no-console': 'error',
          'no-unused-vars': 'warn',
          '@typescript-eslint/no-explicit-any': 'error',
        },
        language: { fileType: 'text' },
      });

      const result = rawEslintConfigToPartialTransformer({ rawConfig });

      expect(result).toStrictEqual({
        rules: {
          'no-console': 'error',
          'no-unused-vars': 'warn',
          '@typescript-eslint/no-explicit-any': 'error',
        },
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {rawConfig with no rules field} => returns empty config', () => {
      const rawConfig = RawEslintConfigStub({
        language: { fileType: 'text' },
      });
      Reflect.deleteProperty(rawConfig, 'rules');

      const result = rawEslintConfigToPartialTransformer({ rawConfig });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {rawConfig: null} => returns empty config', () => {
      const rawConfig: unknown = null;

      const result = rawEslintConfigToPartialTransformer({ rawConfig });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {rawConfig: string} => returns empty config', () => {
      const rawConfig: unknown = 'invalid';

      const result = rawEslintConfigToPartialTransformer({ rawConfig });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {rawConfig: undefined} => returns empty config', () => {
      const rawConfig: unknown = undefined;

      const result = rawEslintConfigToPartialTransformer({ rawConfig });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {rawConfig with rules: null} => returns empty config', () => {
      const rawConfig = RawEslintConfigStub();
      Reflect.set(rawConfig, 'rules', null);

      const result = rawEslintConfigToPartialTransformer({ rawConfig });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {rawConfig with rules: string} => returns empty config', () => {
      const rawConfig = RawEslintConfigStub();
      Reflect.set(rawConfig, 'rules', 'invalid');

      const result = rawEslintConfigToPartialTransformer({ rawConfig });

      expect(result).toStrictEqual({});
    });
  });
});
