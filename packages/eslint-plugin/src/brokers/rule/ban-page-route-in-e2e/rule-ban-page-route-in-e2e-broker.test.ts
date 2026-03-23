import { ruleBanPageRouteInE2eBroker } from './rule-ban-page-route-in-e2e-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-page-route-in-e2e', ruleBanPageRouteInE2eBroker(), {
  valid: [
    // page.route() in a non-spec file (regular code) is allowed
    {
      code: "page.route('/api/*', handler)",
      filename: '/project/src/helpers/route-setup.ts',
    },
    // router.route() in a spec file is allowed (not page.route)
    {
      code: "router.route('/api/*')",
      filename: '/project/e2e/web/smoke.spec.ts',
    },
    // page.goto() in a spec file is allowed (different method)
    {
      code: "page.goto('/some-url')",
      filename: '/project/e2e/web/smoke.spec.ts',
    },
  ],
  invalid: [
    // page.route() with fulfill in a spec file
    {
      code: "page.route('/api/*', (route) => route.fulfill({body: '{}'}))",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noPageRoute',
        },
      ],
    },
    // page.route() with abort in a spec file
    {
      code: "page.route('**/*.css', route => route.abort())",
      filename: '/project/e2e/web/network.spec.ts',
      errors: [
        {
          messageId: 'noPageRoute',
        },
      ],
    },
  ],
});
