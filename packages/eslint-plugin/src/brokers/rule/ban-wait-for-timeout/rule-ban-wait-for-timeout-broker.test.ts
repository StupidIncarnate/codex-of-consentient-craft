import { ruleBanWaitForTimeoutBroker } from './rule-ban-wait-for-timeout-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-wait-for-timeout', ruleBanWaitForTimeoutBroker(), {
  valid: [
    // waitForTimeout in a non-spec file is allowed
    {
      code: 'page.waitForTimeout(500);',
      filename: '/project/src/helpers/wait-helper.ts',
    },
    // Different method name in a spec file is allowed
    {
      code: "page.waitForResponse('https://api.example.com');",
      filename: '/project/e2e/web/navigation.spec.ts',
    },
    // Unrelated method call in a spec file is allowed
    {
      code: 'someObj.doSomething();',
      filename: '/project/e2e/web/navigation.spec.ts',
    },
  ],
  invalid: [
    // page.waitForTimeout in a spec file
    {
      code: 'page.waitForTimeout(500);',
      filename: '/project/e2e/web/navigation.spec.ts',
      errors: [
        {
          messageId: 'noWaitForTimeout',
        },
      ],
    },
    // Different object name holding a page reference
    {
      code: 'myPage.waitForTimeout(3000);',
      filename: '/project/e2e/web/floor-ordering.spec.ts',
      errors: [
        {
          messageId: 'noWaitForTimeout',
        },
      ],
    },
  ],
});
