import { ruleGatewayImportBoundaryBroker } from './rule-gateway-import-boundary-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

// Every case passes `scope` explicitly (except the non-gateway-file cases, which return before
// scope is ever read) so this rule's own unit test never falls through to the real filesystem walk.
ruleTester.run('gateway-import-boundary', ruleGatewayImportBoundaryBroker(), {
  valid: [
    // --- outside packages are exactly what a gateway file is for ---
    {
      code: "import { readFile } from 'fs/promises';",
      filename: '/repo/packages/@gateway/node/src/fs/promises/read-file.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import { z } from 'zod';",
      filename: '/repo/packages/@gateway/npm/src/zod/index.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- relative imports inside the same gateway package are allowed ---
    {
      code: "import { isFsError } from '../is-fs-error';",
      filename: '/repo/packages/@gateway/node/src/fs/promises/read-file.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- another gateway package, and a subpath of one, are allowed ---
    {
      code: "import { glob } from '@dungeonmaster/npm/glob';",
      filename: '/repo/packages/@gateway/node/src/fs/glob-sync.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import { currentBranch } from '@dungeonmaster/bin/git';",
      filename: '/repo/packages/@gateway/node/src/child_process/run.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import mod = require('@dungeonmaster/npm');",
      filename: '/repo/packages/@gateway/bin/src/git/git-run.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- the '#gateway/<folder>' import-alias form names another gateway package exactly like
    // the '@scope/<folder>' form does above ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/@gateway/node/src/fs/glob-sync.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import mod = require('#gateway/npm');",
      filename: '/repo/packages/@gateway/bin/src/git/git-run.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- a non-gateway file is untouched, even importing another workspace package ---
    {
      code: "import { userContract } from '@dungeonmaster/shared/contracts';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- consumer scope other than @dungeonmaster: its own gateway packages are allowed ---
    {
      code: "import { readFile } from '@acme/node/fs';",
      filename: '/repo/packages/@gateway/node/src/child_process/run.ts',
      options: [{ scope: '@acme' }],
    },

    // --- @<scope>/testing is allowed from every test-support file suffix ---
    {
      code: "import { registerMock } from '@dungeonmaster/testing/register-mock';",
      filename: '/repo/packages/@gateway/node/src/fs/read-file.proxy.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import { registerMock } from '@dungeonmaster/testing/register-mock';",
      filename: '/repo/packages/@gateway/node/src/fs/read-file.test.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import { installTestbedCreateBroker } from '@dungeonmaster/testing';",
      filename: '/repo/packages/@gateway/node/src/fs/read-file.integration.test.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import { FilePathStub } from '@dungeonmaster/testing/stub';",
      filename: '/repo/packages/@gateway/node/src/fs/read-file.stub.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
  ],

  invalid: [
    // --- shared is our own logic, not the gateway ---
    {
      code: "import { userContract } from '@dungeonmaster/shared/contracts';",
      filename: '/repo/packages/@gateway/node/src/fs/read-file-sync.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'workspacePackageImport',
          data: { importSource: '@dungeonmaster/shared/contracts', scope: '@dungeonmaster' },
        },
      ],
    },
    // --- a bare workspace main-barrel import ---
    {
      code: "import { x } from '@dungeonmaster/orchestrator';",
      filename: '/repo/packages/@gateway/bin/src/git/git-run.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'workspacePackageImport',
          data: { importSource: '@dungeonmaster/orchestrator', scope: '@dungeonmaster' },
        },
      ],
    },
    // --- export ... from is flagged (ExportNamedDeclaration) ---
    {
      code: "export { x } from '@dungeonmaster/shared/brokers';",
      filename: '/repo/packages/@gateway/browser/src/fetch/fetch-json.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'workspacePackageImport',
          data: { importSource: '@dungeonmaster/shared/brokers', scope: '@dungeonmaster' },
        },
      ],
    },
    // --- export * from is flagged (ExportAllDeclaration) ---
    {
      code: "export * from '@dungeonmaster/shared/statics';",
      filename: '/repo/packages/@gateway/node/src/fs/index.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'workspacePackageImport',
          data: { importSource: '@dungeonmaster/shared/statics', scope: '@dungeonmaster' },
        },
      ],
    },
    // --- type-only import is still flagged: the gateway never depends on our own types either ---
    {
      code: "import type { Quest } from '@dungeonmaster/shared/contracts';",
      filename: '/repo/packages/@gateway/node/src/fs/read-file.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'workspacePackageImport',
          data: { importSource: '@dungeonmaster/shared/contracts', scope: '@dungeonmaster' },
        },
      ],
    },
    // --- require() of our own package ---
    {
      code: "const shared = require('@dungeonmaster/shared/adapters');",
      filename: '/repo/packages/@gateway/bin/src/npm/npm-run.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'workspacePackageImport',
          data: { importSource: '@dungeonmaster/shared/adapters', scope: '@dungeonmaster' },
        },
      ],
    },
    // --- require.resolve() of our own package ---
    {
      code: "const p = require.resolve('@dungeonmaster/config');",
      filename: '/repo/packages/@gateway/node/src/module/resolve-package-root.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'workspacePackageImport',
          data: { importSource: '@dungeonmaster/config', scope: '@dungeonmaster' },
        },
      ],
    },
    // --- consumer scope other than @dungeonmaster maps the same way ---
    {
      code: "import { x } from '@acme/shared/contracts';",
      filename: '/repo/packages/@gateway/node/src/fs/read-file.ts',
      options: [{ scope: '@acme' }],
      errors: [
        {
          messageId: 'workspacePackageImport',
          data: { importSource: '@acme/shared/contracts', scope: '@acme' },
        },
      ],
    },
    // --- @<scope>/testing from a RUNTIME gateway file is still banned: test support is not a runtime layer ---
    {
      code: "import { registerMock } from '@dungeonmaster/testing/register-mock';",
      filename: '/repo/packages/@gateway/node/src/fs/read-file.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'workspacePackageImport',
          data: { importSource: '@dungeonmaster/testing/register-mock', scope: '@dungeonmaster' },
        },
      ],
    },
    // --- index.ts is a runtime file too, not a test-support suffix ---
    {
      code: "import { installTestbedCreateBroker } from '@dungeonmaster/testing';",
      filename: '/repo/packages/@gateway/node/src/fs/index.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'workspacePackageImport',
          data: { importSource: '@dungeonmaster/testing', scope: '@dungeonmaster' },
        },
      ],
    },
  ],
});
