import { ruleBinProgramSpawnBanBroker } from './rule-bin-program-spawn-ban-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

// Real files on disk: the rule reads the statics file an imported object lives in, and a unit test's
// I/O trap refuses that read. `ward`'s bundle statics names `npm` as its build command. Built by
// slicing `__dirname`, as the platform-globals-ban integration test does.
const REPO_ROOT = __dirname.split('/').slice(0, -6).join('/');
const WARD_BUILD_BROKER_FILE = `${REPO_ROOT}/packages/ward/src/brokers/bundle/build/bundle-build-broker.ts`;
// A real npm-workspaces root on disk, named `acme`, inside this repo. With no `scope` option the
// rule reads the scope from the root above the LINTED FILE, so `@acme/node/child_process` is read
// as the gateway even though the rule module itself sits under dungeonmaster's root.
const CONSUMER_FILE = `${REPO_ROOT}/packages/eslint-plugin/test/fixtures/consumer-scope/packages/app/src/brokers/x/x-broker.ts`;

const ruleTester = ruleTesterHarness();

ruleTester.run('bin-program-spawn-ban (imported statics)', ruleBinProgramSpawnBanBroker(), {
  valid: [
    // A relative import whose file does not exist fails open
    {
      code: "import { run } from '#gateway/node/child_process'; import { missingStatics } from './missing-statics'; run({ command: missingStatics.command, args: [], cwd: '/repo' });",
      filename: WARD_BUILD_BROKER_FILE,
      options: [{ scope: '@dungeonmaster' }],
    },
    // A property the imported object does not hold fails open
    {
      code: "import { run } from '#gateway/node/child_process'; import { bundleStatics } from '../../../statics/bundle/bundle-statics'; run({ command: bundleStatics.noSuchProperty, args: [], cwd: '/repo' });",
      filename: WARD_BUILD_BROKER_FILE,
      options: [{ scope: '@dungeonmaster' }],
    },
  ],
  invalid: [
    // The named ward case: bundle-build-broker spawns bundleStatics.buildCommand, which is 'npm'
    {
      code: "import { run } from '#gateway/node/child_process'; import { bundleStatics } from '../../../statics/bundle/bundle-statics'; run({ command: bundleStatics.buildCommand, args: ['run', 'build'], cwd: '/repo' });",
      filename: WARD_BUILD_BROKER_FILE,
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: { program: 'npm', binFunction: 'install', gatewayPath: '#gateway/bin/npm' },
        },
      ],
    },
    // An aliased import resolves the imported name in the statics file
    {
      code: "import { run } from '#gateway/node/child_process'; import { bundleStatics as bundle } from '../../../statics/bundle/bundle-statics'; run({ command: bundle.buildCommand, args: [], cwd: '/repo' });",
      filename: WARD_BUILD_BROKER_FILE,
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: { program: 'npm', binFunction: 'install', gatewayPath: '#gateway/bin/npm' },
        },
      ],
    },
  ],
});

ruleTester.run(
  'bin-program-spawn-ban (scope from the linted file)',
  ruleBinProgramSpawnBanBroker(),
  {
    valid: [
      {
        code: "import { run } from '@acme/node/child_process'; run({ command: 'node', args: [], cwd: '/repo' });",
        filename: CONSUMER_FILE,
      },
      {
        code: "import { spawnFireAndForget } from '@acme/node/child_process'; spawnFireAndForget({ command: 'node', args: [], cwd: '/repo' });",
        filename: CONSUMER_FILE,
      },
    ],
    invalid: [
      {
        code: "import { run } from '@acme/node/child_process'; run({ command: 'git', args: ['status'], cwd: '/repo' });",
        filename: CONSUMER_FILE,
        errors: [
          {
            messageId: 'binProgramSpawn',
            data: { program: 'git', binFunction: 'currentBranch', gatewayPath: '#gateway/bin/git' },
          },
        ],
      },
      {
        code: "import { spawnFireAndForget } from '@acme/node/child_process'; spawnFireAndForget({ command: 'git', args: ['status'], cwd: '/repo' });",
        filename: CONSUMER_FILE,
        errors: [
          {
            messageId: 'binProgramSpawn',
            data: { program: 'git', binFunction: 'currentBranch', gatewayPath: '#gateway/bin/git' },
          },
        ],
      },
      {
        code: "import { spawnFireAndForget } from '#gateway/node/child_process'; spawnFireAndForget({ command: 'git', args: ['status'], cwd: '/repo' });",
        filename: CONSUMER_FILE,
        errors: [
          {
            messageId: 'binProgramSpawn',
            data: { program: 'git', binFunction: 'currentBranch', gatewayPath: '#gateway/bin/git' },
          },
        ],
      },
    ],
  },
);
