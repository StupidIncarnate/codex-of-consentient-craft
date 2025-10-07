export const jestRuleStatics = {
  rules: {
    // Enforce consistent test or it keyword
    'jest/consistent-test-it': ['error', { fn: 'it' }],

    // Enforce assertion to be made in a test body
    'jest/expect-expect': 'error',

    // Enforce a maximum number of expect per test
    // Max is 5 currently
    'jest/max-expects': 'error',

    // Enforce a maximum depth to nested describe calls - Default: 5
    // Don't need to enforce this right now
    'jest/max-nested-describe': 'off',

    // Disallow alias methods
    'jest/no-alias-methods': 'error',

    // Disallow commented out tests
    'jest/no-commented-out-tests': 'error',

    // Disallow calling expect conditionally
    'jest/no-conditional-expect': 'error',

    // Disallow conditional logic in tests
    'jest/no-conditional-in-test': 'error',

    // Disallow confusing usages of jest.setTimeout
    'jest/no-confusing-set-timeout': 'error',

    // Disallow use of deprecated functions
    'jest/no-deprecated-functions': 'error',

    // Disallow disabled tests
    'jest/no-disabled-tests': 'error',

    // Disallow using a callback in asynchronous tests and hooks
    'jest/no-done-callback': 'error',

    // Disallow duplicate setup and teardown hooks
    'jest/no-duplicate-hooks': 'error',

    // Disallow using exports in files containing tests
    'jest/no-export': 'error',

    // Disallow focused tests
    'jest/no-focused-tests': 'error',

    // Disallow setup and teardown hooks
    // Makes it so no tests can have before*/after* hooks
    'jest/no-hooks': 'error',

    // Disallow identical titles
    'jest/no-identical-title': 'error',

    // Disallow string interpolation inside snapshots
    'jest/no-interpolation-in-snapshots': 'error',

    // Disallow Jasmine globals
    'jest/no-jasmine-globals': 'error',

    // Disallow large snapshots
    'jest/no-large-snapshots': 'error',

    // Disallow manually importing from __mocks__
    'jest/no-mocks-import': 'error',

    // Disallow specific jest methods
    // Based on testing-standards.md - Anti-Patterns section
    // @questmaestro/testing handles mock cleanup globally
    'jest/no-restricted-jest-methods': [
      'error',
      {
        clearAllMocks: '@questmaestro/testing handles this globally - no manual cleanup needed',
        resetAllMocks: '@questmaestro/testing handles this globally - no manual cleanup needed',
        restoreAllMocks: '@questmaestro/testing handles this globally - no manual cleanup needed',
        mockClear: '@questmaestro/testing handles this globally - no manual cleanup needed',
        mockReset: '@questmaestro/testing handles this globally - no manual cleanup needed',
        mockRestore: '@questmaestro/testing handles this globally - no manual cleanup needed',
      },
    ],

    // Disallow specific matchers
    // Based on testing-standards.md - Forbidden Jest Matchers section
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

    // Disallow using expect outside of it or test blocks
    'jest/no-standalone-expect': 'error',

    // Disallow using f & x prefixes to define focused/skipped tests
    'jest/no-test-prefixes': 'error',

    // Disallow explicitly returning from tests
    'jest/no-test-return-statement': 'error',

    // Disallow using jest.mock() factories without an explicit type parameter
    // Strict typing should already be handled with mocks
    'jest/no-untyped-mock-factory': 'off',

    // Enforce padding around afterAll blocks
    // 'jest/padding-around-after-all-blocks': 'error',

    // Enforce padding around afterEach blocks
    // 'jest/padding-around-after-each-blocks': 'error',

    // Enforce padding around expect groups
    'jest/padding-around-all': 'error',

    // Enforce padding around beforeAll blocks
    // 'jest/padding-around-before-all-blocks': 'error',

    // Enforce padding around beforeEach blocks
    // 'jest/padding-around-before-each-blocks': 'error',

    // Enforce padding around describe blocks
    // 'jest/padding-around-describe-blocks': 'error',

    // Enforce padding around expect groups
    // 'jest/padding-around-expect-groups': 'error',

    // Enforce padding around test blocks
    // 'jest/padding-around-test-blocks': 'error',

    // Suggest using toBeCalledWith() or toHaveBeenCalledWith()
    'jest/prefer-called-with': 'error',

    // Suggest using the built-in comparison matchers
    'jest/prefer-comparison-matcher': 'error',

    // Suggest using each when running multiple tests with similar values
    'jest/prefer-each': 'error',

    // Suggest using the built-in quality matchers
    'jest/prefer-ending-with-an-expect': 'error',

    // Suggest using the built-in equality matchers
    'jest/prefer-equality-matcher': 'error',

    // Suggest using expect.assertions() or expect.hasAssertions()
    // Not really sure this is needed with LLM
    'jest/prefer-expect-assertions': 'off',

    // Suggest using resolves over promise.then() for async tests
    'jest/prefer-expect-resolves': 'error',

    // Suggest having hooks in a consistent order
    'jest/prefer-hooks-in-order': 'error',

    // Suggest having hooks before any test cases
    'jest/prefer-hooks-on-top': 'error',

    // Suggest importing Jest globals instead of using them without import
    // Not needed
    'jest/prefer-importing-jest-globals': 'off',

    // Suggest using jest.mocked() over fn as jest.Mock
    'jest/prefer-jest-mocked': 'error',

    // Enforce lowercase test names
    // Our standards have starter tags that are all caps
    'jest/prefer-lowercase-title': 'off',

    // Suggest using the built-in mock promise shorthand
    'jest/prefer-mock-promise-shorthand': 'error',

    // Suggest using toMatchSnapshot() hint
    // No snapshots
    'jest/prefer-snapshot-hint': 'off',

    // Suggest using jest.spyOn()
    'jest/prefer-spy-on': 'error',

    // Requires toStrictEquals()
    'jest/prefer-strict-equal': 'error',

    // Enforces toBe on primitive literals
    'jest/prefer-to-be': 'error',

    // Enforces toContains on array evals
    // ToContain should not be used
    'jest/prefer-to-contain': 'off',

    // Enforces toHaveLength() for length checks
    'jest/prefer-to-have-length': 'error',

    // Requires it.todo for empty tests
    // Problematic for llm filling in tests in chunks
    'jest/prefer-todo': 'off',

    // Makes sure hook calls are used for build up/tear down
    'jest/require-hook': 'error',

    // Requires use of toThrow instead of toThrowError
    'jest/require-to-throw-message': 'error',

    // Requires root describe only
    'jest/require-top-level-describe': 'error',

    // Augments @typescript-eslint/unbound-method
    '@typescript-eslint/unbound-method': 'off',
    'jest/unbound-method': 'error',

    // Enforces 2nd arg setup for describes
    'jest/valid-describe-callback': 'error',

    // Ensures proper promise handling
    'jest/valid-expect-in-promise': 'error',

    // Enforces valid expect structure
    'jest/valid-expect': 'error',

    // Enforce valid tiles
    'jest/valid-title': 'error',
  },
} as const;
