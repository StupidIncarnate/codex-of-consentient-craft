import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleBanWeakAsymmetricMatchersBroker } from './rule-ban-weak-asymmetric-matchers-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-weak-asymmetric-matchers', ruleBanWeakAsymmetricMatchersBroker(), {
  valid: [
    // expect.any(Function) is the ONLY allowed exception
    {
      code: `expect(result).toStrictEqual({ handler: expect.any(Function) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // expect.stringMatching — covered by ban-unanchored-to-match, not this rule
    {
      code: `expect(result).toStrictEqual({ name: expect.stringMatching(/^hello$/u) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Exact values in toStrictEqual — no asymmetric matcher
    {
      code: `expect(result).toStrictEqual({ id: '123', name: 'Alice' });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Non-test file — not checked
    {
      code: `expect(result).toStrictEqual({ rules: expect.any(Object) });`,
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // Free-standing asymmetric matcher not inside toStrictEqual — jest/no-restricted-matchers handles
    {
      code: `const matcher = expect.objectContaining({ id: '123' });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
  ],

  invalid: [
    // expect.any(Object)
    {
      code: `expect(result).toStrictEqual({ rules: expect.any(Object) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAny', data: { type: 'Object' } }],
    },

    // expect.any(String)
    {
      code: `expect(result).toStrictEqual({ name: expect.any(String) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAny', data: { type: 'String' } }],
    },

    // expect.any(Number)
    {
      code: `expect(result).toStrictEqual({ count: expect.any(Number) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAny', data: { type: 'Number' } }],
    },

    // expect.any(Array)
    {
      code: `expect(result).toStrictEqual({ items: expect.any(Array) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAny', data: { type: 'Array' } }],
    },

    // expect.any(Boolean) — NOT in allowlist, banned
    {
      code: `expect(result).toStrictEqual({ active: expect.any(Boolean) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAny', data: { type: 'Boolean' } }],
    },

    // expect.any(Date) — NOT in allowlist, banned
    {
      code: `expect(result).toStrictEqual({ created: expect.any(Date) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAny', data: { type: 'Date' } }],
    },

    // expect.objectContaining
    {
      code: `expect(result).toStrictEqual({ meta: expect.objectContaining({}) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAsymmetric', data: { method: 'objectContaining' } }],
    },

    // expect.arrayContaining
    {
      code: `expect(result).toStrictEqual({ items: expect.arrayContaining([]) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAsymmetric', data: { method: 'arrayContaining' } }],
    },

    // expect.stringContaining
    {
      code: `expect(result).toStrictEqual({ msg: expect.stringContaining('hello') });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAsymmetric', data: { method: 'stringContaining' } }],
    },

    // Deeply nested — inside nested object inside toStrictEqual
    {
      code: `expect(result).toStrictEqual({ user: { profile: expect.any(Object) } });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAny', data: { type: 'Object' } }],
    },

    // Inside array in toStrictEqual
    {
      code: `expect(result).toStrictEqual([expect.any(String)]);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAny', data: { type: 'String' } }],
    },

    // Multiple violations in single toStrictEqual
    {
      code: `expect(result).toStrictEqual({ a: expect.any(Object), b: expect.any(String) });`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        { messageId: 'bannedNestedAny', data: { type: 'Object' } },
        { messageId: 'bannedNestedAny', data: { type: 'String' } },
      ],
    },

    // Nested in toBe
    {
      code: `expect(result).toBe(expect.any(Object));`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'bannedNestedAny', data: { type: 'Object' } }],
    },
  ],
});
