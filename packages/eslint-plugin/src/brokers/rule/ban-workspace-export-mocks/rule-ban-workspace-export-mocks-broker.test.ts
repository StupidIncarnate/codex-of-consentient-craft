import { ruleBanWorkspaceExportMocksBroker } from './rule-ban-workspace-export-mocks-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

const WORKSPACE_PACKAGE_NAMES = [
  '@dungeonmaster/orchestrator',
  '@dungeonmaster/server',
  '@dungeonmaster/mcp',
];

ruleTester.run('ban-workspace-export-mocks', ruleBanWorkspaceExportMocksBroker(), {
  valid: [
    // --- no options configured: nothing is flagged ---
    {
      code: "import { StartOrchestrator } from '@dungeonmaster/orchestrator';\nregisterMock({ fn: StartOrchestrator.getQuest });",
      filename: '/repo/packages/server/src/responders/quest/get/quest-get-responder.proxy.ts',
    },
    // --- orchestrator's own proxy mocking its own package's export ---
    {
      code: "import { StartOrchestrator } from '@dungeonmaster/orchestrator';\nregisterMock({ fn: StartOrchestrator.getQuest });",
      filename: '/repo/packages/orchestrator/src/startup/start-orchestrator.proxy.ts',
      options: [{ workspacePackageNames: WORKSPACE_PACKAGE_NAMES }],
    },
    // --- registerModuleMock of the file's own package ---
    {
      code: "registerModuleMock({ module: '@dungeonmaster/orchestrator', factory: () => ({}) });",
      filename: '/repo/packages/orchestrator/src/startup/start-orchestrator.proxy.ts',
      options: [{ workspacePackageNames: WORKSPACE_PACKAGE_NAMES }],
    },
    // --- mocking something never imported from any workspace package (an npm dependency) ---
    {
      code: "import { readFileSync } from 'fs';\nregisterMock({ fn: readFileSync });",
      filename:
        '/repo/packages/server/src/adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy.ts',
      options: [{ workspacePackageNames: WORKSPACE_PACKAGE_NAMES }],
    },
    // --- composing another package's own proxy: no registerMock call at all to flag ---
    {
      code: "import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';\nconst orchestrator = StartOrchestratorProxy();",
      filename: '/repo/packages/server/src/responders/quest/get/quest-get-responder.proxy.ts',
      options: [{ workspacePackageNames: WORKSPACE_PACKAGE_NAMES }],
    },
  ],

  invalid: [
    // --- server mocking orchestrator's export directly, real shape from quest-get-responder.proxy.ts ---
    {
      code: "import { StartOrchestrator } from '@dungeonmaster/orchestrator';\nregisterMock({ fn: StartOrchestrator.getQuest });",
      filename: '/repo/packages/server/src/responders/quest/get/quest-get-responder.proxy.ts',
      options: [{ workspacePackageNames: WORKSPACE_PACKAGE_NAMES }],
      errors: [
        {
          messageId: 'composeProxy',
          data: {
            name: 'StartOrchestrator',
            specifier: '@dungeonmaster/orchestrator',
            mockFunction: 'registerMock',
          },
        },
      ],
    },
    // --- mcp mocking orchestrator's whole module via registerModuleMock ---
    {
      code: "registerModuleMock({ module: '@dungeonmaster/orchestrator', factory: () => ({}) });",
      filename: '/repo/packages/mcp/src/responders/quest/handle/quest-handle-responder.proxy.ts',
      options: [{ workspacePackageNames: WORKSPACE_PACKAGE_NAMES }],
      errors: [
        {
          messageId: 'composeProxy',
          data: {
            name: '@dungeonmaster/orchestrator',
            specifier: '@dungeonmaster/orchestrator',
            mockFunction: 'registerModuleMock',
          },
        },
      ],
    },
    // --- a renamed import binding still resolves through the LOCAL name the import map keys on ---
    {
      code: "import { StartOrchestrator as SO } from '@dungeonmaster/orchestrator';\nregisterMock({ fn: SO.getQuest });",
      filename: '/repo/packages/server/src/responders/quest/get/quest-get-responder.proxy.ts',
      options: [{ workspacePackageNames: WORKSPACE_PACKAGE_NAMES }],
      errors: [
        {
          messageId: 'composeProxy',
          data: {
            name: 'SO',
            specifier: '@dungeonmaster/orchestrator',
            mockFunction: 'registerMock',
          },
        },
      ],
    },
    // --- a subpath import of a workspace package still resolves to that package ---
    {
      code: "import { something } from '@dungeonmaster/orchestrator/testing';\nregisterMock({ fn: something.thing });",
      filename: '/repo/packages/server/src/responders/quest/get/quest-get-responder.proxy.ts',
      options: [{ workspacePackageNames: WORKSPACE_PACKAGE_NAMES }],
      errors: [
        {
          messageId: 'composeProxy',
          data: {
            name: 'something',
            specifier: '@dungeonmaster/orchestrator',
            mockFunction: 'registerMock',
          },
        },
      ],
    },
    // --- two banned mocks in one file both report ---
    {
      code: "import { StartOrchestrator } from '@dungeonmaster/orchestrator';\nregisterMock({ fn: StartOrchestrator.getQuest });\nregisterMock({ fn: StartOrchestrator.pauseQuest });",
      filename: '/repo/packages/server/src/responders/quest/get/quest-get-responder.proxy.ts',
      options: [{ workspacePackageNames: WORKSPACE_PACKAGE_NAMES }],
      errors: [{ messageId: 'composeProxy' }, { messageId: 'composeProxy' }],
    },
  ],
});
