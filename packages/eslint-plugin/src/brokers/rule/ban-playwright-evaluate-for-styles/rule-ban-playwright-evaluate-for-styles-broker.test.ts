import { ruleBanPlaywrightEvaluateForStylesBroker } from './rule-ban-playwright-evaluate-for-styles-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-playwright-evaluate-for-styles', ruleBanPlaywrightEvaluateForStylesBroker(), {
  valid: [
    // --- toHaveCSS is the correct Playwright assertion ---
    {
      code: "await expect(el).toHaveCSS('color', 'rgb(255, 0, 0)')",
      filename: '/project/e2e/web/smoke.spec.ts',
    },
    // --- evaluate without getComputedStyle is fine ---
    {
      code: 'await el.evaluate(() => someOtherFunction())',
      filename: '/project/e2e/web/smoke.spec.ts',
    },
    // --- evaluate with getComputedStyle in non-spec file is fine ---
    {
      code: 'await el.evaluate((e) => getComputedStyle(e).color)',
      filename: '/project/src/helpers/style-check.ts',
    },
    // --- evaluate with getComputedStyle in test file is fine ---
    {
      code: 'await el.evaluate((e) => getComputedStyle(e).color)',
      filename: '/project/src/brokers/style/style-broker.test.ts',
    },
  ],
  invalid: [
    // --- getComputedStyle in evaluate in spec file ---
    {
      code: 'await el.evaluate((e) => getComputedStyle(e).color)',
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [{ messageId: 'noEvaluateForStyles' }],
    },
    // --- window.getComputedStyle in evaluate in spec file ---
    {
      code: 'await el.evaluate((e) => window.getComputedStyle(e).backgroundColor)',
      filename: '/project/e2e/web/styles.spec.ts',
      errors: [{ messageId: 'noEvaluateForStyles' }],
    },
  ],
});
