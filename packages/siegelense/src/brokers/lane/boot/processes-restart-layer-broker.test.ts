import { AbsoluteFilePathStub, TimeoutMsStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { LaneLaunchStub } from '../../../contracts/lane-launch/lane-launch.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { processesRestartLayerBroker } from './processes-restart-layer-broker';
import { processesRestartLayerBrokerProxy } from './processes-restart-layer-broker.proxy';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

const CWD = AbsoluteFilePathStub({ value: '/repo' });
const BOOT_TIMEOUT_MS = TimeoutMsStub({ value: 180_000 });
const INSTANCE_ID = InstanceIdStub({ value: 'inst_7f3a9c21' });

describe('processesRestartLayerBroker', () => {
  it('VALID: {launch comes back} => rewrites livePgids in place, stamps the registry row, resolves success', async () => {
    const proxy = processesRestartLayerBrokerProxy();
    const launch = LaneLaunchStub({
      command: 'npm',
      args: ['run', 'dev:no-watch'],
      readyUrl: 'http://dungeonmaster.localhost:34172/api/guilds',
    });
    const oldPgid = ProcessGroupIdStub({ value: 1_001 });
    proxy.setupSpawn({ command: 'npm', args: ['run', 'dev:no-watch'], pid: 2_001 });
    proxy.setupReachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
    proxy.setupRegistry({
      json: JSON.stringify(
        RegistryStub({ instances: [RegistryEntryStub({ id: INSTANCE_ID, pgids: [oldPgid] })] }),
      ),
    });
    const livePgids: ProcessGroupId[] = [oldPgid];

    const result = await processesRestartLayerBroker({
      launches: [launch],
      cwd: CWD,
      bootTimeoutMs: BOOT_TIMEOUT_MS,
      instanceId: INSTANCE_ID,
      specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
      livePgids,
    });

    const expectedRegistry = RegistryStub({
      instances: [
        RegistryEntryStub({ id: INSTANCE_ID, pgids: [ProcessGroupIdStub({ value: 2_001 })] }),
      ],
    });

    expect({ result, livePgids, written: proxy.getWrittenRegistry() }).toStrictEqual({
      result: { success: true },
      livePgids: [ProcessGroupIdStub({ value: 2_001 })],
      written: `${JSON.stringify(expectedRegistry)}\n`,
    });
  });

  it('ERROR: {launch never answers} => still records the new pgids, then throws naming the process and its log', async () => {
    const proxy = processesRestartLayerBrokerProxy();
    const launch = LaneLaunchStub({
      name: 'api',
      command: 'npm',
      args: ['run', 'dev:no-watch'],
      logPath: '/repo/api-server.log',
      readyUrl: 'http://dungeonmaster.localhost:34172/api/guilds',
    });
    const oldPgid = ProcessGroupIdStub({ value: 1_001 });
    proxy.setupSpawn({ command: 'npm', args: ['run', 'dev:no-watch'], pid: 2_001 });
    proxy.setupRegistry({
      json: JSON.stringify(
        RegistryStub({ instances: [RegistryEntryStub({ id: INSTANCE_ID, pgids: [oldPgid] })] }),
      ),
    });
    proxy.setupUnreachable({ url: 'http://dungeonmaster.localhost:34172/api/guilds' });
    proxy.setupDeadlineAlreadyPast();
    const livePgids: ProcessGroupId[] = [oldPgid];

    await expect(
      processesRestartLayerBroker({
        launches: [launch],
        cwd: CWD,
        bootTimeoutMs: BOOT_TIMEOUT_MS,
        instanceId: INSTANCE_ID,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        livePgids,
      }),
    ).rejects.toThrow(
      /^Restarting lane dungeonmaster-stack for instance inst_7f3a9c21 failed: api did not come back \(never answered their ready path\)\. Logs: \/repo\/api-server\.log\. The instance is unusable — kill it and start a new one\.$/u,
    );

    const expectedRegistry = RegistryStub({
      instances: [
        RegistryEntryStub({ id: INSTANCE_ID, pgids: [ProcessGroupIdStub({ value: 2_001 })] }),
      ],
    });

    expect({ livePgids, written: proxy.getWrittenRegistry() }).toStrictEqual({
      livePgids: [ProcessGroupIdStub({ value: 2_001 })],
      written: `${JSON.stringify(expectedRegistry)}\n`,
    });
  });
});
