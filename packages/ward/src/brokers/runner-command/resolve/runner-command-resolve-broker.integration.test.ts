import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { run } from '#gateway/node/child_process';
import { resolve } from '#gateway/node/path';

import { runnerCommandResolveBroker } from './runner-command-resolve-broker';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..', '..', '..');

// Prints what one process sees: its own node arguments, NODE_OPTIONS, and where
// `@dungeonmaster/shared/statics` resolves for it.
const PROBE_SOURCE = [
  'process.stdout.write(JSON.stringify({',
  '  execArgv: process.execArgv,',
  '  nodeOptions: process.env.NODE_OPTIONS ?? null,',
  "  sharedStatics: require.resolve('@dungeonmaster/shared/statics'),",
  '}));',
].join('\n');

// Stands in for jest or Playwright. Both fork their workers with the default `execArgv`, and a test
// they run starts a built program with a plain `spawn` and no `env`.
const RUNNER_SOURCE = [
  "const { fork, spawnSync } = require('child_process');",
  "const probePath = require('path').join(__dirname, '..', '..', 'probe.js');",
  'const report = () => ({',
  '  execArgv: process.execArgv,',
  '  nodeOptions: process.env.NODE_OPTIONS ?? null,',
  "  sharedStatics: require.resolve('@dungeonmaster/shared/statics'),",
  '});',
  "const spawnedChild = JSON.parse(spawnSync(process.execPath, [probePath], { encoding: 'utf8' }).stdout);",
  'const worker = fork(probePath, [], { silent: true });',
  "let workerOutput = '';",
  "worker.stdout.on('data', (chunk) => { workerOutput += chunk; });",
  "worker.on('exit', () => {",
  '  process.stdout.write(JSON.stringify({',
  '    runner: report(),',
  '    forkedWorker: JSON.parse(workerOutput),',
  '    spawnedChild,',
  '  }));',
  '});',
].join('\n');

// The unit tests stage the bin and the barrel by exact path, so they prove which command line ward
// builds, never what Node does with it. This one starts a real runner from the resolved command in
// a workspace that links this repo's `@dungeonmaster/shared`, and reads back what each process
// resolved.
describe('runnerCommandResolveBroker (integration)', () => {
  it('VALID: {runner started from the resolved command} => the runner and its forked worker resolve source, a child it spawns resolves dist', async () => {
    const testbed = installTestbedCreateBroker({ baseName: 'ward-runner-command' });
    testbed.createSymlink({
      relativePath: 'node_modules/@dungeonmaster/shared',
      targetPath: `${REPO_ROOT}/packages/shared`,
    });
    testbed.writeFile({ relativePath: 'node_modules/.bin/probe-runner', content: RUNNER_SOURCE });
    testbed.writeFile({ relativePath: 'probe.js', content: PROBE_SOURCE });
    const runner = runnerCommandResolveBroker({ binName: 'probe-runner', cwd: testbed.guildPath });

    const result = await run({
      command: runner.command,
      args: [...runner.leadingArgs],
      cwd: testbed.guildPath,
    });
    testbed.cleanup();

    expect(JSON.parse(result.stdout)).toStrictEqual({
      runner: {
        execArgv: ['--conditions=source'],
        nodeOptions: null,
        sharedStatics: `${REPO_ROOT}/packages/shared/src/statics/statics.ts`,
      },
      forkedWorker: {
        execArgv: ['--conditions=source'],
        nodeOptions: null,
        sharedStatics: `${REPO_ROOT}/packages/shared/src/statics/statics.ts`,
      },
      spawnedChild: {
        execArgv: [],
        nodeOptions: null,
        sharedStatics: `${REPO_ROOT}/packages/shared/dist/src/statics/statics.js`,
      },
    });
  });
});
