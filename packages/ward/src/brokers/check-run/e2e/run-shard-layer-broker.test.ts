import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { RunnerCommandStub } from '../../../contracts/runner-command/runner-command.stub';
import { E2eShardOutputStub } from '../../../contracts/e2e-shard-output/e2e-shard-output.stub';
import { PassingTestStub } from '../../../contracts/passing-test/passing-test.stub';
import { OpenHandleStub } from '../../../contracts/open-handle/open-handle.stub';

import { runShardLayerBroker } from './run-shard-layer-broker';
import { runShardLayerBrokerProxy } from './run-shard-layer-broker.proxy';

describe('runShardLayerBroker', () => {
  it('VALID: {shardCount: 1} => runs without --shard or --pass-with-no-tests and returns single shard output', async () => {
    const projectFolder = ProjectFolderStub({ path: '/project' });
    const runner = RunnerCommandStub({ command: 'playwright', leadingArgs: ['test'] });
    const proxy = runShardLayerBrokerProxy();
    proxy.setupPass({ packagePath: '/project' });

    const result = await runShardLayerBroker({
      projectFolder,
      runner,
      finalArgs: ['packages/web/smoke.e2e.ts'],
      bundleDir: null,
      shardIndex: 1,
      shardCount: 1,
    });

    expect(proxy.getSpawnedArgs()).toStrictEqual(['test', 'packages/web/smoke.e2e.ts']);
    expect(result).toStrictEqual(
      E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 1,
        output: '',
        exitCode: 0,
        signal: null,
        passingTests: [],
        openHandles: [],
      }),
    );
  });

  it('VALID: {shardCount: 3, shardIndex: 2} => appends --shard=2/3 and --pass-with-no-tests to args', async () => {
    const projectFolder = ProjectFolderStub({ path: '/project' });
    const runner = RunnerCommandStub({ command: 'playwright', leadingArgs: ['test'] });
    const proxy = runShardLayerBrokerProxy();
    proxy.setupPass({ packagePath: '/project' });

    const result = await runShardLayerBroker({
      projectFolder,
      runner,
      finalArgs: ['packages/web/smoke.e2e.ts'],
      bundleDir: null,
      shardIndex: 2,
      shardCount: 3,
    });

    expect(proxy.getSpawnedArgs()).toStrictEqual([
      'test',
      'packages/web/smoke.e2e.ts',
      '--shard=2/3',
      '--pass-with-no-tests',
    ]);
    expect(result).toStrictEqual(
      E2eShardOutputStub({
        shardIndex: 2,
        shardCount: 3,
        output: '',
        exitCode: 0,
        signal: null,
        passingTests: [],
        openHandles: [],
      }),
    );
  });

  it('VALID: {bundleDir provided} => passes DUNGEONMASTER_WEB_BUNDLE_DIR in env', async () => {
    const projectFolder = ProjectFolderStub({ path: '/project' });
    const runner = RunnerCommandStub({ command: 'playwright', leadingArgs: ['test'] });
    const proxy = runShardLayerBrokerProxy();
    proxy.setupPass({ packagePath: '/project' });

    await runShardLayerBroker({
      projectFolder,
      runner,
      finalArgs: [],
      bundleDir: '/dist/bundle',
      shardIndex: 1,
      shardCount: 1,
    });

    const env = proxy.getSpawnedEnv();

    expect(env?.DUNGEONMASTER_WEB_BUNDLE_DIR).toBe('/dist/bundle');
    expect(env?.DUNGEONMASTER_PORT).toBe('40000');
    expect(env?.DUNGEONMASTER_WEB_PORT).toBe('51244');
  });

  it('VALID: {bundleDir null} => omits DUNGEONMASTER_WEB_BUNDLE_DIR from env', async () => {
    const projectFolder = ProjectFolderStub({ path: '/project' });
    const runner = RunnerCommandStub({ command: 'playwright', leadingArgs: ['test'] });
    const proxy = runShardLayerBrokerProxy();
    proxy.setupPass({ packagePath: '/project' });

    await runShardLayerBroker({
      projectFolder,
      runner,
      finalArgs: [],
      bundleDir: null,
      shardIndex: 1,
      shardCount: 1,
    });

    const env = proxy.getSpawnedEnv();

    expect(env?.DUNGEONMASTER_WEB_BUNDLE_DIR).toBe(undefined);
  });

  it('VALID: {playwright exits 1} => returns exitCode 1 and output', async () => {
    const projectFolder = ProjectFolderStub({ path: '/project' });
    const runner = RunnerCommandStub({ command: 'playwright', leadingArgs: ['test'] });
    const proxy = runShardLayerBrokerProxy();
    proxy.setupFail({ packagePath: '/project', stdout: 'Test failed\n', exitCode: 1 });

    const result = await runShardLayerBroker({
      projectFolder,
      runner,
      finalArgs: [],
      bundleDir: null,
      shardIndex: 1,
      shardCount: 1,
    });

    expect(result).toStrictEqual(
      E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 1,
        output: 'Test failed\n',
        exitCode: 1,
        signal: null,
        passingTests: [],
        openHandles: [],
      }),
    );
  });

  it('VALID: {run throws RunNotFoundError} => catches and returns exitCode 1 with empty output', async () => {
    const projectFolder = ProjectFolderStub({ path: '/project' });
    const runner = RunnerCommandStub({ command: 'playwright', leadingArgs: ['test'] });
    const proxy = runShardLayerBrokerProxy();
    proxy.setupRunNotFound({ packagePath: '/project' });

    const result = await runShardLayerBroker({
      projectFolder,
      runner,
      finalArgs: [],
      bundleDir: null,
      shardIndex: 1,
      shardCount: 1,
    });

    expect(result).toStrictEqual(
      E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 1,
        output: '',
        exitCode: 1,
        signal: null,
        passingTests: [],
        openHandles: [],
      }),
    );
  });

  it('VALID: {process terminated with signal} => returns signal in shard output', async () => {
    const projectFolder = ProjectFolderStub({ path: '/project' });
    const runner = RunnerCommandStub({ command: 'playwright', leadingArgs: ['test'] });
    const proxy = runShardLayerBrokerProxy();
    proxy.setupSignal({ packagePath: '/project', signal: 'SIGKILL' });

    const result = await runShardLayerBroker({
      projectFolder,
      runner,
      finalArgs: [],
      bundleDir: null,
      shardIndex: 1,
      shardCount: 1,
    });

    expect(result).toStrictEqual(
      E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 1,
        output: '',
        exitCode: 1,
        signal: 'SIGKILL',
        passingTests: [],
        openHandles: [],
      }),
    );
  });

  it('VALID: {json report present} => reads and parses passingTests', async () => {
    const projectFolder = ProjectFolderStub({ path: '/project' });
    const runner = RunnerCommandStub({ command: 'playwright', leadingArgs: ['test'] });
    const jsonContent = JSON.stringify({
      suites: [
        {
          title: 'packages/web/smoke.e2e.ts',
          specs: [
            {
              title: 'smoke test',
              file: 'packages/web/smoke.e2e.ts',
              tests: [{ results: [{ status: 'passed', duration: 1500 }] }],
            },
          ],
        },
      ],
    });
    const proxy = runShardLayerBrokerProxy();
    proxy.setupPassWithJsonReport({ packagePath: '/project', jsonContent });

    const result = await runShardLayerBroker({
      projectFolder,
      runner,
      finalArgs: [],
      bundleDir: null,
      shardIndex: 1,
      shardCount: 1,
    });

    expect(result.passingTests).toStrictEqual([
      PassingTestStub({
        suitePath: 'packages/web/smoke.e2e.ts',
        testName: 'packages/web/smoke.e2e.ts › smoke test',
        durationMs: 1500,
      }),
    ]);
  });

  it('VALID: {open handles report present} => parses open handles and returns in result', async () => {
    const projectFolder = ProjectFolderStub({ path: '/project' });
    const runner = RunnerCommandStub({ command: 'playwright', leadingArgs: ['test'] });
    const handleContent = JSON.stringify({
      kind: 'setInterval',
      testPath: 'packages/web/smoke.e2e.ts',
      stack: 'at setTimeout (index.ts:10)',
    });
    const proxy = runShardLayerBrokerProxy();
    proxy.setupPassWithOpenHandles({ packagePath: '/project', handleContent });

    const result = await runShardLayerBroker({
      projectFolder,
      runner,
      finalArgs: [],
      bundleDir: null,
      shardIndex: 1,
      shardCount: 1,
    });

    expect(result.openHandles).toStrictEqual([
      OpenHandleStub({
        name: 'setInterval',
        message: 'setInterval still armed when packages/web/smoke.e2e.ts finished',
        stack: 'at setTimeout (index.ts:10)',
      }),
    ]);
  });
});
