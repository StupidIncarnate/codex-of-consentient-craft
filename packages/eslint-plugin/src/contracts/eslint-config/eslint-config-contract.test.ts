import { eslintConfigContract } from './eslint-config-contract';

describe('eslintConfigContract', () => {
  describe('parse()', () => {
    it('VALID: {} => returns EslintConfig', () => {
      const validConfig = {};

      const result = eslintConfigContract.parse(validConfig);

      expect(result).toStrictEqual({});
    });

    it('VALID: {plugins: {test: {}}, rules: {"test-rule": "error"}} => returns EslintConfig', () => {
      const validConfig = {
        plugins: {
          test: {},
        },
        rules: {
          'test-rule': 'error' as const,
        },
      };

      const result = eslintConfigContract.parse(validConfig);

      expect(result).toStrictEqual(validConfig);
    });

    it('VALID: {rules: {"rule": ["error", {option: true}]}} => returns EslintConfig', () => {
      const validConfig = {
        rules: {
          'test-rule': ['error' as const, { option: true }],
        },
      };

      const result = eslintConfigContract.parse(validConfig);

      expect(result).toStrictEqual(validConfig);
    });

    it('VALID: {languageOptions: {parser: {}, parserOptions: {ecmaVersion: 2020}}} => returns EslintConfig', () => {
      const validConfig = {
        languageOptions: {
          parser: {},
          parserOptions: {
            ecmaVersion: 2020,
          },
          globals: {
            window: true,
            document: false,
          },
        },
      };

      const result = eslintConfigContract.parse(validConfig);

      expect(result).toStrictEqual(validConfig);
    });

    it('VALID: {files: ["*.ts"], ignores: ["dist/"]} => returns EslintConfig', () => {
      const validConfig = {
        files: ['*.ts', '*.tsx'],
        ignores: ['dist/', 'node_modules/'],
      };

      const result = eslintConfigContract.parse(validConfig);

      expect(result).toStrictEqual(validConfig);
    });

    it('INVALID_RULE: {rules: {"test": "invalid"}} => throws ZodError', () => {
      const invalidConfig = {
        rules: {
          test: 'invalid',
        },
      };

      expect(() => {
        return eslintConfigContract.parse(invalidConfig);
      }).toThrow();
    });

    it('INVALID_FILES: {files: [123]} => throws ZodError', () => {
      const invalidConfig = {
        files: [123],
      };

      expect(() => {
        return eslintConfigContract.parse(invalidConfig);
      }).toThrow();
    });
  });
});
