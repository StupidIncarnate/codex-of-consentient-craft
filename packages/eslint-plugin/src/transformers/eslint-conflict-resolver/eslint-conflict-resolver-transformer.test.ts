import { eslintConflictResolverTransformer } from './eslint-conflict-resolver-transformer';
import { EslintConfigStub } from '../../contracts/eslint-config/eslint-config.stub';

describe('eslintConflictResolverTransformer', () => {
  describe('conflict resolution', () => {
    it('VALID: {reference with no-unused-vars, overrides with @typescript-eslint/no-unused-vars} => turns off ESLint rule', () => {
      const reference = EslintConfigStub({
        plugins: { eslint: 'eslint' },
        rules: {
          'no-unused-vars': 'error',
          'no-console': 'warn',
        },
      });

      const overrides = [
        EslintConfigStub({
          plugins: { '@typescript-eslint': 'typescript-eslint-plugin' },
          rules: {
            '@typescript-eslint/no-unused-vars': 'error',
          },
        }),
      ];

      const result = eslintConflictResolverTransformer({
        reference,
        overrides,
      });

      expect(result).toStrictEqual({
        plugins: {
          eslint: 'eslint',
          '@typescript-eslint': 'typescript-eslint-plugin',
        },
        rules: {
          'no-unused-vars': 'off',
          'no-console': 'warn',
          '@typescript-eslint/no-unused-vars': 'error',
        },
      });
    });

    it('VALID: {multiple conflicting rules} => turns off all conflicting ESLint rules', () => {
      const reference = EslintConfigStub({
        plugins: { eslint: 'eslint' },
        rules: {
          'no-unused-vars': 'error',
          'no-use-before-define': 'error',
          'dot-notation': 'error',
          'no-console': 'warn',
        },
      });

      const overrides = [
        EslintConfigStub({
          plugins: { '@typescript-eslint': 'typescript-eslint-plugin' },
          rules: {
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-use-before-define': 'error',
            '@typescript-eslint/dot-notation': 'error',
          },
        }),
      ];

      const result = eslintConflictResolverTransformer({
        reference,
        overrides,
      });

      expect(result).toStrictEqual({
        plugins: {
          eslint: 'eslint',
          '@typescript-eslint': 'typescript-eslint-plugin',
        },
        rules: {
          'no-unused-vars': 'off',
          'no-use-before-define': 'off',
          'dot-notation': 'off',
          'no-console': 'warn',
          '@typescript-eslint/no-unused-vars': 'error',
          '@typescript-eslint/no-use-before-define': 'error',
          '@typescript-eslint/dot-notation': 'error',
        },
      });
    });

    it('VALID: {multiple override plugins} => later overrides win over earlier ones', () => {
      const reference = EslintConfigStub({
        plugins: { eslint: 'eslint' },
        rules: {
          'no-unused-vars': 'error',
          camelcase: 'error',
        },
      });

      const overrides = [
        EslintConfigStub({
          plugins: { '@typescript-eslint': 'typescript-eslint-plugin' },
          rules: {
            '@typescript-eslint/no-unused-vars': 'error',
          },
        }),
        EslintConfigStub({
          plugins: { '@dungeonmaster': 'dungeonmaster-plugin' },
          rules: {
            '@dungeonmaster/camelcase': 'error',
            '@dungeonmaster/no-unused-vars': 'warn',
          },
        }),
      ];

      const result = eslintConflictResolverTransformer({
        reference,
        overrides,
      });

      expect(result).toStrictEqual({
        plugins: {
          eslint: 'eslint',
          '@typescript-eslint': 'typescript-eslint-plugin',
          '@dungeonmaster': 'dungeonmaster-plugin',
        },
        rules: {
          'no-unused-vars': 'off',
          camelcase: 'off',
          '@typescript-eslint/no-unused-vars': 'error',
          '@dungeonmaster/camelcase': 'error',
          '@dungeonmaster/no-unused-vars': 'warn',
        },
      });
    });

    it('VALID: {no conflicting rules} => keeps all ESLint rules as-is', () => {
      const reference = EslintConfigStub({
        plugins: { eslint: 'eslint' },
        rules: {
          'no-console': 'error',
          'prefer-const': 'error',
        },
      });

      const overrides = [
        EslintConfigStub({
          plugins: { '@typescript-eslint': 'typescript-eslint-plugin' },
          rules: {
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
          },
        }),
      ];

      const result = eslintConflictResolverTransformer({
        reference,
        overrides,
      });

      expect(result).toStrictEqual({
        plugins: {
          eslint: 'eslint',
          '@typescript-eslint': 'typescript-eslint-plugin',
        },
        rules: {
          'no-console': 'error',
          'prefer-const': 'error',
          '@typescript-eslint/explicit-function-return-type': 'error',
          '@typescript-eslint/no-explicit-any': 'error',
        },
      });
    });

    it('VALID: {rule with complex configuration array} => preserves rule configuration', () => {
      const reference = EslintConfigStub({
        plugins: { eslint: 'eslint' },
        rules: {
          'no-unused-vars': [
            'error',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
            },
          ],
        },
      });

      const overrides = [
        EslintConfigStub({
          plugins: { '@typescript-eslint': 'typescript-eslint-plugin' },
          rules: {
            '@typescript-eslint/no-unused-vars': [
              'error',
              {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
              },
            ],
          },
        }),
      ];

      const result = eslintConflictResolverTransformer({
        reference,
        overrides,
      });

      expect(result).toStrictEqual({
        plugins: {
          eslint: 'eslint',
          '@typescript-eslint': 'typescript-eslint-plugin',
        },
        rules: {
          'no-unused-vars': 'off',
          '@typescript-eslint/no-unused-vars': [
            'error',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
              caughtErrorsIgnorePattern: '^_',
            },
          ],
        },
      });
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {reference with no rules, empty overrides} => returns empty config', () => {
      const reference = EslintConfigStub({
        plugins: {},
        rules: {},
      });

      const overrides: ReturnType<typeof EslintConfigStub>[] = [];

      const result = eslintConflictResolverTransformer({
        reference,
        overrides,
      });

      expect(result).toStrictEqual({
        plugins: {},
        rules: {},
      });
    });

    it('EDGE: {reference with rules, empty overrides} => returns reference unchanged', () => {
      const reference = EslintConfigStub({
        plugins: { eslint: 'eslint' },
        rules: {
          'no-console': 'error',
          'prefer-const': 'error',
        },
      });

      const overrides: ReturnType<typeof EslintConfigStub>[] = [];

      const result = eslintConflictResolverTransformer({
        reference,
        overrides,
      });

      expect(result).toStrictEqual({
        plugins: { eslint: 'eslint' },
        rules: {
          'no-console': 'error',
          'prefer-const': 'error',
        },
      });
    });

    it('VALID: {plugin rule without slash} => ignores non-plugin rules', () => {
      const reference = EslintConfigStub({
        plugins: { eslint: 'eslint' },
        rules: {
          'no-console': 'error',
        },
      });

      const overrides = [
        EslintConfigStub({
          plugins: { custom: 'custom-plugin' },
          rules: {
            'standalone-rule': 'error',
            'no-console': 'warn',
          },
        }),
      ];

      const result = eslintConflictResolverTransformer({
        reference,
        overrides,
      });

      expect(result).toStrictEqual({
        plugins: {
          eslint: 'eslint',
          custom: 'custom-plugin',
        },
        rules: {
          'no-console': 'warn',
          'standalone-rule': 'error',
        },
      });
    });

    it('VALID: {override rule not in reference} => adds override rule without conflict', () => {
      const reference = EslintConfigStub({
        plugins: { eslint: 'eslint' },
        rules: {
          'no-console': 'error',
        },
      });

      const overrides = [
        EslintConfigStub({
          plugins: { '@typescript-eslint': 'typescript-eslint-plugin' },
          rules: {
            '@typescript-eslint/no-unused-vars': 'error',
          },
        }),
      ];

      const result = eslintConflictResolverTransformer({
        reference,
        overrides,
      });

      expect(result).toStrictEqual({
        plugins: {
          eslint: 'eslint',
          '@typescript-eslint': 'typescript-eslint-plugin',
        },
        rules: {
          'no-console': 'error',
          '@typescript-eslint/no-unused-vars': 'error',
        },
      });
    });
  });
});
