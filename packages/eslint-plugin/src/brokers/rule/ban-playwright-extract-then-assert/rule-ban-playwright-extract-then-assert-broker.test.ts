import { ruleBanPlaywrightExtractThenAssertBroker } from './rule-ban-playwright-extract-then-assert-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-playwright-extract-then-assert', ruleBanPlaywrightExtractThenAssertBroker(), {
  valid: [
    // --- Correct Playwright assertions ---
    {
      code: "await expect(page.getByTestId('x')).toHaveText('hello')",
      filename: '/project/e2e/web/smoke.e2e.ts',
    },
    {
      code: "await expect(page.getByTestId('x')).toHaveValue('input')",
      filename: '/project/e2e/web/smoke.e2e.ts',
    },
    {
      code: "await expect(page.getByTestId('x')).toHaveCount(3)",
      filename: '/project/e2e/web/smoke.e2e.ts',
    },
    // --- textContent without subsequent expect is allowed ---
    {
      code: 'const text = await el.textContent()',
      filename: '/project/e2e/web/smoke.e2e.ts',
    },
    // --- Extract-then-assert in non-spec file is not checked ---
    {
      code: "const text = await el.textContent();\nexpect(text).toBe('hello')",
      filename: '/project/src/brokers/style/style-broker.test.ts',
    },
  ],
  invalid: [
    // --- textContent extract then assert ---
    {
      code: "const text = await el.textContent();\nexpect(text).toBe('hello')",
      filename: '/project/e2e/web/smoke.e2e.ts',
      errors: [
        {
          messageId: 'extractThenAssert',
          data: { method: 'textContent', replacement: 'toHaveText' },
        },
      ],
    },
    // --- inputValue extract then assert ---
    {
      code: "const val = await el.inputValue();\nexpect(val).toBe('test')",
      filename: '/project/e2e/web/form.e2e.ts',
      errors: [
        {
          messageId: 'extractThenAssert',
          data: { method: 'inputValue', replacement: 'toHaveValue' },
        },
      ],
    },
    // --- count extract then assert ---
    {
      code: 'const count = await el.count();\nexpect(count).toBe(3)',
      filename: '/project/e2e/web/list.e2e.ts',
      errors: [
        {
          messageId: 'extractThenAssert',
          data: { method: 'count', replacement: 'toHaveCount' },
        },
      ],
    },
  ],
});
