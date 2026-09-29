import { ruleBanTestSupportInProductionBroker } from './rule-ban-test-support-in-production-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

const ruleTester = ruleTesterHarness();

ruleTester.run('ban-test-support-in-production', ruleBanTestSupportInProductionBroker(), {
  valid: [
    // A test imports each stub and proxy from its own file
    {
      code: `import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';`,
      filename: '/project/src/brokers/quest/get/quest-get-broker.test.ts',
    },
    {
      code: `import { questGetBrokerProxy } from './quest-get-broker.proxy';`,
      filename: '/project/src/brokers/quest/get/quest-get-broker.integration.test.ts',
    },

    // A proxy, a stub and a harness are test support themselves
    {
      code: `import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';`,
      filename: '/project/src/brokers/quest/get/quest-get-broker.proxy.ts',
    },
    {
      code: `export * from './quest-layer.stub';`,
      filename: '/project/src/contracts/quest/quest.stub.ts',
    },
    {
      code: `import { WardQueueResponseStub } from '@dungeonmaster/shared/contracts/ward-queue-response/ward-queue-response.stub';`,
      filename: '/project/test/harnesses/ward-mock/ward-mock.harness.ts',
    },

    // A production file imports contracts, brokers and gateways
    {
      code: `
        import { questContract } from '@dungeonmaster/shared/contracts';
        import { questGetBroker } from '../get/quest-get-broker';
        import { readFile } from '#gateway/node/fs';
      `,
      filename: '/project/src/brokers/quest/x/quest-x-broker.ts',
    },

    // A production barrel that re-exports production files only
    {
      code: `
        export * from './quest/quest-contract';
        export type { Quest } from './quest/quest-contract';
      `,
      filename: '/project/src/contracts/contracts.ts',
    },

    // A name ending Proxy or Stub from an npm package is not ours
    {
      code: `import { createProxy } from 'http-proxy';`,
      filename: '/project/src/brokers/net/x/net-x-broker.ts',
    },
  ],
  invalid: [
    // A production file imports a stub from its own file
    {
      code: `import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';`,
      filename: '/project/src/brokers/quest/x/quest-x-broker.ts',
      errors: [{ messageId: 'testSupportInProduction' }],
    },
    // A relative proxy import
    {
      code: `import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';`,
      filename: '/project/src/brokers/quest/x/quest-x-broker.ts',
      errors: [{ messageId: 'testSupportInProduction' }],
    },
    // A stub name through a barrel that hides the file
    {
      code: `import { QuestStub } from '@dungeonmaster/shared/contracts';`,
      filename: '/project/src/transformers/quest-x/quest-x-transformer.ts',
      errors: [{ messageId: 'testSupportInProduction' }],
    },
    // A relative barrel import of a proxy name
    {
      code: `import { xBrokerProxy } from '../x';`,
      filename: '/project/src/brokers/quest/x/quest-x-broker.ts',
      errors: [{ messageId: 'testSupportInProduction' }],
    },
    // A production barrel re-exporting a stub file
    {
      code: `export * from './quest/quest.stub';`,
      filename: '/project/src/contracts/contracts.ts',
      errors: [{ messageId: 'testSupportInProduction' }],
    },
    // A production barrel re-exporting a stub by name
    {
      code: `export { QuestStub } from './quest/quest-contract';`,
      filename: '/project/src/contracts/contracts.ts',
      errors: [{ messageId: 'testSupportInProduction' }],
    },
    // Two names from one import report once each
    {
      code: `import { AStub, BProxy, realThing } from '../things';`,
      filename: '/project/src/brokers/quest/x/quest-x-broker.ts',
      errors: [{ messageId: 'testSupportInProduction' }, { messageId: 'testSupportInProduction' }],
    },
  ],
});
