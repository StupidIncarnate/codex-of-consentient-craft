export const jestRuleStatics = {
  rules: {
    // Enforce consistent test or it keyword
    'jest/consistent-test-it': 'error',

    // Enforce assertion to be made in a test body
    'jest/expect-expect': 'error',

    // Enforce a maximum number of expect per test
    'jest/max-expects': 'error',

    // Enforce a maximum depth to nested describe calls
    'jest/max-nested-describe': 'error',

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
    'jest/no-restricted-jest-methods': 'error',

    // Disallow specific matchers
    'jest/no-restricted-matchers': 'error',

    // Disallow using expect outside of it or test blocks
    'jest/no-standalone-expect': 'error',

    // Disallow using f & x prefixes to define focused/skipped tests
    'jest/no-test-prefixes': 'error',

    // Disallow explicitly returning from tests
    'jest/no-test-return-statement': 'error',

    // Disallow using jest.mock() factories without an explicit type parameter
    'jest/no-untyped-mock-factory': 'error',

    // Enforce padding around afterAll blocks
    'jest/padding-around-after-all-blocks': 'error',

    // Enforce padding around afterEach blocks
    'jest/padding-around-after-each-blocks': 'error',

    // Enforce padding around expect groups
    'jest/padding-around-all': 'error',

    // Enforce padding around beforeAll blocks
    'jest/padding-around-before-all-blocks': 'error',

    // Enforce padding around beforeEach blocks
    'jest/padding-around-before-each-blocks': 'error',

    // Enforce padding around describe blocks
    'jest/padding-around-describe-blocks': 'error',

    // Enforce padding around expect groups
    'jest/padding-around-expect-groups': 'error',

    // Enforce padding around test blocks
    'jest/padding-around-test-blocks': 'error',

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
    'jest/prefer-expect-assertions': 'error',

    // Suggest using resolves over promise.then() for async tests
    'jest/prefer-expect-resolves': 'error',

    // Suggest having hooks in a consistent order
    'jest/prefer-hooks-in-order': 'error',

    // Suggest having hooks before any test cases
    'jest/prefer-hooks-on-top': 'error',

    // Suggest importing Jest globals instead of using them without import
    'jest/prefer-importing-jest-globals': 'error',

    // Suggest using jest.mocked() over fn as jest.Mock
    'jest/prefer-jest-mocked': 'error',

    // Enforce lowercase test names
    'jest/prefer-lowercase-title': 'error',

    // Suggest using the built-in mock promise shorthand
    'jest/prefer-mock-promise-shorthand': 'error',

    // Suggest using toMatchSnapshot() hint
    'jest/prefer-snapshot-hint': 'error',

    // Suggest using jest.spyOn()
    'jest/prefer-spy-on': 'error',
  },
} as const;
