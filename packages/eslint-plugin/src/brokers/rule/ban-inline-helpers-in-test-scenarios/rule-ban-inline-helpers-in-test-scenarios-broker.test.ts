import { ruleBanInlineHelpersInTestScenariosBroker } from './rule-ban-inline-helpers-in-test-scenarios-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run(
  'ban-inline-helpers-in-test-scenarios',
  ruleBanInlineHelpersInTestScenariosBroker(),
  {
    valid: [
      // Non-scenario files can have top-level helpers
      {
        code: 'const createQuest = ({ id }: { id: string }) => { return { id }; };',
        filename: '/project/src/brokers/quest/quest-broker.ts',
      },

      // Harness files can have top-level helpers
      {
        code: 'const createQuest = ({ id }: { id: string }) => { return { id }; };',
        filename: '/project/test/harnesses/quest/quest.harness.ts',
      },

      // Constants are fine in spec files (no block body)
      {
        code: 'const TIMEOUT = 5000;',
        filename: '/project/e2e/web/smoke.spec.ts',
      },

      // Arrow functions with expression body are fine (simple transforms)
      {
        code: 'const extractId = (guild: { id: string }) => guild.id;',
        filename: '/project/e2e/web/smoke.spec.ts',
      },

      // String constants are fine
      {
        code: "const GUILD_PATH = '/tmp/dm-e2e-guild';",
        filename: '/project/e2e/web/smoke.spec.ts',
      },

      // Regular test files (not spec or integration) are not checked
      {
        code: 'const helper = ({ x }: { x: number }) => { return x + 1; };',
        filename: '/project/src/brokers/user/user-broker.test.ts',
      },
    ],

    invalid: [
      // Block-body arrow function in spec file
      {
        code: 'const createQuest = ({ id }: { id: string }) => { return { id }; };',
        filename: '/project/e2e/web/quest-creation.spec.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },

      // Block-body arrow function in integration test
      {
        code: 'const setupEnv = () => { process.env.HOME = "/tmp"; };',
        filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },

      // Exported block-body arrow function in spec file
      {
        code: 'export const navigateToSession = ({ page }: { page: unknown }) => { return page; };',
        filename: '/project/e2e/web/smoke.spec.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },

      // Async block-body arrow function in spec file
      {
        code: 'const pollStatus = async ({ id }: { id: string }) => { const result = await fetch(id); return result; };',
        filename: '/project/e2e/web/quest-start.spec.ts',
        errors: [{ messageId: 'noInlineHelper' }],
      },
    ],
  },
);
