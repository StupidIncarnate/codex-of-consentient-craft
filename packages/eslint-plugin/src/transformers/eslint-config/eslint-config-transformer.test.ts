import type { EslintConfig } from '../../contracts/eslint-config/eslint-config-contract';
import { eslintConfigTransformer } from './eslint-config-transformer';

describe('eslintConfigTransformer', () => {
  describe('forTesting parameter', () => {
    it("VALID: {forTesting: false} => returns config with 'new-cap' as 'error'", () => {
      const result = eslintConfigTransformer({ forTesting: false });

      expect(result.rules?.['new-cap']).toBe('error');
    });

    it("VALID: {forTesting: true} => returns config with 'new-cap' as 'off'", () => {
      const result = eslintConfigTransformer({ forTesting: true });

      expect(result.rules?.['new-cap']).toBe('off');
    });

    it("VALID: {} (no params) => returns config with default 'new-cap' as 'error'", () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['new-cap']).toBe('error');
    });
  });

  describe('plugins structure', () => {
    it('VALID: {} => returns config with empty plugins object', () => {
      const result = eslintConfigTransformer();

      expect(result.plugins).toStrictEqual({});
    });
  });

  describe('rules configuration', () => {
    it('VALID: {} => returns config with accessor-pairs as error', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['accessor-pairs']).toBe('error');
    });

    it('VALID: {} => returns config with array-callback-return as error', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['array-callback-return']).toBe('error');
    });

    it('VALID: {} => returns config with arrow-body-style configured', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['arrow-body-style']).toStrictEqual(['error', 'always']);
    });

    it('VALID: {} => returns config with camelcase as error', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.camelcase).toBe('error');
    });

    it('VALID: {} => returns config with complexity configured with max 10', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.complexity).toStrictEqual(['error', { max: 10 }]);
    });

    it('VALID: {} => returns config with eqeqeq as error', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.eqeqeq).toBe('error');
    });

    it('VALID: {} => returns config with func-style configured', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['func-style']).toStrictEqual([
        'error',
        'expression',
        { allowArrowFunctions: false },
      ]);
    });

    it('VALID: {} => returns config with id-length configured with min 2', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['id-length']).toStrictEqual(['error', { min: 2 }]);
    });

    it('VALID: {} => returns config with max-classes-per-file configured with max 1', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['max-classes-per-file']).toStrictEqual(['error', { max: 1 }]);
    });

    it('VALID: {} => returns config with max-depth configured with max 4', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['max-depth']).toStrictEqual(['error', { max: 4 }]);
    });

    it('VALID: {} => returns config with max-lines-per-function configured', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['max-lines-per-function']).toStrictEqual([
        'error',
        { max: 100, skipBlankLines: true, skipComments: true },
      ]);
    });

    it('VALID: {} => returns config with max-lines configured', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['max-lines']).toStrictEqual([
        'error',
        { max: 500, skipBlankLines: true, skipComments: true },
      ]);
    });

    it('VALID: {} => returns config with max-nested-callbacks configured with max 4', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['max-nested-callbacks']).toStrictEqual(['error', { max: 4 }]);
    });

    it('VALID: {} => returns config with max-params configured with max 1', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['max-params']).toStrictEqual(['error', { max: 1 }]);
    });

    it('VALID: {} => returns config with max-statements configured with max 20', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['max-statements']).toStrictEqual(['error', { max: 20 }]);
    });

    it('VALID: {} => returns config with no-console as error', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['no-console']).toBe('error');
    });

    it('VALID: {} => returns config with no-magic-numbers configured', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['no-magic-numbers']).toStrictEqual(['error']);
    });

    it('VALID: {} => returns config with no-var as error', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['no-var']).toBe('error');
    });

    it('VALID: {} => returns config with one-var configured with never', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['one-var']).toStrictEqual(['error', 'never']);
    });

    it('VALID: {} => returns config with prefer-const as error', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['prefer-const']).toBe('error');
    });

    it('VALID: {} => returns config with strict as error', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.strict).toBe('error');
    });

    it('VALID: {} => returns config with yoda as error', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.yoda).toBe('error');
    });

    it('VALID: {} => returns config with id-denylist as off', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['id-denylist']).toBe('off');
    });

    it('VALID: {} => returns config with prefer-exponentiation-operator as off', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['prefer-exponentiation-operator']).toBe('off');
    });

    it('VALID: {} => returns config with prefer-named-capture-group as off', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['prefer-named-capture-group']).toBe('off');
    });

    it('VALID: {} => returns config with no-restricted-exports as off', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['no-restricted-exports']).toBe('off');
    });

    it('VALID: {} => returns config with no-restricted-globals as off', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['no-restricted-globals']).toBe('off');
    });

    it('VALID: {} => returns config with no-restricted-imports as off', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['no-restricted-imports']).toBe('off');
    });

    it('VALID: {} => returns config with no-restricted-properties as off', () => {
      const result = eslintConfigTransformer();

      expect(result.rules?.['no-restricted-properties']).toBe('off');
    });
  });

  describe('complete config structure', () => {
    it('VALID: {forTesting: false} => returns complete config object with all properties', () => {
      const result: EslintConfig = eslintConfigTransformer({ forTesting: false });

      expect(result).toStrictEqual({
        plugins: {},
        rules: {
          'accessor-pairs': 'error',
          'array-callback-return': 'error',
          'arrow-body-style': ['error', 'always'],
          'block-scoped-var': 'error',
          camelcase: 'error',
          'capitalized-comments': 'error',
          'class-methods-use-this': 'error',
          complexity: ['error', { max: 10 }],
          'consistent-return': 'error',
          'consistent-this': 'error',
          'constructor-super': 'error',
          curly: 'error',
          'default-case': 'error',
          'default-case-last': 'error',
          'default-param-last': 'error',
          'dot-notation': 'error',
          eqeqeq: 'error',
          'for-direction': 'error',
          'func-name-matching': 'error',
          'func-names': 'error',
          'func-style': ['error', 'expression', { allowArrowFunctions: false }],
          'getter-return': 'error',
          'guard-for-in': 'error',
          'grouped-accessor-pairs': 'error',
          'id-denylist': 'off',
          'id-length': ['error', { min: 2 }],
          'id-match': 'error',
          'init-declarations': 'error',
          'logical-assignment-operators': 'error',
          'max-classes-per-file': ['error', { max: 1 }],
          'max-depth': ['error', { max: 4 }],
          'max-lines-per-function': [
            'error',
            { max: 100, skipBlankLines: true, skipComments: true },
          ],
          'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
          'max-nested-callbacks': ['error', { max: 4 }],
          'max-params': ['error', { max: 1 }],
          'max-statements': ['error', { max: 20 }],
          'new-cap': 'error',
          'no-alert': 'error',
          'no-array-constructor': 'error',
          'no-bitwise': 'error',
          'no-async-promise-executor': 'error',
          'no-await-in-loop': 'error',
          'no-caller': 'error',
          'no-case-declarations': 'error',
          'no-class-assign': 'error',
          'no-compare-neg-zero': 'error',
          'no-console': 'error',
          'no-continue': 'error',
          'no-cond-assign': 'error',
          'no-const-assign': 'error',
          'no-constant-binary-expression': 'error',
          'no-constant-condition': 'error',
          'no-constructor-return': 'error',
          'no-control-regex': 'error',
          'no-debugger': 'error',
          'no-delete-var': 'error',
          'no-div-regex': 'error',
          'no-dupe-args': 'error',
          'no-dupe-class-members': 'error',
          'no-dupe-else-if': 'error',
          'no-dupe-keys': 'error',
          'no-duplicate-case': 'error',
          'no-else-return': 'error',
          'no-empty': 'error',
          'no-empty-character-class': 'error',
          'no-empty-pattern': 'error',
          'no-empty-static-block': 'error',
          'no-empty-function': 'error',
          'no-eq-null': 'error',
          'no-eval': 'error',
          'no-ex-assign': 'error',
          'no-extend-native': 'error',
          'no-extra-bind': 'error',
          'no-extra-boolean-cast': 'error',
          'no-extra-label': 'error',
          'no-fallthrough': 'error',
          'no-func-assign': 'error',
          'no-global-assign': 'error',
          'no-implicit-globals': 'error',
          'no-implicit-coercion': 'error',
          'no-implied-eval': 'error',
          'no-import-assign': 'error',
          'no-inner-declarations': 'error',
          'no-invalid-regexp': 'error',
          'no-irregular-whitespace': 'error',
          'no-invalid-this': 'error',
          'no-iterator': 'error',
          'no-label-var': 'error',
          'no-labels': 'error',
          'no-lone-blocks': 'error',
          'no-lonely-if': 'error',
          'no-loop-func': 'error',
          'no-loss-of-precision': 'error',
          'no-magic-numbers': ['error'],
          'no-multi-assign': 'error',
          'no-misleading-character-class': 'error',
          'no-multi-str': 'error',
          'no-negated-condition': 'error',
          'no-nested-ternary': 'error',
          'no-new': 'error',
          'no-new-func': 'error',
          'no-new-native-nonconstructor': 'error',
          'no-new-wrappers': 'error',
          'no-nonoctal-decimal-escape': 'error',
          'no-object-constructor': 'error',
          'no-obj-calls': 'error',
          'no-octal': 'error',
          'no-octal-escape': 'error',
          'no-param-reassign': 'error',
          'no-plusplus': 'error',
          'no-proto': 'error',
          'no-promise-executor-return': 'error',
          'no-prototype-builtins': 'error',
          'no-regex-spaces': 'error',
          'no-redeclare': 'error',
          'no-restricted-exports': 'off',
          'no-restricted-globals': 'off',
          'no-restricted-imports': 'off',
          'no-restricted-properties': 'off',
          'no-return-assign': 'error',
          'no-script-url': 'error',
          'no-self-assign': 'error',
          'no-self-compare': 'error',
          'no-sequences': 'error',
          'no-shadow': 'error',
          'no-setter-return': 'error',
          'no-shadow-restricted-names': 'error',
          'no-sparse-arrays': 'error',
          'no-template-curly-in-string': 'error',
          'no-this-before-super': 'error',
          'no-throw-literal': 'error',
          'no-undef': 'error',
          'no-undef-init': 'error',
          'no-undefined': 'error',
          'no-underscore-dangle': 'error',
          'no-unexpected-multiline': 'error',
          'no-unused-expressions': 'error',
          'no-unused-labels': 'error',
          'no-unmodified-loop-condition': 'error',
          'no-unneeded-ternary': 'error',
          'no-unreachable': 'error',
          'no-unreachable-loop': 'error',
          'no-unsafe-finally': 'error',
          'no-unsafe-negation': 'error',
          'no-unsafe-optional-chaining': 'error',
          'no-unused-vars': 'error',
          'no-unused-private-class-members': 'error',
          'no-use-before-define': 'error',
          'no-useless-assignment': 'error',
          'no-useless-call': 'error',
          'no-useless-catch': 'error',
          'no-useless-computed-key': 'error',
          'no-useless-concat': 'error',
          'no-useless-constructor': 'error',
          'no-useless-backreference': 'error',
          'no-useless-escape': 'error',
          'no-useless-rename': 'error',
          'no-useless-return': 'error',
          'no-var': 'error',
          'no-void': 'error',
          'no-warning-comments': 'error',
          'no-with': 'error',
          'object-shorthand': 'error',
          'one-var': ['error', 'never'],
          'operator-assignment': 'error',
          'prefer-arrow-callback': 'error',
          'prefer-const': 'error',
          'prefer-destructuring': 'error',
          'prefer-exponentiation-operator': 'off',
          'prefer-named-capture-group': 'off',
          'prefer-numeric-literals': 'error',
          'prefer-object-has-own': 'error',
          'prefer-object-spread': 'error',
          'prefer-promise-reject-errors': 'error',
          'prefer-regex-literals': 'error',
          'prefer-rest-params': 'error',
          'prefer-spread': 'error',
          'prefer-template': 'error',
          'preserve-caught-error': 'error',
          radix: 'error',
          'require-await': 'error',
          'require-atomic-updates': 'error',
          'require-unicode-regexp': 'error',
          'require-yield': 'error',
          strict: 'error',
          'symbol-description': 'error',
          'use-isnan': 'error',
          'valid-typeof': 'error',
          'vars-on-top': 'error',
          'wrap-iife': 'error',
          yoda: 'error',
        },
      });
    });

    it('VALID: {forTesting: true} => returns complete config object with new-cap off', () => {
      const result: EslintConfig = eslintConfigTransformer({ forTesting: true });

      expect(result).toStrictEqual({
        plugins: {},
        rules: {
          'accessor-pairs': 'error',
          'array-callback-return': 'error',
          'arrow-body-style': ['error', 'always'],
          'block-scoped-var': 'error',
          camelcase: 'error',
          'capitalized-comments': 'error',
          'class-methods-use-this': 'error',
          complexity: ['error', { max: 10 }],
          'consistent-return': 'error',
          'consistent-this': 'error',
          'constructor-super': 'error',
          curly: 'error',
          'default-case': 'error',
          'default-case-last': 'error',
          'default-param-last': 'error',
          'dot-notation': 'error',
          eqeqeq: 'error',
          'for-direction': 'error',
          'func-name-matching': 'error',
          'func-names': 'error',
          'func-style': ['error', 'expression', { allowArrowFunctions: false }],
          'getter-return': 'error',
          'guard-for-in': 'error',
          'grouped-accessor-pairs': 'error',
          'id-denylist': 'off',
          'id-length': ['error', { min: 2 }],
          'id-match': 'error',
          'init-declarations': 'error',
          'logical-assignment-operators': 'error',
          'max-classes-per-file': ['error', { max: 1 }],
          'max-depth': ['error', { max: 4 }],
          'max-lines-per-function': [
            'error',
            { max: 100, skipBlankLines: true, skipComments: true },
          ],
          'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
          'max-nested-callbacks': ['error', { max: 4 }],
          'max-params': ['error', { max: 1 }],
          'max-statements': ['error', { max: 20 }],
          'new-cap': 'off',
          'no-alert': 'error',
          'no-array-constructor': 'error',
          'no-bitwise': 'error',
          'no-async-promise-executor': 'error',
          'no-await-in-loop': 'error',
          'no-caller': 'error',
          'no-case-declarations': 'error',
          'no-class-assign': 'error',
          'no-compare-neg-zero': 'error',
          'no-console': 'error',
          'no-continue': 'error',
          'no-cond-assign': 'error',
          'no-const-assign': 'error',
          'no-constant-binary-expression': 'error',
          'no-constant-condition': 'error',
          'no-constructor-return': 'error',
          'no-control-regex': 'error',
          'no-debugger': 'error',
          'no-delete-var': 'error',
          'no-div-regex': 'error',
          'no-dupe-args': 'error',
          'no-dupe-class-members': 'error',
          'no-dupe-else-if': 'error',
          'no-dupe-keys': 'error',
          'no-duplicate-case': 'error',
          'no-else-return': 'error',
          'no-empty': 'error',
          'no-empty-character-class': 'error',
          'no-empty-pattern': 'error',
          'no-empty-static-block': 'error',
          'no-empty-function': 'error',
          'no-eq-null': 'error',
          'no-eval': 'error',
          'no-ex-assign': 'error',
          'no-extend-native': 'error',
          'no-extra-bind': 'error',
          'no-extra-boolean-cast': 'error',
          'no-extra-label': 'error',
          'no-fallthrough': 'error',
          'no-func-assign': 'error',
          'no-global-assign': 'error',
          'no-implicit-globals': 'error',
          'no-implicit-coercion': 'error',
          'no-implied-eval': 'error',
          'no-import-assign': 'error',
          'no-inner-declarations': 'error',
          'no-invalid-regexp': 'error',
          'no-irregular-whitespace': 'error',
          'no-invalid-this': 'error',
          'no-iterator': 'error',
          'no-label-var': 'error',
          'no-labels': 'error',
          'no-lone-blocks': 'error',
          'no-lonely-if': 'error',
          'no-loop-func': 'error',
          'no-loss-of-precision': 'error',
          'no-magic-numbers': ['error'],
          'no-multi-assign': 'error',
          'no-misleading-character-class': 'error',
          'no-multi-str': 'error',
          'no-negated-condition': 'error',
          'no-nested-ternary': 'error',
          'no-new': 'error',
          'no-new-func': 'error',
          'no-new-native-nonconstructor': 'error',
          'no-new-wrappers': 'error',
          'no-nonoctal-decimal-escape': 'error',
          'no-object-constructor': 'error',
          'no-obj-calls': 'error',
          'no-octal': 'error',
          'no-octal-escape': 'error',
          'no-param-reassign': 'error',
          'no-plusplus': 'error',
          'no-proto': 'error',
          'no-promise-executor-return': 'error',
          'no-prototype-builtins': 'error',
          'no-regex-spaces': 'error',
          'no-redeclare': 'error',
          'no-restricted-exports': 'off',
          'no-restricted-globals': 'off',
          'no-restricted-imports': 'off',
          'no-restricted-properties': 'off',
          'no-return-assign': 'error',
          'no-script-url': 'error',
          'no-self-assign': 'error',
          'no-self-compare': 'error',
          'no-sequences': 'error',
          'no-shadow': 'error',
          'no-setter-return': 'error',
          'no-shadow-restricted-names': 'error',
          'no-sparse-arrays': 'error',
          'no-template-curly-in-string': 'error',
          'no-this-before-super': 'error',
          'no-throw-literal': 'error',
          'no-undef': 'error',
          'no-undef-init': 'error',
          'no-undefined': 'error',
          'no-underscore-dangle': 'error',
          'no-unexpected-multiline': 'error',
          'no-unused-expressions': 'error',
          'no-unused-labels': 'error',
          'no-unmodified-loop-condition': 'error',
          'no-unneeded-ternary': 'error',
          'no-unreachable': 'error',
          'no-unreachable-loop': 'error',
          'no-unsafe-finally': 'error',
          'no-unsafe-negation': 'error',
          'no-unsafe-optional-chaining': 'error',
          'no-unused-vars': 'error',
          'no-unused-private-class-members': 'error',
          'no-use-before-define': 'error',
          'no-useless-assignment': 'error',
          'no-useless-call': 'error',
          'no-useless-catch': 'error',
          'no-useless-computed-key': 'error',
          'no-useless-concat': 'error',
          'no-useless-constructor': 'error',
          'no-useless-backreference': 'error',
          'no-useless-escape': 'error',
          'no-useless-rename': 'error',
          'no-useless-return': 'error',
          'no-var': 'error',
          'no-void': 'error',
          'no-warning-comments': 'error',
          'no-with': 'error',
          'object-shorthand': 'error',
          'one-var': ['error', 'never'],
          'operator-assignment': 'error',
          'prefer-arrow-callback': 'error',
          'prefer-const': 'error',
          'prefer-destructuring': 'error',
          'prefer-exponentiation-operator': 'off',
          'prefer-named-capture-group': 'off',
          'prefer-numeric-literals': 'error',
          'prefer-object-has-own': 'error',
          'prefer-object-spread': 'error',
          'prefer-promise-reject-errors': 'error',
          'prefer-regex-literals': 'error',
          'prefer-rest-params': 'error',
          'prefer-spread': 'error',
          'prefer-template': 'error',
          'preserve-caught-error': 'error',
          radix: 'error',
          'require-await': 'error',
          'require-atomic-updates': 'error',
          'require-unicode-regexp': 'error',
          'require-yield': 'error',
          strict: 'error',
          'symbol-description': 'error',
          'use-isnan': 'error',
          'valid-typeof': 'error',
          'vars-on-top': 'error',
          'wrap-iife': 'error',
          yoda: 'error',
        },
      });
    });
  });
});
