import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleBanUnanchoredToMatchBroker } from './rule-ban-unanchored-to-match-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-unanchored-to-match', ruleBanUnanchoredToMatchBroker(), {
  valid: [
    // Fully anchored regex
    {
      code: `expect(text).toMatch(/^exact text$/u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Not using toMatch at all
    {
      code: `expect(text).toBe('exact');`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // toThrow with unanchored regex is exempt (not in the checked methods)
    {
      code: `expect(() => fn()).toThrow(/error/u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Anchored toHaveText in spec file
    {
      code: `expect(locator).toHaveText(/^Hello world$/u);`,
      filename: '/project/src/e2e/quest.spec.ts',
    },

    // Non-test file — not checked
    {
      code: `expect(text).toMatch(/unanchored/u);`,
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // String argument (not regex) — not checked
    {
      code: `expect(text).toMatch('string literal');`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Not on expect chain — not checked
    {
      code: `someLib.toMatch(/unanchored/u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // expect.stringMatching with proper full anchors — allowed
    {
      code: `expect.stringMatching(/^exact-format$/u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // expect.stringMatching with UUID pattern — allowed
    {
      code: `expect.stringMatching(/^[0-9a-f-]{36}$/u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // expect.stringMatching in non-test file — not checked
    {
      code: `expect.stringMatching(/partial/u);`,
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // expect.stringMatching with string argument — not checked
    {
      code: `expect.stringMatching('literal');`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
  ],
  invalid: [
    // Unanchored toMatch
    {
      code: `expect(text).toMatch(/some text/u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'toMatch' },
        },
      ],
    },

    // Unanchored toMatch with simple pattern
    {
      code: `expect(text).toMatch(/error/u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'toMatch' },
        },
      ],
    },

    // Unanchored toMatch in spec file
    {
      code: `expect(text).toMatch(/Build auth flow/u);`,
      filename: '/project/src/e2e/quest.spec.ts',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'toMatch' },
        },
      ],
    },

    // Unanchored toHaveText
    {
      code: `expect(locator).toHaveText(/partial text/u);`,
      filename: '/project/src/e2e/quest.spec.ts',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'toHaveText' },
        },
      ],
    },

    // Unanchored toContainText
    {
      code: `expect(locator).toContainText(/fragment/u);`,
      filename: '/project/src/e2e/quest.spec.ts',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'toContainText' },
        },
      ],
    },

    // TSX test file
    {
      code: `expect(content).toMatch(/Build auth flow/u);`,
      filename: '/project/src/widgets/button/button-widget.test.tsx',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'toMatch' },
        },
      ],
    },

    // Unanchored expect.stringMatching
    {
      code: `expect.stringMatching(/partial/u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'expect.stringMatching' },
        },
      ],
    },

    // Start anchor only — still partial on the right
    {
      code: `expect(text).toMatch(/^Error: /u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'toMatch' },
        },
      ],
    },

    // End anchor only — still partial on the left
    {
      code: `expect(text).toMatch(/\\.ts$/u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'toMatch' },
        },
      ],
    },

    // expect.stringMatching with start anchor only
    {
      code: `expect.stringMatching(/^Error: /u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'expect.stringMatching' },
        },
      ],
    },

    // Wildcard-padded expect.stringMatching
    {
      code: `expect.stringMatching(/^.*partial.*$/u);`,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'unanchoredRegex',
          data: { method: 'expect.stringMatching' },
        },
      ],
    },
  ],
});
