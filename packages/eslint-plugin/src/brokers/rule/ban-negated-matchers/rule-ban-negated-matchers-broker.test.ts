import { ruleBanNegatedMatchersBroker } from './rule-ban-negated-matchers-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-negated-matchers', ruleBanNegatedMatchersBroker(), {
  valid: [
    // Positive assertion is fine
    {
      code: "expect(value).toBe('hello');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // toStrictEqual is fine
    {
      code: 'expect(result).toStrictEqual({ id: 1 });',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // toThrow is fine (positive)
    {
      code: "expect(() => fn()).toThrow('error');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Non-test files are not checked
    {
      code: "expect(value).not.toBe('wrong');",
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // Not on an expect chain
    {
      code: "someLib.not.toBe('hello');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Playwright spec files — allowed Playwright visibility matchers with .not
    {
      code: 'await expect(locator).not.toBeVisible();',
      filename: '/project/src/e2e/quest.spec.ts',
    },

    // Playwright .not.toBeEnabled() in e2e files
    {
      code: 'await expect(locator).not.toBeEnabled();',
      filename: '/project/src/e2e/form.e2e.test.ts',
    },

    // Playwright .not.toBeHidden() in e2e files
    {
      code: 'await expect(locator).not.toBeHidden();',
      filename: '/project/src/e2e/login.e2e.test.ts',
    },

    // Playwright .not.toBeInTheDocument() in e2e tsx files
    {
      code: 'await expect(locator).not.toBeInTheDocument();',
      filename: '/project/src/e2e/login.e2e.test.tsx',
    },

    // Playwright .not.toBeDisabled() in spec files
    {
      code: 'await expect(locator).not.toBeDisabled();',
      filename: '/project/src/e2e/quest.spec.ts',
    },

    // Playwright .not.toBeChecked() in spec files
    {
      code: 'await expect(locator).not.toBeChecked();',
      filename: '/project/src/e2e/quest.spec.ts',
    },

    // Playwright .not.toBeEmpty() in spec files
    {
      code: 'await expect(locator).not.toBeEmpty();',
      filename: '/project/src/e2e/quest.spec.ts',
    },

    // Playwright .not.toHaveCount() in spec files
    {
      code: 'await expect(locator).not.toHaveCount(0);',
      filename: '/project/src/e2e/quest.spec.ts',
    },
  ],

  invalid: [
    // .not.toBe
    {
      code: "expect(value).not.toBe('wrong');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noNegatedMatcher', data: { matcher: 'toBe' } }],
    },

    // .not.toStrictEqual
    {
      code: 'expect(result).not.toStrictEqual({ id: 1 });',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noNegatedMatcher', data: { matcher: 'toStrictEqual' } }],
    },

    // .not.toHaveBeenCalled
    {
      code: 'expect(fn).not.toHaveBeenCalled();',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noNegatedMatcher', data: { matcher: 'toHaveBeenCalled' } }],
    },

    // .not.toThrow (overlaps with ban-not-to-throw but this rule is broader)
    {
      code: 'expect(() => fn()).not.toThrow();',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [{ messageId: 'noNegatedMatcher', data: { matcher: 'toThrow' } }],
    },

    // TSX test file
    {
      code: "expect(value).not.toBe('wrong');",
      filename: '/project/src/widgets/button/button-widget.test.tsx',
      errors: [{ messageId: 'noNegatedMatcher', data: { matcher: 'toBe' } }],
    },

    // Integration test files are still checked (not Playwright)
    {
      code: "expect(value).not.toBe('wrong');",
      filename: '/project/src/brokers/user/user-broker.integration.test.ts',
      errors: [{ messageId: 'noNegatedMatcher', data: { matcher: 'toBe' } }],
    },

    // .not.toBe(null) in spec files is NOT allowed (not in Playwright allowlist)
    {
      code: 'expect(value).not.toBe(null);',
      filename: '/project/src/e2e/quest.spec.ts',
      errors: [{ messageId: 'noNegatedMatcher', data: { matcher: 'toBe' } }],
    },

    // .not.toHaveBeenCalled() in e2e files is NOT allowed
    {
      code: 'expect(fn).not.toHaveBeenCalled();',
      filename: '/project/src/e2e/form.e2e.test.ts',
      errors: [{ messageId: 'noNegatedMatcher', data: { matcher: 'toHaveBeenCalled' } }],
    },

    // .not.toStrictEqual() in spec files is NOT allowed
    {
      code: 'expect(result).not.toStrictEqual({ id: 1 });',
      filename: '/project/src/e2e/quest.spec.ts',
      errors: [{ messageId: 'noNegatedMatcher', data: { matcher: 'toStrictEqual' } }],
    },
  ],
});
