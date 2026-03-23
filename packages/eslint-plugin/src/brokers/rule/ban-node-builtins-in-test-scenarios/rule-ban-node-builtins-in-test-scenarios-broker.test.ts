import { ruleBanNodeBuiltinsInTestScenariosBroker } from './rule-ban-node-builtins-in-test-scenarios-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-node-builtins-in-test-scenarios', ruleBanNodeBuiltinsInTestScenariosBroker(), {
  valid: [
    // Regular (non-test) file importing fs — allowed
    {
      code: "import fs from 'fs';",
      filename: '/project/src/brokers/guild/guild-broker.ts',
    },
    {
      code: "import path from 'path';",
      filename: '/project/src/brokers/guild/guild-broker.ts',
    },

    // Plain unit test file (.test.ts, not .integration.test.ts) — NOT in scope
    {
      code: "import fs from 'fs';",
      filename: '/project/src/brokers/guild/guild-broker.test.ts',
    },

    // Harness file inside test/ directory importing fs — allowed
    {
      code: "import fs from 'fs';",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },
    {
      code: "import { readFile } from 'fs/promises';",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },
    {
      code: "import path from 'path';",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },
    {
      code: "import os from 'os';",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },
    {
      code: "import crypto from 'crypto';",
      filename: '/project/test/harnesses/guild/guild.harness.ts',
    },

    // Spec file importing from harness (not a node builtin) — allowed
    {
      code: "import { guildHarness } from '../../test/harnesses/guild/guild.harness';",
      filename: '/project/e2e/web/smoke.spec.ts',
    },

    // Spec file importing non-banned modules — allowed
    {
      code: "import { expect } from '@playwright/test';",
      filename: '/project/e2e/web/smoke.spec.ts',
    },

    // Integration test importing non-banned modules — allowed
    {
      code: "import { installTestbedCreateBroker } from '@dungeonmaster/testing';",
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
    },

    // File in test/ directory that is a spec file — test/ exclusion takes priority
    {
      code: "import fs from 'fs';",
      filename: '/project/test/e2e/smoke.spec.ts',
    },
  ],
  invalid: [
    // Spec file importing fs
    {
      code: "import fs from 'fs';",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'fs' },
        },
      ],
    },

    // Spec file importing fs/promises
    {
      code: "import { readFile } from 'fs/promises';",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'fs/promises' },
        },
      ],
    },

    // Integration test importing path
    {
      code: "import path from 'path';",
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'path' },
        },
      ],
    },

    // Spec file importing os
    {
      code: "import os from 'os';",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'os' },
        },
      ],
    },

    // Spec file importing crypto
    {
      code: "import crypto from 'crypto';",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'crypto' },
        },
      ],
    },

    // Spec file importing node: prefixed builtins
    {
      code: "import fs from 'node:fs';",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'node:fs' },
        },
      ],
    },
    {
      code: "import { readFile } from 'node:fs/promises';",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'node:fs/promises' },
        },
      ],
    },
    {
      code: "import path from 'node:path';",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'node:path' },
        },
      ],
    },
    {
      code: "import os from 'node:os';",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'node:os' },
        },
      ],
    },
    {
      code: "import crypto from 'node:crypto';",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'node:crypto' },
        },
      ],
    },

    // Integration test importing fs
    {
      code: "import fs from 'fs';",
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'fs' },
        },
      ],
    },

    // Multiple violations in same file
    {
      code: `import fs from 'fs';
import path from 'path';
import os from 'os';`,
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'fs' },
        },
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'path' },
        },
        {
          messageId: 'noNodeBuiltins',
          data: { module: 'os' },
        },
      ],
    },
  ],
});
