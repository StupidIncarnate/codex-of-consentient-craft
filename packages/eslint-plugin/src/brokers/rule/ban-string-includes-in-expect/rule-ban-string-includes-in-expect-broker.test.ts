import { ruleBanStringIncludesInExpectBroker } from './rule-ban-string-includes-in-expect-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-string-includes-in-expect', ruleBanStringIncludesInExpectBroker(), {
  valid: [
    // Direct string assertion is fine
    {
      code: "expect(str).toBe('hello world');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // toMatch with anchored regex is fine
    {
      code: 'expect(str).toMatch(/^hello world$/u);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Non-test file — not checked
    {
      code: "expect(str.includes('hello')).toBe(true);",
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // includes() outside expect is fine
    {
      code: "const has = str.includes('hello'); expect(has).toBe(true);",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
  ],

  invalid: [
    // expect(x.includes(y)).toBe(true)
    {
      code: "expect(str.includes('hello')).toBe(true);",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noIncludesInExpect' }],
    },

    // expect(String(x).includes(y)).toBe(true)
    {
      code: "expect(String(x).includes('hello')).toBe(true);",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noIncludesInExpect' }],
    },

    // expect(arr.includes(item)).toBe(true) — also caught (array includes is equally bad)
    {
      code: "expect(arr.includes('item')).toBe(true);",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noIncludesInExpect' }],
    },

    // TSX test file
    {
      code: "expect(text.includes('error')).toBe(true);",
      filename: '/project/src/widgets/button/button-widget.test.tsx',
      errors: [{ messageId: 'noIncludesInExpect' }],
    },
  ],
});
