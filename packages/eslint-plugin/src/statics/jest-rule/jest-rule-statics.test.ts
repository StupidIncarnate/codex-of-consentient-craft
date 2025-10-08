import { jestRuleStatics } from './jest-rule-statics';

describe('jestRuleStatics', () => {
  describe('rules', () => {
    it('VALID: complete jest rules configuration matches expected structure', () => {
      expect(jestRuleStatics.rules).toStrictEqual({
        'jest/consistent-test-it': ['error', { fn: 'it' }],
        'jest/expect-expect': 'error',
        'jest/max-expects': 'error',
        'jest/max-nested-describe': 'off',
        'jest/no-alias-methods': 'error',
        'jest/no-commented-out-tests': 'error',
        'jest/no-conditional-expect': 'error',
        'jest/no-conditional-in-test': 'error',
        'jest/no-confusing-set-timeout': 'error',
        'jest/no-deprecated-functions': 'error',
        'jest/no-disabled-tests': 'error',
        'jest/no-done-callback': 'error',
        'jest/no-duplicate-hooks': 'error',
        'jest/no-export': 'error',
        'jest/no-focused-tests': 'error',
        'jest/no-hooks': 'error',
        'jest/no-identical-title': 'error',
        'jest/no-interpolation-in-snapshots': 'error',
        'jest/no-jasmine-globals': 'error',
        'jest/no-large-snapshots': 'error',
        'jest/no-mocks-import': 'error',
        'jest/no-restricted-jest-methods': [
          'error',
          {
            clearAllMocks: '@questmaestro/testing handles this globally - no manual cleanup needed',
            resetAllMocks: '@questmaestro/testing handles this globally - no manual cleanup needed',
            restoreAllMocks:
              '@questmaestro/testing handles this globally - no manual cleanup needed',
            mockClear: '@questmaestro/testing handles this globally - no manual cleanup needed',
            mockReset: '@questmaestro/testing handles this globally - no manual cleanup needed',
            mockRestore: '@questmaestro/testing handles this globally - no manual cleanup needed',
          },
        ],
        'jest/no-restricted-matchers': [
          'error',
          {
            toEqual: 'Use .toStrictEqual() instead',
            toMatchObject: 'Use .toStrictEqual() instead',
            toContain: 'Use .toStrictEqual() instead',
            toBeTruthy: 'Use .toBe(true) instead',
            toBeFalsy: 'Use .toBe(false) instead',
            toHaveProperty: 'Test actual value with .toBe() instead',
            objectContaining: 'Test complete object instead',
            arrayContaining: 'Test complete array instead',
            stringContaining: 'Use regex /^.*substring.*$/ instead',
            'any(String)': 'Test actual string value instead',
            'any(Number)': 'Test actual number instead',
            'any(Object)': 'Test complete object shape instead',
          },
        ],
        'jest/no-standalone-expect': 'error',
        'jest/no-test-prefixes': 'error',
        'jest/no-test-return-statement': 'error',
        'jest/no-untyped-mock-factory': 'off',
        'jest/padding-around-all': 'error',
        'jest/prefer-called-with': 'error',
        'jest/prefer-comparison-matcher': 'error',
        'jest/prefer-each': 'error',
        'jest/prefer-ending-with-an-expect': 'error',
        'jest/prefer-equality-matcher': 'error',
        'jest/prefer-expect-assertions': 'off',
        'jest/prefer-expect-resolves': 'error',
        'jest/prefer-hooks-in-order': 'error',
        'jest/prefer-hooks-on-top': 'error',
        'jest/prefer-importing-jest-globals': 'off',
        'jest/prefer-jest-mocked': 'error',
        'jest/prefer-lowercase-title': 'off',
        'jest/prefer-mock-promise-shorthand': 'error',
        'jest/prefer-snapshot-hint': 'off',
        'jest/prefer-spy-on': 'error',
        'jest/prefer-strict-equal': 'error',
        'jest/prefer-to-be': 'error',
        'jest/prefer-to-contain': 'off',
        'jest/prefer-to-have-length': 'error',
        'jest/prefer-todo': 'off',
        'jest/require-hook': 'error',
        'jest/require-to-throw-message': 'error',
        'jest/require-top-level-describe': 'error',
        '@typescript-eslint/unbound-method': 'off',
        'jest/unbound-method': 'error',
        'jest/valid-describe-callback': 'error',
        'jest/valid-expect-in-promise': 'error',
        'jest/valid-expect': 'error',
        'jest/valid-title': 'error',
      });
    });
  });

  describe('restricted matchers', () => {
    it('VALID: no-restricted-matchers configuration includes forbidden matchers from testing standards', () => {
      const restrictedMatchers = jestRuleStatics.rules['jest/no-restricted-matchers'];

      expect(Array.isArray(restrictedMatchers)).toBe(true);
      expect(restrictedMatchers[0]).toBe('error');
      expect(restrictedMatchers[1]).toStrictEqual({
        toEqual: 'Use .toStrictEqual() instead',
        toMatchObject: 'Use .toStrictEqual() instead',
        toContain: 'Use .toStrictEqual() instead',
        toBeTruthy: 'Use .toBe(true) instead',
        toBeFalsy: 'Use .toBe(false) instead',
        toHaveProperty: 'Test actual value with .toBe() instead',
        objectContaining: 'Test complete object instead',
        arrayContaining: 'Test complete array instead',
        stringContaining: 'Use regex /^.*substring.*$/ instead',
        'any(String)': 'Test actual string value instead',
        'any(Number)': 'Test actual number instead',
        'any(Object)': 'Test complete object shape instead',
      });
    });
  });

  describe('restricted jest methods', () => {
    it('VALID: no-restricted-jest-methods configuration includes manual mock cleanup methods', () => {
      const restrictedMethods = jestRuleStatics.rules['jest/no-restricted-jest-methods'];

      expect(Array.isArray(restrictedMethods)).toBe(true);
      expect(restrictedMethods[0]).toBe('error');
      expect(restrictedMethods[1]).toStrictEqual({
        clearAllMocks: '@questmaestro/testing handles this globally - no manual cleanup needed',
        resetAllMocks: '@questmaestro/testing handles this globally - no manual cleanup needed',
        restoreAllMocks: '@questmaestro/testing handles this globally - no manual cleanup needed',
        mockClear: '@questmaestro/testing handles this globally - no manual cleanup needed',
        mockReset: '@questmaestro/testing handles this globally - no manual cleanup needed',
        mockRestore: '@questmaestro/testing handles this globally - no manual cleanup needed',
      });
    });
  });

  describe('immutability', () => {
    it('EDGE: as const makes rules object readonly at type level', () => {
      const { rules } = jestRuleStatics;

      expect(rules['jest/prefer-strict-equal']).toBe('error');
      expect(rules['jest/no-hooks']).toBe('error');
      expect(rules['jest/consistent-test-it']).toStrictEqual(['error', { fn: 'it' }]);
    });
  });
});
