import { ruleBanTautologicalAssertionsBroker } from './rule-ban-tautological-assertions-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-tautological-assertions', ruleBanTautologicalAssertionsBroker(), {
  valid: [
    // Variable in expect — not a tautology
    {
      code: 'expect(result).toBe(true);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Different literal values
    {
      code: 'expect(1).toBe(2);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Function call in expect
    {
      code: "expect(fn()).toBe('hello');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Non-test file — not checked
    {
      code: 'expect(true).toBe(true);',
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // Different matchers (toStrictEqual with identical literals is odd but not this rule's scope)
    {
      code: 'expect(true).toStrictEqual(true);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
  ],

  invalid: [
    // expect(true).toBe(true)
    {
      code: 'expect(true).toBe(true);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'tautologicalAssertion', data: { value: 'true' } }],
    },

    // expect(false).toBe(false)
    {
      code: 'expect(false).toBe(false);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'tautologicalAssertion', data: { value: 'false' } }],
    },

    // expect(null).toBe(null)
    {
      code: 'expect(null).toBe(null);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'tautologicalAssertion', data: { value: 'null' } }],
    },

    // expect(1).toBe(1)
    {
      code: 'expect(1).toBe(1);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'tautologicalAssertion', data: { value: '1' } }],
    },

    // expect('foo').toBe('foo')
    {
      code: "expect('foo').toBe('foo');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'tautologicalAssertion', data: { value: 'foo' } }],
    },
  ],
});
