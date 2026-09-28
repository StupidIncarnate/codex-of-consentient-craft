import { ruleBanStringIncludesInExpectBroker } from './rule-ban-string-includes-in-expect-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

const ruleTester = ruleTesterHarness();

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

    // includes() assigned to variable but NOT passed to expect is fine
    {
      code: "const has = str.includes('hello'); console.log(has);",
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

    // Variable extraction evasion — const has = str.includes('hello'); expect(has)...
    {
      code: "const has = str.includes('hello'); expect(has).toBe(true);",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noIncludesInExpect' }],
    },
  ],
});
