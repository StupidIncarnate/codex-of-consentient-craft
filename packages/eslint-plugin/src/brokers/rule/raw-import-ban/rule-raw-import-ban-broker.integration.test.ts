import { ruleRawImportBanBroker } from './rule-raw-import-ban-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

// A real npm-workspaces root on disk, named `acme`, inside this repo. With no `scope` option the
// rule reads the scope from the root above the LINTED FILE, so it answers `@acme` here even though
// the rule module itself sits under dungeonmaster's root. Built by slicing `__dirname`, as the
// platform-globals-ban integration test does.
const PACKAGE_ROOT = __dirname.split('/').slice(0, -4).join('/');
const CONSUMER_FILE = `${PACKAGE_ROOT}/test/fixtures/consumer-scope/packages/app/src/brokers/x/x-broker.ts`;

const ruleTester = ruleTesterHarness();

ruleTester.run('raw-import-ban (scope from the linted file)', ruleRawImportBanBroker(), {
  valid: [
    {
      code: "import { userContract } from '@acme/shared/contracts';",
      filename: CONSUMER_FILE,
    },
  ],
  invalid: [
    {
      code: "import { readFileSync } from 'fs';",
      filename: CONSUMER_FILE,
      errors: [
        {
          messageId: 'rawImport',
          data: { importSource: 'fs', gatewayPath: '#gateway/node/fs' },
        },
      ],
    },
    {
      code: "import { readFileSync } from '@acme/node/fs';",
      filename: CONSUMER_FILE,
      errors: [
        {
          messageId: 'scopedGatewayImport',
          data: { importSource: '@acme/node/fs', gatewayPath: '#gateway/node/fs' },
        },
      ],
    },
  ],
});
