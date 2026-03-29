import { ruleBanNotToThrowBroker } from './rule-ban-not-to-throw-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-not-to-throw', ruleBanNotToThrowBroker(), {
  valid: [
    // --- toThrow without .not is fine ---
    {
      code: "expect(() => fn()).toThrow('error');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
    {
      code: 'expect(() => fn()).toThrow(/pattern/);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // --- Testing return value directly is fine ---
    {
      code: 'const result = fn(); expect(result).toBe(value);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // --- Non-test files are not checked ---
    {
      code: 'expect(() => fn()).not.toThrow();',
      filename: '/project/src/brokers/user/user-broker.ts',
    },
  ],

  invalid: [
    // --- .not.toThrow() in test files ---
    {
      code: 'expect(() => fn()).not.toThrow();',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noNotToThrow' }],
    },
    {
      code: 'expect(() => { a(); b(); c(); }).not.toThrow();',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noNotToThrow' }],
    },
  ],
});
