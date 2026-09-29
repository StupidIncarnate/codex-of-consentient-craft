import { AbsoluteFilePathStub, TimeoutMsStub } from '@dungeonmaster/shared/contracts';

import { FileDescriptorStub } from '../../../contracts/file-descriptor/file-descriptor.stub';
import { LaneLaunchStub } from '../../../contracts/lane-launch/lane-launch.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { processesSpawnLayerBroker } from './processes-spawn-layer-broker';
import { processesSpawnLayerBrokerProxy } from './processes-spawn-layer-broker.proxy';

const CWD = AbsoluteFilePathStub({ value: '/repo' });
const BOOT_TIMEOUT_MS = TimeoutMsStub({ value: 180_000 });

describe('processesSpawnLayerBroker', () => {
  it('VALID: {one launch that answers} => spawns it detached onto its own log fd and reports it ready', async () => {
    const proxy = processesSpawnLayerBrokerProxy();
    const launch = LaneLaunchStub({
      command: 'npm',
      args: ['run', 'dev:no-watch'],
      env: { HOME: '/tmp/dm-siege-inst_7f3a9c21' },
      fd: FileDescriptorStub({ value: 10 }),
      readyUrl: 'http://dungeonmaster.localhost:34172/api/guilds',
    });
    proxy.setupSpawn({ command: 'npm', args: ['run', 'dev:no-watch'], pid: 1_001 });
    proxy.setupReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });

    const result = await processesSpawnLayerBroker({
      launches: [launch],
      cwd: CWD,
      bootTimeoutMs: BOOT_TIMEOUT_MS,
    });

    expect({
      result,
      options: proxy.getSpawnOptionsFor({ command: 'npm', args: ['run', 'dev:no-watch'] }),
    }).toStrictEqual({
      result: { pgids: [ProcessGroupIdStub({ value: 1_001 })], unready: [] },
      options: {
        cwd: '/repo',
        env: { HOME: '/tmp/dm-siege-inst_7f3a9c21' },
        detached: true,
        stdio: ['ignore', 10, 10],
      },
    });
  });

  it('VALID: {launch with readyUrl: null} => never probes it and counts it ready', async () => {
    const proxy = processesSpawnLayerBrokerProxy();
    const launch = LaneLaunchStub({
      name: 'worker',
      command: 'node',
      args: ['worker.js'],
      readyUrl: null,
    });
    proxy.setupSpawn({ command: 'node', args: ['worker.js'], pid: 1_003 });

    const result = await processesSpawnLayerBroker({
      launches: [launch],
      cwd: CWD,
      bootTimeoutMs: BOOT_TIMEOUT_MS,
    });

    expect(result).toStrictEqual({ pgids: [ProcessGroupIdStub({ value: 1_003 })], unready: [] });
  });

  it('ERROR: {second launch never answers before the deadline} => returns every pgid and only that launch as unready', async () => {
    const proxy = processesSpawnLayerBrokerProxy();
    const apiLaunch = LaneLaunchStub({
      name: 'api',
      command: 'npm',
      args: ['run', 'dev:no-watch'],
      readyUrl: 'http://dungeonmaster.localhost:34172/api/guilds',
    });
    const webLaunch = LaneLaunchStub({
      name: 'web',
      command: 'npm',
      args: ['run', 'dev'],
      fd: FileDescriptorStub({ value: 11 }),
      logPath: '/repo/web-server.log',
      readyUrl: 'http://dungeonmaster.localhost:34173/',
    });
    proxy.setupSpawn({ command: 'npm', args: ['run', 'dev:no-watch'], pid: 1_001 });
    proxy.setupSpawn({ command: 'npm', args: ['run', 'dev'], pid: 1_002 });
    proxy.setupReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
    proxy.setupUnreachable({ url: 'http://dungeonmaster.localhost:34173/' });
    proxy.setupDeadlineAlreadyPast();

    const result = await processesSpawnLayerBroker({
      launches: [apiLaunch, webLaunch],
      cwd: CWD,
      bootTimeoutMs: BOOT_TIMEOUT_MS,
    });

    expect(result).toStrictEqual({
      pgids: [ProcessGroupIdStub({ value: 1_001 }), ProcessGroupIdStub({ value: 1_002 })],
      unready: [webLaunch],
    });
  });

  it('EMPTY: {launches: []} => spawns nothing', async () => {
    processesSpawnLayerBrokerProxy();

    const result = await processesSpawnLayerBroker({
      launches: [],
      cwd: CWD,
      bootTimeoutMs: BOOT_TIMEOUT_MS,
    });

    expect(result).toStrictEqual({ pgids: [], unready: [] });
  });
});
