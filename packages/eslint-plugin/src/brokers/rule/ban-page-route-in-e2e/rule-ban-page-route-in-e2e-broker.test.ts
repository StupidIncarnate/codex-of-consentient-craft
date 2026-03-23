import { ruleBanPageRouteInE2eBroker } from './rule-ban-page-route-in-e2e-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-page-route-in-e2e', ruleBanPageRouteInE2eBroker(), {
  valid: [
    // --- Non-spec files are not checked ---
    {
      code: "page.route('/api/*', handler)",
      filename: '/project/src/helpers/route-setup.ts',
    },
    {
      code: "page.route('/api/*', handler)",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },
    {
      code: "page.route('/api/*', handler)",
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
    },
    {
      code: "page.route('/api/*', handler)",
      filename: '/project/src/brokers/guild/guild-broker.test.ts',
    },

    // --- Different object name (not page) ---
    {
      code: "router.route('/api/*')",
      filename: '/project/e2e/web/smoke.spec.ts',
    },
    {
      code: "app.route('/api/*')",
      filename: '/project/e2e/web/smoke.spec.ts',
    },

    // --- Different method name on page ---
    {
      code: "page.goto('/some-url')",
      filename: '/project/e2e/web/smoke.spec.ts',
    },
    {
      code: "page.waitForResponse((r) => r.url().includes('/api'))",
      filename: '/project/e2e/web/smoke.spec.ts',
    },
    {
      code: "page.getByTestId('CHAT_INPUT').fill('hello')",
      filename: '/project/e2e/web/smoke.spec.ts',
    },
  ],
  invalid: [
    // --- page.route() in spec files ---
    {
      code: "page.route('/api/*', (route) => route.fulfill({body: '{}'}))",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [{ messageId: 'noPageRoute' }],
    },
    {
      code: "page.route('**/*.css', route => route.abort())",
      filename: '/project/e2e/web/network.spec.ts',
      errors: [{ messageId: 'noPageRoute' }],
    },

    // --- await page.route() ---
    {
      code: "await page.route('/api/guilds', (route) => route.fulfill({body: '[]'}))",
      filename: '/project/e2e/web/guild-creation.spec.ts',
      errors: [{ messageId: 'noPageRoute' }],
    },

    // --- page.route() inside test.describe ---
    {
      code: "test.describe('Suite', () => { test('test', async ({ page }) => { page.route('/api/*', handler); }); });",
      filename: '/project/e2e/web/quest-detail.spec.ts',
      errors: [{ messageId: 'noPageRoute' }],
    },

    // --- page.route() inside test.beforeEach ---
    {
      code: "test.beforeEach(async ({ page }) => { page.route('/api/*', handler); });",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [{ messageId: 'noPageRoute' }],
    },

    // --- Multiple violations ---
    {
      code: "page.route('/api/guilds', handler);\npage.route('/api/quests', handler);",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [{ messageId: 'noPageRoute' }, { messageId: 'noPageRoute' }],
    },
  ],
});
