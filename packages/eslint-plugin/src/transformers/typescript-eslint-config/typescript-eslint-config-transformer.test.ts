import { typescriptEslintConfigTransformer } from './typescript-eslint-config-transformer';
import { typescriptEslintEslintPlugin } from '../../adapters/typescript-eslint-eslint-plugin/typescript-eslint-eslint-plugin';

jest.mock('../../adapters/typescript-eslint-eslint-plugin/typescript-eslint-eslint-plugin');

const mockTypescriptEslintEslintPlugin = jest.mocked(typescriptEslintEslintPlugin);

describe('typescriptEslintConfigTransformer', () => {
  beforeEach(() => {
    mockTypescriptEslintEslintPlugin.configs = { recommended: {} };
  });

  describe('forTesting parameter', () => {
    it('VALID: {forTesting: false} => returns config with strict testing rules as errors', () => {
      const result = typescriptEslintConfigTransformer({ forTesting: false });

      expect(result).toStrictEqual({
        plugins: {
          '@typescript-eslint': mockTypescriptEslintEslintPlugin,
        },
        rules: {
          '@typescript-eslint/adjacent-overload-signatures': 'error',
          '@typescript-eslint/array-type': 'error',
          '@typescript-eslint/await-thenable': 'error',
          '@typescript-eslint/ban-ts-comment': [
            'error',
            {
              'ts-expect-error': true,
              'ts-ignore': true,
              'ts-nocheck': true,
              'ts-check': true,
            },
          ],
          '@typescript-eslint/ban-tslint-comment': 'error',
          '@typescript-eslint/class-literal-property-style': 'error',
          '@typescript-eslint/class-methods-use-this': 'error',
          '@typescript-eslint/consistent-generic-constructors': 'error',
          '@typescript-eslint/consistent-indexed-object-style': 'error',
          '@typescript-eslint/consistent-return': 'error',
          '@typescript-eslint/consistent-type-assertions': 'error',
          '@typescript-eslint/consistent-type-definitions': 'error',
          '@typescript-eslint/consistent-type-exports': 'error',
          '@typescript-eslint/consistent-type-imports': 'error',
          '@typescript-eslint/default-param-last': 'error',
          '@typescript-eslint/dot-notation': 'error',
          '@typescript-eslint/explicit-function-return-type': [
            'error',
            {
              allowExpressions: true,
            },
          ],
          '@typescript-eslint/explicit-member-accessibility': 'error',
          '@typescript-eslint/explicit-module-boundary-types': [
            'error',
            {
              allowDirectConstAssertionInArrowFunctions: true,
            },
          ],
          '@typescript-eslint/init-declarations': 'error',
          '@typescript-eslint/max-params': 'off',
          '@typescript-eslint/member-ordering': 'error',
          '@typescript-eslint/method-signature-style': 'error',
          '@typescript-eslint/no-array-constructor': 'error',
          '@typescript-eslint/no-array-delete': 'error',
          '@typescript-eslint/no-base-to-string': 'error',
          '@typescript-eslint/no-confusing-non-null-assertion': 'error',
          '@typescript-eslint/no-confusing-void-expression': 'error',
          '@typescript-eslint/no-deprecated': 'error',
          '@typescript-eslint/no-dupe-class-members': 'error',
          '@typescript-eslint/no-duplicate-enum-values': 'error',
          '@typescript-eslint/no-duplicate-type-constituents': 'error',
          '@typescript-eslint/no-dynamic-delete': 'error',
          '@typescript-eslint/no-empty-function': 'error',
          '@typescript-eslint/no-empty-object-type': [
            'error',
            {
              allowInterfaces: 'always',
              allowObjectTypes: 'always',
              allowWithName: '^[A-Z]',
            },
          ],
          '@typescript-eslint/no-explicit-any': 'error',
          '@typescript-eslint/no-extra-non-null-assertion': 'error',
          '@typescript-eslint/no-extraneous-class': 'error',
          '@typescript-eslint/no-floating-promises': 'error',
          '@typescript-eslint/no-for-in-array': 'error',
          '@typescript-eslint/no-implied-eval': 'error',
          '@typescript-eslint/no-import-type-side-effects': 'error',
          '@typescript-eslint/no-inferrable-types': 'error',
          '@typescript-eslint/no-invalid-this': 'off',
          '@typescript-eslint/no-invalid-void-type': 'error',
          '@typescript-eslint/no-loop-func': 'error',
          '@typescript-eslint/no-magic-numbers': [
            'error',
            {
              ignore: [-1, 0, 1],
              ignoreArrayIndexes: true,
              ignoreDefaultValues: true,
              ignoreClassFieldInitialValues: true,
              detectObjects: false,
              ignoreEnums: true,
              ignoreNumericLiteralTypes: true,
              ignoreReadonlyClassProperties: true,
              ignoreTypeIndexes: true,
            },
          ],
          '@typescript-eslint/no-meaningless-void-operator': 'error',
          '@typescript-eslint/no-misused-new': 'error',
          '@typescript-eslint/no-misused-promises': 'error',
          '@typescript-eslint/no-misused-spread': 'error',
          '@typescript-eslint/no-mixed-enums': 'error',
          '@typescript-eslint/no-namespace': 'error',
          '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
          '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
          '@typescript-eslint/no-non-null-assertion': 'error',
          '@typescript-eslint/no-redeclare': 'error',
          '@typescript-eslint/no-redundant-type-constituents': 'error',
          '@typescript-eslint/no-require-imports': 'off',
          '@typescript-eslint/no-restricted-imports': 'off',
          '@typescript-eslint/no-restricted-types': 'off',
          '@typescript-eslint/no-shadow': 'error',
          '@typescript-eslint/no-this-alias': 'error',
          '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
          '@typescript-eslint/no-unnecessary-condition': 'error',
          '@typescript-eslint/no-unnecessary-parameter-property-assignment': 'error',
          '@typescript-eslint/no-unnecessary-qualifier': 'error',
          '@typescript-eslint/no-unnecessary-template-expression': 'error',
          '@typescript-eslint/no-unnecessary-type-arguments': 'error',
          '@typescript-eslint/no-unnecessary-type-assertion': 'error',
          '@typescript-eslint/no-unnecessary-type-constraint': 'error',
          '@typescript-eslint/no-unnecessary-type-conversion': 'error',
          '@typescript-eslint/no-unnecessary-type-parameters': 'error',
          '@typescript-eslint/no-unsafe-argument': 'error',
          '@typescript-eslint/no-unsafe-assignment': 'error',
          '@typescript-eslint/no-unsafe-call': 'error',
          '@typescript-eslint/no-unsafe-declaration-merging': 'error',
          '@typescript-eslint/no-unsafe-enum-comparison': 'error',
          '@typescript-eslint/no-unsafe-function-type': 'error',
          '@typescript-eslint/no-unsafe-member-access': 'error',
          '@typescript-eslint/no-unsafe-return': 'error',
          '@typescript-eslint/no-unsafe-type-assertion': 'warn',
          '@typescript-eslint/no-unsafe-unary-minus': 'error',
          '@typescript-eslint/no-unused-expressions': 'error',
          '@typescript-eslint/no-unused-vars': [
            'error',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
              caughtErrorsIgnorePattern: '^_',
            },
          ],
          '@typescript-eslint/no-use-before-define': 'error',
          '@typescript-eslint/no-useless-constructor': 'error',
          '@typescript-eslint/no-useless-empty-export': 'error',
          '@typescript-eslint/no-wrapper-object-types': 'error',
          '@typescript-eslint/non-nullable-type-assertion-style': 'error',
          '@typescript-eslint/only-throw-error': 'error',
          '@typescript-eslint/parameter-properties': 'error',
          '@typescript-eslint/prefer-as-const': 'error',
          '@typescript-eslint/prefer-destructuring': 'error',
          '@typescript-eslint/prefer-enum-initializers': 'error',
          '@typescript-eslint/prefer-find': 'error',
          '@typescript-eslint/prefer-for-of': 'error',
          '@typescript-eslint/prefer-function-type': 'error',
          '@typescript-eslint/prefer-includes': 'error',
          '@typescript-eslint/prefer-literal-enum-member': 'error',
          '@typescript-eslint/prefer-namespace-keyword': 'error',
          '@typescript-eslint/prefer-nullish-coalescing': 'error',
          '@typescript-eslint/prefer-optional-chain': 'error',
          '@typescript-eslint/prefer-promise-reject-errors': 'error',
          '@typescript-eslint/prefer-readonly': 'error',
          '@typescript-eslint/prefer-reduce-type-parameter': 'error',
          '@typescript-eslint/prefer-regexp-exec': 'error',
          '@typescript-eslint/prefer-return-this-type': 'error',
          '@typescript-eslint/prefer-string-starts-ends-with': 'error',
          '@typescript-eslint/promise-function-async': 'error',
          '@typescript-eslint/related-getter-setter-pairs': 'error',
          '@typescript-eslint/require-array-sort-compare': 'error',
          '@typescript-eslint/require-await': 'error',
          '@typescript-eslint/restrict-plus-operands': 'error',
          '@typescript-eslint/restrict-template-expressions': 'error',
          '@typescript-eslint/return-await': 'error',
          '@typescript-eslint/strict-boolean-expressions': 'error',
          '@typescript-eslint/switch-exhaustiveness-check': 'error',
          '@typescript-eslint/triple-slash-reference': 'error',
          '@typescript-eslint/unbound-method': 'error',
          '@typescript-eslint/unified-signatures': 'error',
          '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
        },
      });
    });

    it('VALID: {forTesting: true} => returns config with testing rules disabled', () => {
      const result = typescriptEslintConfigTransformer({ forTesting: true });

      expect(result).toStrictEqual({
        plugins: {
          '@typescript-eslint': mockTypescriptEslintEslintPlugin,
        },
        rules: {
          '@typescript-eslint/adjacent-overload-signatures': 'error',
          '@typescript-eslint/array-type': 'error',
          '@typescript-eslint/await-thenable': 'error',
          '@typescript-eslint/ban-ts-comment': [
            'error',
            {
              'ts-expect-error': true,
              'ts-ignore': true,
              'ts-nocheck': true,
              'ts-check': true,
            },
          ],
          '@typescript-eslint/ban-tslint-comment': 'error',
          '@typescript-eslint/class-literal-property-style': 'error',
          '@typescript-eslint/class-methods-use-this': 'error',
          '@typescript-eslint/consistent-generic-constructors': 'error',
          '@typescript-eslint/consistent-indexed-object-style': 'error',
          '@typescript-eslint/consistent-return': 'error',
          '@typescript-eslint/consistent-type-assertions': 'error',
          '@typescript-eslint/consistent-type-definitions': 'error',
          '@typescript-eslint/consistent-type-exports': 'error',
          '@typescript-eslint/consistent-type-imports': 'error',
          '@typescript-eslint/default-param-last': 'error',
          '@typescript-eslint/dot-notation': 'error',
          '@typescript-eslint/explicit-function-return-type': [
            'error',
            {
              allowExpressions: true,
            },
          ],
          '@typescript-eslint/explicit-member-accessibility': 'error',
          '@typescript-eslint/explicit-module-boundary-types': [
            'error',
            {
              allowDirectConstAssertionInArrowFunctions: true,
            },
          ],
          '@typescript-eslint/init-declarations': 'error',
          '@typescript-eslint/max-params': 'off',
          '@typescript-eslint/member-ordering': 'error',
          '@typescript-eslint/method-signature-style': 'error',
          '@typescript-eslint/no-array-constructor': 'error',
          '@typescript-eslint/no-array-delete': 'error',
          '@typescript-eslint/no-base-to-string': 'error',
          '@typescript-eslint/no-confusing-non-null-assertion': 'error',
          '@typescript-eslint/no-confusing-void-expression': 'error',
          '@typescript-eslint/no-deprecated': 'error',
          '@typescript-eslint/no-dupe-class-members': 'error',
          '@typescript-eslint/no-duplicate-enum-values': 'error',
          '@typescript-eslint/no-duplicate-type-constituents': 'error',
          '@typescript-eslint/no-dynamic-delete': 'error',
          '@typescript-eslint/no-empty-function': 'error',
          '@typescript-eslint/no-empty-object-type': [
            'error',
            {
              allowInterfaces: 'always',
              allowObjectTypes: 'always',
              allowWithName: '^[A-Z]',
            },
          ],
          '@typescript-eslint/no-explicit-any': 'error',
          '@typescript-eslint/no-extra-non-null-assertion': 'error',
          '@typescript-eslint/no-extraneous-class': 'error',
          '@typescript-eslint/no-floating-promises': 'error',
          '@typescript-eslint/no-for-in-array': 'error',
          '@typescript-eslint/no-implied-eval': 'error',
          '@typescript-eslint/no-import-type-side-effects': 'error',
          '@typescript-eslint/no-inferrable-types': 'error',
          '@typescript-eslint/no-invalid-this': 'off',
          '@typescript-eslint/no-invalid-void-type': 'error',
          '@typescript-eslint/no-loop-func': 'error',
          '@typescript-eslint/no-magic-numbers': 'off',
          '@typescript-eslint/no-meaningless-void-operator': 'error',
          '@typescript-eslint/no-misused-new': 'error',
          '@typescript-eslint/no-misused-promises': 'error',
          '@typescript-eslint/no-misused-spread': 'error',
          '@typescript-eslint/no-mixed-enums': 'error',
          '@typescript-eslint/no-namespace': 'error',
          '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
          '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
          '@typescript-eslint/no-non-null-assertion': 'error',
          '@typescript-eslint/no-redeclare': 'error',
          '@typescript-eslint/no-redundant-type-constituents': 'error',
          '@typescript-eslint/no-require-imports': 'off',
          '@typescript-eslint/no-restricted-imports': 'off',
          '@typescript-eslint/no-restricted-types': 'off',
          '@typescript-eslint/no-shadow': 'error',
          '@typescript-eslint/no-this-alias': 'error',
          '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
          '@typescript-eslint/no-unnecessary-condition': 'error',
          '@typescript-eslint/no-unnecessary-parameter-property-assignment': 'error',
          '@typescript-eslint/no-unnecessary-qualifier': 'error',
          '@typescript-eslint/no-unnecessary-template-expression': 'error',
          '@typescript-eslint/no-unnecessary-type-arguments': 'error',
          '@typescript-eslint/no-unnecessary-type-assertion': 'error',
          '@typescript-eslint/no-unnecessary-type-constraint': 'error',
          '@typescript-eslint/no-unnecessary-type-conversion': 'error',
          '@typescript-eslint/no-unnecessary-type-parameters': 'error',
          '@typescript-eslint/no-unsafe-argument': 'error',
          '@typescript-eslint/no-unsafe-assignment': 'off',
          '@typescript-eslint/no-unsafe-call': 'error',
          '@typescript-eslint/no-unsafe-declaration-merging': 'error',
          '@typescript-eslint/no-unsafe-enum-comparison': 'error',
          '@typescript-eslint/no-unsafe-function-type': 'error',
          '@typescript-eslint/no-unsafe-member-access': 'error',
          '@typescript-eslint/no-unsafe-return': 'error',
          '@typescript-eslint/no-unsafe-type-assertion': 'warn',
          '@typescript-eslint/no-unsafe-unary-minus': 'error',
          '@typescript-eslint/no-unused-expressions': 'error',
          '@typescript-eslint/no-unused-vars': [
            'error',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
              caughtErrorsIgnorePattern: '^_',
            },
          ],
          '@typescript-eslint/no-use-before-define': 'error',
          '@typescript-eslint/no-useless-constructor': 'error',
          '@typescript-eslint/no-useless-empty-export': 'error',
          '@typescript-eslint/no-wrapper-object-types': 'error',
          '@typescript-eslint/non-nullable-type-assertion-style': 'error',
          '@typescript-eslint/only-throw-error': 'error',
          '@typescript-eslint/parameter-properties': 'error',
          '@typescript-eslint/prefer-as-const': 'error',
          '@typescript-eslint/prefer-destructuring': 'error',
          '@typescript-eslint/prefer-enum-initializers': 'error',
          '@typescript-eslint/prefer-find': 'error',
          '@typescript-eslint/prefer-for-of': 'error',
          '@typescript-eslint/prefer-function-type': 'error',
          '@typescript-eslint/prefer-includes': 'error',
          '@typescript-eslint/prefer-literal-enum-member': 'error',
          '@typescript-eslint/prefer-namespace-keyword': 'error',
          '@typescript-eslint/prefer-nullish-coalescing': 'error',
          '@typescript-eslint/prefer-optional-chain': 'error',
          '@typescript-eslint/prefer-promise-reject-errors': 'error',
          '@typescript-eslint/prefer-readonly': 'error',
          '@typescript-eslint/prefer-reduce-type-parameter': 'error',
          '@typescript-eslint/prefer-regexp-exec': 'error',
          '@typescript-eslint/prefer-return-this-type': 'error',
          '@typescript-eslint/prefer-string-starts-ends-with': 'error',
          '@typescript-eslint/promise-function-async': 'error',
          '@typescript-eslint/related-getter-setter-pairs': 'error',
          '@typescript-eslint/require-array-sort-compare': 'error',
          '@typescript-eslint/require-await': 'error',
          '@typescript-eslint/restrict-plus-operands': 'error',
          '@typescript-eslint/restrict-template-expressions': 'error',
          '@typescript-eslint/return-await': 'error',
          '@typescript-eslint/strict-boolean-expressions': 'error',
          '@typescript-eslint/switch-exhaustiveness-check': 'error',
          '@typescript-eslint/triple-slash-reference': 'error',
          '@typescript-eslint/unbound-method': 'error',
          '@typescript-eslint/unified-signatures': 'error',
          '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
        },
      });
    });

    it('VALID: {} => returns config with default forTesting=false behavior', () => {
      const result = typescriptEslintConfigTransformer({});

      expect(result.rules?.['@typescript-eslint/no-magic-numbers']).toStrictEqual([
        'error',
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreClassFieldInitialValues: true,
          detectObjects: false,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ]);
      expect(result.rules?.['@typescript-eslint/no-unsafe-assignment']).toBe('error');
    });

    it('VALID: no params => returns config with default forTesting=false behavior', () => {
      const result = typescriptEslintConfigTransformer();

      expect(result.rules?.['@typescript-eslint/no-magic-numbers']).toStrictEqual([
        'error',
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreClassFieldInitialValues: true,
          detectObjects: false,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ]);
      expect(result.rules?.['@typescript-eslint/no-unsafe-assignment']).toBe('error');
    });
  });

  describe('plugins structure', () => {
    it('VALID: {forTesting: false} => returns plugins with mocked typescriptEslintEslintPlugin', () => {
      const result = typescriptEslintConfigTransformer({ forTesting: false });

      expect(result.plugins).toStrictEqual({
        '@typescript-eslint': mockTypescriptEslintEslintPlugin,
      });
    });

    it('VALID: {forTesting: true} => returns plugins with mocked typescriptEslintEslintPlugin', () => {
      const result = typescriptEslintConfigTransformer({ forTesting: true });

      expect(result.plugins).toStrictEqual({
        '@typescript-eslint': mockTypescriptEslintEslintPlugin,
      });
    });
  });

  describe('sample rule verification', () => {
    it('VALID: {forTesting: false} => returns config with core TypeScript rules configured', () => {
      const result = typescriptEslintConfigTransformer({ forTesting: false });

      expect(result.rules?.['@typescript-eslint/no-explicit-any']).toBe('error');
      expect(result.rules?.['@typescript-eslint/consistent-type-imports']).toBe('error');
      expect(result.rules?.['@typescript-eslint/explicit-function-return-type']).toStrictEqual([
        'error',
        {
          allowExpressions: true,
        },
      ]);
      expect(result.rules?.['@typescript-eslint/no-unused-vars']).toStrictEqual([
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ]);
    });

    it('VALID: {forTesting: true} => returns config with core TypeScript rules unchanged', () => {
      const result = typescriptEslintConfigTransformer({ forTesting: true });

      expect(result.rules?.['@typescript-eslint/no-explicit-any']).toBe('error');
      expect(result.rules?.['@typescript-eslint/consistent-type-imports']).toBe('error');
      expect(result.rules?.['@typescript-eslint/explicit-function-return-type']).toStrictEqual([
        'error',
        {
          allowExpressions: true,
        },
      ]);
      expect(result.rules?.['@typescript-eslint/no-unused-vars']).toStrictEqual([
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ]);
    });

    it('VALID: {forTesting: false} => returns config with disabled rules set to off', () => {
      const result = typescriptEslintConfigTransformer({ forTesting: false });

      expect(result.rules?.['@typescript-eslint/no-invalid-this']).toBe('off');
      expect(result.rules?.['@typescript-eslint/no-restricted-imports']).toBe('off');
      expect(result.rules?.['@typescript-eslint/no-restricted-types']).toBe('off');
    });
  });
});
