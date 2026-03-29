import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleBanWeakExistenceMatchersBroker } from './rule-ban-weak-existence-matchers-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-weak-existence-matchers', ruleBanWeakExistenceMatchersBroker(), {
  valid: [
    // Explicit value assertions are allowed
    {
      code: 'expect(result).toBe(undefined);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
    {
      code: 'expect(result).toBe(null);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
    {
      code: 'expect(flag).toBe(true);',
      filename: '/project/src/brokers/payment/payment-broker.test.ts',
    },
    {
      code: 'expect(flag).toBe(false);',
      filename: '/project/src/brokers/payment/payment-broker.test.ts',
    },
    {
      code: "expect(result).toStrictEqual({ name: 'John' });",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Non-test files are not checked
    {
      code: 'expect(result).toBeUndefined();',
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // Not on expect chain - should not trigger
    {
      code: 'someObj.toBeUndefined();',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
  ],
  invalid: [
    // toBeUndefined
    {
      code: 'expect(result).toBeUndefined();',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'weakMatcher',
          data: { matcher: 'toBeUndefined', replacement: '.toBe(undefined)' },
        },
      ],
    },

    // toBeNull
    {
      code: 'expect(result).toBeNull();',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'weakMatcher',
          data: { matcher: 'toBeNull', replacement: '.toBe(null)' },
        },
      ],
    },

    // toBeDefined
    {
      code: 'expect(result).toBeDefined();',
      filename: '/project/src/brokers/config/config-broker.test.ts',
      errors: [
        {
          messageId: 'weakMatcher',
          data: { matcher: 'toBeDefined', replacement: 'explicit value assertion' },
        },
      ],
    },

    // toBeTruthy
    {
      code: 'expect(flag).toBeTruthy();',
      filename: '/project/src/brokers/auth/auth-broker.test.ts',
      errors: [
        {
          messageId: 'weakMatcher',
          data: { matcher: 'toBeTruthy', replacement: '.toBe(true)' },
        },
      ],
    },

    // toBeFalsy
    {
      code: 'expect(flag).toBeFalsy();',
      filename: '/project/src/brokers/auth/auth-broker.test.ts',
      errors: [
        {
          messageId: 'weakMatcher',
          data: { matcher: 'toBeFalsy', replacement: '.toBe(false)' },
        },
      ],
    },

    // .not chain still ends in banned matcher
    {
      code: 'expect(result).not.toBeNull();',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'weakMatcher',
          data: { matcher: 'toBeNull', replacement: '.toBe(null)' },
        },
      ],
    },

    // async resolves chain
    {
      code: 'await expect(fn()).resolves.toBeUndefined();',
      filename: '/project/src/brokers/api/api-broker.test.ts',
      errors: [
        {
          messageId: 'weakMatcher',
          data: { matcher: 'toBeUndefined', replacement: '.toBe(undefined)' },
        },
      ],
    },
  ],
});
