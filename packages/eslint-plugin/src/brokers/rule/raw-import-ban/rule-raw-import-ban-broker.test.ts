import { ruleRawImportBanBroker } from './rule-raw-import-ban-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

// Every case passes `scope` explicitly (except the gateway-exempt ones, which return before scope
// is ever read) so this rule's own unit test never falls through to the real filesystem walk.
ruleTester.run('raw-import-ban', ruleRawImportBanBroker(), {
  valid: [
    // --- gateway subpath imports are workspace imports, always allowed ---
    {
      code: "import { readFileIfExists } from '@dungeonmaster/node/fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import type { Page } from '@dungeonmaster/npm/@playwright/test';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- the '#gateway/<folder>' import-alias form is a workspace import too, allowed the same way ---
    {
      code: "import { readFileIfExists } from '#gateway/node/fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import type { Page } from '#gateway/npm/playwright__test';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- any other workspace package is allowed ---
    {
      code: "import { userContract } from '@dungeonmaster/shared/contracts';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import { userContract } from '@dungeonmaster';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- relative imports are allowed ---
    {
      code: "import { helper } from './helper';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
    {
      code: "import { helper } from '../shared/helper';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- files inside the gateway are exempt, even raw fs/npm imports; the rule returns before
    // it ever reads `scope`, so these deliberately carry no `options` ---
    {
      code: "import { readFile } from 'fs/promises';",
      filename: '/repo/packages/@gateway/node/src/fs/read-file-if-exists.ts',
    },
    {
      code: "export * from 'react';",
      filename: '/repo/packages/@gateway/npm/src/react/react.ts',
    },
    {
      code: "const fs = require('fs');",
      filename: '/repo/packages/@gateway/bin/src/git/git-current-branch.ts',
    },

    // --- consumer scope other than @dungeonmaster: its own workspace imports are allowed ---
    {
      code: "import { widget } from '@acme/shared/widgets';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@acme' }],
    },
  ],

  invalid: [
    // --- bare Node built-in ---
    {
      code: "import fs from 'fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'fs', gatewayPath: '#gateway/node/fs' },
        },
      ],
    },
    // --- node: prefix stripped, message still names the gateway path with no prefix ---
    {
      code: "import fs from 'node:fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'node:fs', gatewayPath: '#gateway/node/fs' },
        },
      ],
    },
    // --- npm package ---
    {
      code: "import { z } from 'zod';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'zod', gatewayPath: '#gateway/npm/zod' },
        },
      ],
    },
    // --- type-only import is still flagged ---
    {
      code: "import type { Page } from '@playwright/test';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: {
            importSource: '@playwright/test',
            gatewayPath: '#gateway/npm/playwright__test',
          },
        },
      ],
    },
    // --- deep subpath of a scoped package ---
    {
      code: "import { Page } from '@playwright/test/reporter';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: {
            importSource: '@playwright/test/reporter',
            gatewayPath: '#gateway/npm/playwright__test__reporter',
          },
        },
      ],
    },
    // --- deep subpath of an unscoped package ---
    {
      code: "import { createRoot } from 'react-dom/client';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: {
            importSource: 'react-dom/client',
            gatewayPath: '#gateway/npm/react-dom__client',
          },
        },
      ],
    },
    // --- export ... from is flagged (ExportNamedDeclaration) ---
    {
      code: "export { debounce } from 'lodash';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'lodash', gatewayPath: '#gateway/npm/lodash' },
        },
      ],
    },
    // --- export * from is flagged (ExportAllDeclaration) ---
    {
      code: "export * from 'lodash';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'lodash', gatewayPath: '#gateway/npm/lodash' },
        },
      ],
    },
    // --- dynamic import() ---
    {
      code: "const mod = await import('glob');",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'glob', gatewayPath: '#gateway/npm/glob' },
        },
      ],
    },
    // --- require() ---
    {
      code: "const glob = require('glob');",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'glob', gatewayPath: '#gateway/npm/glob' },
        },
      ],
    },
    // --- require.resolve() names the package, and covers the Claude CLI resolution case ---
    {
      code: "const cliPath = require.resolve('@anthropic-ai/claude-code');",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: {
            importSource: '@anthropic-ai/claude-code',
            gatewayPath: '#gateway/npm/anthropic-ai__claude-code',
          },
        },
      ],
    },
    // --- test files follow the same rule: no exception for proxies/tests/harnesses ---
    {
      code: "import { readFileSync } from 'fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.proxy.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'fs', gatewayPath: '#gateway/node/fs' },
        },
      ],
    },
    // --- config files at the repo root are not exempt; the lint-plan is silent on them ---
    {
      code: "import { defineConfig } from 'vite';",
      filename: '/repo/vite.config.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'vite', gatewayPath: '#gateway/npm/vite' },
        },
      ],
    },
    // --- consumer scope only gates which workspace imports are allowed; the suggested gateway
    // path is always the '#gateway/...' alias text, identical in every consumer repo ---
    {
      code: "import fs from 'fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@acme' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'fs', gatewayPath: '#gateway/node/fs' },
        },
      ],
    },
  ],
});
