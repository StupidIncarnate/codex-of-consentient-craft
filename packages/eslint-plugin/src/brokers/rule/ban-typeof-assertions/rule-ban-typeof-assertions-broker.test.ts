import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleBanTypeofAssertionsBroker } from './rule-ban-typeof-assertions-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-typeof-assertions', ruleBanTypeofAssertionsBroker(), {
  valid: [
    // Direct value assertion in test file
    {
      code: "expect(result).toBe('hello');",
      filename: '/project/src/brokers/payment/payment-broker.test.ts',
    },
    // Object assertion in test file
    {
      code: "expect(result).toStrictEqual({ key: 'value' });",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
    // typeof outside expect — not checked
    {
      code: 'const t = typeof x;',
      filename: '/project/src/brokers/config/config-broker.test.ts',
    },
    // typeof in expect but in NON-test file — not checked
    {
      code: "expect(typeof result).toBe('string');",
      filename: '/project/src/brokers/user/user-broker.ts',
    },
  ],
  invalid: [
    // typeof string check
    {
      code: "expect(typeof result).toBe('string');",
      filename: '/project/src/brokers/payment/payment-broker.test.ts',
      errors: [{ messageId: 'noTypeofAssertion' }],
    },
    // typeof object check
    {
      code: "expect(typeof result).toBe('object');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noTypeofAssertion' }],
    },
    // typeof function check
    {
      code: "expect(typeof result).toBe('function');",
      filename: '/project/src/transformers/format/format-transformer.test.ts',
      errors: [{ messageId: 'noTypeofAssertion' }],
    },
    // typeof number check
    {
      code: "expect(typeof result).toBe('number');",
      filename: '/project/src/guards/is-valid/is-valid-guard.test.ts',
      errors: [{ messageId: 'noTypeofAssertion' }],
    },
  ],
});
