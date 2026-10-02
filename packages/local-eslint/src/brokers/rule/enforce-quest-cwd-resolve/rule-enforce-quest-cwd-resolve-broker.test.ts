import { ruleEnforceQuestCwdResolveBroker } from './rule-enforce-quest-cwd-resolve-broker';
import { ruleTesterHarness } from '@dungeonmaster/eslint-plugin/rule-tester.harness';

const ruleTester = ruleTesterHarness();

const modifyBrokerFile =
  '/repo/packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts';
const importCode =
  "import { questRepoRootBroker } from '../../quest/repo-root/quest-repo-root-broker';";

ruleTester.run('enforce-quest-cwd-resolve', ruleEnforceQuestCwdResolveBroker(), {
  valid: [
    {
      code: importCode,
      filename:
        '/repo/packages/orchestrator/src/brokers/quest/cwd-resolve/quest-cwd-resolve-broker.ts',
    },
    {
      code: importCode,
      filename:
        '/repo/packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts',
    },
    {
      code: importCode,
      filename: '/repo/packages/orchestrator/src/brokers/quest/repo-root/quest-repo-root-broker.ts',
    },
    {
      code: importCode,
      filename: '/repo/packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.proxy.ts',
    },
    {
      code: importCode,
      filename: '/repo/packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.test.ts',
    },
    {
      code: "import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';",
      filename: modifyBrokerFile,
    },
  ],
  invalid: [
    {
      code: importCode,
      filename: modifyBrokerFile,
      errors: [{ messageId: 'questRepoRootImport' }],
    },
    {
      code: "import { questRepoRootBroker as repoRoot } from '../../quest/repo-root/quest-repo-root-broker';",
      filename: modifyBrokerFile,
      errors: [{ messageId: 'questRepoRootImport' }],
    },
    {
      code: "import { questRepoRootBroker } from '@dungeonmaster/orchestrator';",
      filename: '/repo/packages/server/src/brokers/x/x-broker.ts',
      errors: [{ messageId: 'questRepoRootImport' }],
    },
  ],
});
