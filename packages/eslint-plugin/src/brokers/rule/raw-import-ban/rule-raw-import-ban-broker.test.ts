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
      filename: '/repo/packages/node/src/fs/read-file-if-exists.ts',
    },
    {
      code: "export * from 'react';",
      filename: '/repo/packages/npm/src/react/index.ts',
    },
    {
      code: "const fs = require('fs');",
      filename: '/repo/packages/bin/src/git/git-current-branch.ts',
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
          data: { importSource: 'fs', gatewayPath: '@dungeonmaster/node/fs' },
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
          data: { importSource: 'node:fs', gatewayPath: '@dungeonmaster/node/fs' },
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
          data: { importSource: 'zod', gatewayPath: '@dungeonmaster/npm/zod' },
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
            gatewayPath: '@dungeonmaster/npm/@playwright/test',
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
            gatewayPath: '@dungeonmaster/npm/@playwright/test/reporter',
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
            gatewayPath: '@dungeonmaster/npm/react-dom/client',
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
          data: { importSource: 'lodash', gatewayPath: '@dungeonmaster/npm/lodash' },
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
          data: { importSource: 'lodash', gatewayPath: '@dungeonmaster/npm/lodash' },
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
          data: { importSource: 'glob', gatewayPath: '@dungeonmaster/npm/glob' },
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
          data: { importSource: 'glob', gatewayPath: '@dungeonmaster/npm/glob' },
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
            gatewayPath: '@dungeonmaster/npm/@anthropic-ai/claude-code',
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
          data: { importSource: 'fs', gatewayPath: '@dungeonmaster/node/fs' },
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
          data: { importSource: 'vite', gatewayPath: '@dungeonmaster/npm/vite' },
        },
      ],
    },
    // --- consumer scope other than @dungeonmaster maps to its own gateway paths ---
    {
      code: "import fs from 'fs';",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@acme' }],
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'fs', gatewayPath: '@acme/node/fs' },
        },
      ],
    },
  ],
});
