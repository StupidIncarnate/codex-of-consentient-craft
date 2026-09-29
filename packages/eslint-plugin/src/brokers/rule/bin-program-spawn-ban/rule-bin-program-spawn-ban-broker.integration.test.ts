import { ruleBinProgramSpawnBanBroker } from './rule-bin-program-spawn-ban-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

// Real files on disk: the rule reads the statics file an imported object lives in, and a unit test's
// I/O trap refuses that read. `ward`'s bundle statics names `npm` as its build command. Built by
// slicing `__dirname`, as the platform-globals-ban integration test does.
const REPO_ROOT = __dirname.split('/').slice(0, -6).join('/');
const WARD_BUILD_BROKER_FILE = `${REPO_ROOT}/packages/ward/src/brokers/bundle/build/bundle-build-broker.ts`;

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
