import { ruleBanInlineHelpersInTestScenariosBroker } from './rule-ban-inline-helpers-in-test-scenarios-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run(
  'ban-inline-helpers-in-test-scenarios',
  ruleBanInlineHelpersInTestScenariosBroker(),
  {
    valid: [
      // --- Non-scenario files are not checked ---
      {
        code: 'const createQuest = ({ id }: { id: string }) => { return { id }; };',
        filename: '/project/src/brokers/quest/quest-broker.ts',
      },
      {
        code: 'const helper = ({ x }: { x: number }) => { return x + 1; };',
        filename: '/project/src/brokers/user/user-broker.test.ts',
      },

      // --- Harness files are not checked ---
      {
        code: 'const createQuest = ({ id }: { id: string }) => { return { id }; };',
        filename: '/project/test/harnesses/quest/quest.harness.ts',
      },

      // --- Constants are fine (no block body) ---
      {
        code: 'const TIMEOUT = 5000;',
        filename: '/project/e2e/web/smoke.spec.ts',
      },
      {
        code: "const GUILD_PATH = '/tmp/dm-e2e-guild';",
        filename: '/project/e2e/web/smoke.spec.ts',
      },
      {
        code: 'const HTTP_OK = 200;',
        filename: '/project/e2e/web/chat-features.spec.ts',
      },

      // --- Expression-body arrows are fine (simple transforms) ---
      {
        code: 'const extractId = (guild: { id: string }) => guild.id;',
        filename: '/project/e2e/web/smoke.spec.ts',
      },
      {
        code: "const extractGuildId = (guild: Record<string, unknown>) => `${guild.id}`;",
        filename: '/project/e2e/web/chat-features.spec.ts',
      },

      // --- Helpers inside test() callbacks are fine ---
      {
        code: "test('my test', async () => { const setupState = () => { return { ready: true }; }; setupState(); });",
        filename: '/project/e2e/web/smoke.spec.ts',
      },

      // --- Helpers inside it() callbacks are fine ---
      {
        code: "it('VALID: creates guild', async () => { const buildPayload = () => { return { name: 'Test' }; }; buildPayload(); });",
        filename:
          '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      },

      // --- Helpers inside describe() callbacks are fine ---
      {
        code: "describe('Guild Creation', () => { const createGuildData = () => { return { name: 'Test Guild' }; }; });",
        filename: '/project/e2e/web/guild-creation.spec.ts',
      },

      // --- Helpers inside test.describe() callbacks are fine ---
      {
        code: "test.describe('Chat Features', () => { const queueResponse = () => { return { text: 'hello' }; }; });",
        filename: '/project/e2e/web/chat-features.spec.ts',
      },

      // --- Playwright test.beforeEach with arrow inside is fine ---
      {
        code: "test.beforeEach(async () => { const cleanAll = async () => { await fetch('/api/guilds'); }; await cleanAll(); });",
        filename: '/project/e2e/web/smoke.spec.ts',
      },

      // --- Array/object constants are fine ---
      {
        code: "const VISIBLE_ROLES = ['chaoswhisperer', 'pathseeker', 'codeweaver'];",
        filename: '/project/e2e/web/session-id-routing.spec.ts',
      },
      {
        code: "const ROLE_FLOOR_MAP: Record<string, string> = { chaoswhisperer: 'SANCTUM' };",
        filename: '/project/e2e/web/session-id-routing.spec.ts',
      },
    ],

    invalid: [
      // --- Top-level block-body arrow in spec file ---
      {
        code: 'const createQuest = ({ id }: { id: string }) => { return { id }; };',
        filename: '/project/e2e/web/quest-creation.spec.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },

      // --- Top-level block-body arrow in integration test ---
      {
        code: 'const setupEnv = () => { process.env.HOME = "/tmp"; };',
        filename:
          '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },

      // --- Exported top-level helper in spec file ---
      {
        code: 'export const navigateToSession = ({ page }: { page: unknown }) => { return page; };',
        filename: '/project/e2e/web/smoke.spec.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },

      // --- Async top-level helper in spec file ---
      {
        code: 'const pollStatus = async ({ id }: { id: string }) => { const result = await fetch(id); return result; };',
        filename: '/project/e2e/web/quest-start.spec.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },

      // --- Real pattern: createQuestFile helper at top level in spec ---
      {
        code: "const createQuestFile = ({ guildId, questId }: { guildId: string; questId: string }) => { const dir = '/tmp/' + guildId; return dir + questId; };",
        filename: '/project/e2e/web/quest-approve.spec.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },

      // --- Real pattern: navigateToSession helper at top level ---
      {
        code: "const navigateToSession = async ({ urlSlug, sessionId }: { urlSlug: string; sessionId: string }) => { await fetch('/' + urlSlug + '/session/' + sessionId); };",
        filename: '/project/e2e/web/quest-approved-modal.spec.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },

      // --- Real pattern: patchQuestStatus at top level ---
      {
        code: "const patchQuestStatus = async ({ questId, status }: { questId: string; status: string }) => { await fetch('/api/quests/' + questId, { method: 'PATCH' }); };",
        filename: '/project/e2e/web/quest-begin-transition.spec.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },

      // --- Multiple top-level helpers (each flagged) ---
      {
        code: 'const helperA = () => { return 1; };\nconst helperB = () => { return 2; };',
        filename: '/project/e2e/web/smoke.spec.ts',
        errors: [{ messageId: 'noInlineHelper' }, { messageId: 'noInlineHelper' }],
      },
    ],
  },
);
