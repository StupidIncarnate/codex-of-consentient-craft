import { eslintRuleTesterAdapter } from '@dungeonmaster/eslint-plugin';
import { ruleBanDirectIoInTestScenariosBroker } from './rule-ban-direct-io-in-test-scenarios-broker';

const ruleTester = eslintRuleTesterAdapter();
const rule = ruleBanDirectIoInTestScenariosBroker();

ruleTester.run('ban-direct-io-in-test-scenarios', rule, {
  valid: [
    {
      code: "import { someUtil } from 'utils';",
      filename: '/repo/packages/web/test/foo.spec.ts',
    },
    {
      code: "request.get('/api/users');",
      filename: '/repo/packages/web/test/foo.spec.ts',
    },
    {
      code: "axios.get('/api/users');",
      filename: '/repo/packages/web/test/foo.spec.ts',
    },
    {
      code: "import * as fs from 'fs';",
      filename: '/repo/packages/web/test/foo.ts',
    },
    {
      code: "fetch('/api');",
      filename: '/repo/packages/web/test/foo.ts',
    },
  ],
  invalid: [
    {
      code: "import fs from 'fs';",
      filename: '/repo/packages/web/test/foo.spec.ts',
      errors: [
        {
          messageId: 'directIo',
        },
      ],
    },
    {
      code: "import { readFile } from 'node:fs/promises';",
      filename: '/repo/packages/web/test/foo.e2e.ts',
      errors: [
        {
          messageId: 'directIo',
        },
      ],
    },
    {
      code: "import recipe from '@dungeonmaster/hydration-recipes/foo';",
      filename: '/repo/packages/web/test/foo.integration.test.ts',
      errors: [
        {
          messageId: 'directIo',
        },
      ],
    },
    {
      code: "import { dmRegistryBroker } from '@dungeonmaster/core';",
      filename: '/repo/packages/web/test/foo.spec.ts',
      errors: [
        {
          messageId: 'directIo',
        },
      ],
    },
    {
      code: "import { recipesHydrationCreateBroker } from 'some-module';",
      filename: '/repo/packages/web/test/foo.spec.ts',
      errors: [
        {
          messageId: 'directIo',
        },
      ],
    },
    {
      code: "fetch('/api/users');",
      filename: '/repo/packages/web/test/foo.spec.ts',
      errors: [
        {
          messageId: 'directIo',
        },
      ],
    },
    {
      code: "request.post('/api/users', {});",
      filename: '/repo/packages/web/test/foo.spec.ts',
      errors: [
        {
          messageId: 'directIo',
        },
      ],
    },
    {
      code: "axios.patch('/api/users', {});",
      filename: '/repo/packages/web/test/foo.spec.ts',
      errors: [
        {
          messageId: 'directIo',
        },
      ],
    },
  ],
});
