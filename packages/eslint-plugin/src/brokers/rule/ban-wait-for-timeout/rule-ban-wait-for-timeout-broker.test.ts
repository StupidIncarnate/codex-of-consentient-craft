import { ruleBanWaitForTimeoutBroker } from './rule-ban-wait-for-timeout-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-wait-for-timeout', ruleBanWaitForTimeoutBroker(), {
  valid: [
    // --- Non-spec files are not checked ---
    {
      code: 'page.waitForTimeout(500);',
      filename: '/project/src/helpers/wait-helper.ts',
    },
    {
      code: 'setTimeout(() => {}, 1000);',
      filename: '/project/src/brokers/delay/delay-broker.ts',
    },
    // (integration tests ARE checked — setTimeout is banned there too)

    // --- Different Playwright methods are fine ---
    {
      code: "page.waitForResponse('https://api.example.com');",
      filename: '/project/e2e/web/navigation.e2e.ts',
    },
    {
      code: "page.waitForRequest((req) => req.url().includes('/api/guilds'));",
      filename: '/project/e2e/web/quest-approve.e2e.ts',
    },
    {
      code: 'page.waitForURL(/\\/session\\//u, { timeout: 5000 });',
      filename: '/project/e2e/web/chat-history.e2e.ts',
    },
    {
      code: 'page.goto("/dashboard");',
      filename: '/project/e2e/web/smoke.e2e.ts',
    },
    {
      code: 'someObj.doSomething();',
      filename: '/project/e2e/web/navigation.e2e.ts',
    },

    // --- setTimeout inside page.evaluate() is browser-side code ---
    {
      code: 'page.evaluate(() => { globalThis.setTimeout(() => { ws.close(); }, 500); });',
      filename: '/project/e2e/web/session-id-routing.e2e.ts',
    },
    {
      code: 'page.evaluate(() => { setTimeout(() => resolve(), 100); });',
      filename: '/project/e2e/web/session-id-routing.e2e.ts',
    },

    // --- Playwright expect with timeout option is fine ---
    {
      code: "await expect(page.getByTestId('QUEST_CHAT')).toBeVisible({ timeout: 5000 });",
      filename: '/project/e2e/web/quest-detail.e2e.ts',
    },
  ],

  invalid: [
    // --- page.waitForTimeout() ---
    {
      code: 'page.waitForTimeout(500);',
      filename: '/project/e2e/web/navigation.e2e.ts',
      errors: [{ messageId: 'noWaitForTimeout' }],
    },
    {
      code: 'myPage.waitForTimeout(3000);',
      filename: '/project/e2e/web/floor-ordering.e2e.ts',
      errors: [{ messageId: 'noWaitForTimeout' }],
    },
    {
      code: 'await page.waitForTimeout(2000);',
      filename: '/project/e2e/web/quest-approved-modal.e2e.ts',
      errors: [{ messageId: 'noWaitForTimeout' }],
    },

    // --- bare setTimeout() ---
    {
      code: 'setTimeout(() => {}, 1000);',
      filename: '/project/e2e/web/smoke.e2e.ts',
      errors: [{ messageId: 'noSetTimeout' }],
    },
    {
      code: 'setTimeout(resolve, 250);',
      filename: '/project/e2e/web/quest-start.e2e.ts',
      errors: [{ messageId: 'noSetTimeout' }],
    },

    // --- globalThis.setTimeout() outside page.evaluate ---
    {
      code: 'globalThis.setTimeout(() => { cleanup(); }, 500);',
      filename: '/project/e2e/web/chat-stop.e2e.ts',
      errors: [{ messageId: 'noSetTimeout' }],
    },

    // --- test.setTimeout() — no artificial timeout manipulation ---
    {
      code: 'test.setTimeout(30000);',
      filename: '/project/e2e/web/ward-execution-streaming.e2e.ts',
      errors: [{ messageId: 'noSetTimeout' }],
    },

    // --- new Promise with setTimeout (the delay wrapper pattern) ---
    {
      code: 'await new Promise((resolve) => { setTimeout(resolve, 500); });',
      filename: '/project/e2e/web/quest-approved-modal.e2e.ts',
      errors: [{ messageId: 'noSetTimeout' }],
    },

    // --- setTimeout in integration tests ---
    {
      code: 'setTimeout(() => {}, 250);',
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [{ messageId: 'noSetTimeout' }],
    },
    {
      code: 'await new Promise((resolve) => { setTimeout(resolve, 250); });',
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [{ messageId: 'noSetTimeout' }],
    },

    // --- multiple violations in one file ---
    {
      code: 'page.waitForTimeout(500);\nsetTimeout(() => {}, 1000);',
      filename: '/project/e2e/web/smoke.e2e.ts',
      errors: [{ messageId: 'noWaitForTimeout' }, { messageId: 'noSetTimeout' }],
    },
  ],
});
