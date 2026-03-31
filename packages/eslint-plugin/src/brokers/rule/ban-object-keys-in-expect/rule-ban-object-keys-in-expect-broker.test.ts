import { ruleBanObjectKeysInExpectBroker } from './rule-ban-object-keys-in-expect-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-object-keys-in-expect', ruleBanObjectKeysInExpectBroker(), {
  valid: [
    // Direct object assertion is fine
    {
      code: "expect(obj).toStrictEqual({ id: '123', name: 'John' });",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Object.keys assigned to variable but NOT passed to expect is fine
    {
      code: 'const keys = Object.keys(obj); console.log(keys);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Non-test file — not checked
    {
      code: 'expect(Object.keys(obj)).toStrictEqual([]);',
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // Other Object methods are fine
    {
      code: 'expect(Object.values(obj)).toStrictEqual([1, 2]);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
  ],

  invalid: [
    // expect(Object.keys(...))
    {
      code: "expect(Object.keys(obj)).toStrictEqual(['id', 'name']);",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noObjectKeysInExpect' }],
    },

    // expect(Object.keys(...)) with nested object
    {
      code: "expect(Object.keys(result.data)).toStrictEqual(['a', 'b']);",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noObjectKeysInExpect' }],
    },

    // TSX test file
    {
      code: "expect(Object.keys(props)).toStrictEqual(['onClick']);",
      filename: '/project/src/widgets/button/button-widget.test.tsx',
      errors: [{ messageId: 'noObjectKeysInExpect' }],
    },

    // Variable extraction evasion — const keys = Object.keys(obj); expect(keys)...
    {
      code: "const keys = Object.keys(obj); expect(keys).toStrictEqual(['id', 'name']);",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noObjectKeysInExpect' }],
    },
  ],
});
