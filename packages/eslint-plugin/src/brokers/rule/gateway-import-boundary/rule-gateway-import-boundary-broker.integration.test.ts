import { ruleGatewayImportBoundaryBroker } from './rule-gateway-import-boundary-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

// A real npm-workspaces root on disk, named `acme`, inside this repo. With no `scope` option the
// rule reads the scope from the root above the LINTED FILE, so it answers `@acme` here even though
// the rule module itself sits under dungeonmaster's root. Built by slicing `__dirname`, as the
// platform-globals-ban integration test does.
const PACKAGE_ROOT = __dirname.split('/').slice(0, -4).join('/');
const CONSUMER_GATEWAY_FILE = `${PACKAGE_ROOT}/test/fixtures/consumer-scope/packages/@gateway/node/src/fs/fs.ts`;

const ruleTester = ruleTesterHarness();

ruleTester.run(
  'gateway-import-boundary (scope from the linted file)',
  ruleGatewayImportBoundaryBroker(),
  {
    valid: [
      {
        code: "import { glob } from '@acme/npm/glob';",
        filename: CONSUMER_GATEWAY_FILE,
      },
    ],
    invalid: [
      {
        code: "import { userContract } from '@acme/shared/contracts';",
        filename: CONSUMER_GATEWAY_FILE,
        errors: [
          {
            messageId: 'workspacePackageImport',
            data: { importSource: '@acme/shared/contracts', scope: '@acme' },
          },
        ],
      },
    ],
  },
);
