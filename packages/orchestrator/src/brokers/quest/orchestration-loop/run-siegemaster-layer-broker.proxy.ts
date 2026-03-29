import type { ChildProcess } from 'child_process';

import type { DungeonmasterConfig } from '@dungeonmaster/config';
import {
  questContract,
  type ExitCode,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';

import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';
import { devServerStartBrokerProxy } from '../../dev-server/start/dev-server-start-broker.proxy';
import { devServerStopBrokerProxy } from '../../dev-server/stop/dev-server-stop-broker.proxy';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { buildPreflightLoopLayerBrokerProxy } from './build-preflight-loop-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

const buildSignalLine = ({ signal }: { signal: StreamSignal }) =>
  [
    JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          {
            type: 'tool_use',
            id: 'toolu_signal',
            name: 'mcp__dungeonmaster__signal-back',
            input: signal,
          },
        ],
      },
    }),
  ] as const;

const parseLastPersisted = (persisted: readonly unknown[]): Quest | undefined => {
  if (persisted.length === 0) return undefined;
  const raw = persisted[persisted.length - 1];
  const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return questContract.parse(parsed);
};

// Use statics values to avoid magic numbers
const TEST_DEV_COMMAND = 'npm run dev' as never;
const TEST_BUILD_COMMAND = 'npm run build' as never;
const TEST_READINESS_PATH = '/' as never;
const TEST_DEV_SERVER_PORT = parseInt('3000', 10) as never;
const TEST_READINESS_TIMEOUT_MS = parseInt('30000', 10) as never;

type ConfigStubFn = (...args: never[]) => DungeonmasterConfig;

const makeSigtermResponsive = (proc: ChildProcess): ChildProcess => {
  proc.kill = jest.fn((sig) => {
    if (sig === 'SIGTERM' || sig === undefined) {
      setImmediate(() => {
        proc.emit('close', 0);
      });
    }
    return true;
  }) as unknown as typeof proc.kill;
  return proc;
};

const makeDevServerConfig = (): DungeonmasterConfig => {
  const { DungeonmasterConfigStub } = jest.requireActual<{
    DungeonmasterConfigStub: ConfigStubFn;
  }>('@dungeonmaster/config');

  return DungeonmasterConfigStub({
    devServer: {
      devCommand: TEST_DEV_COMMAND,
      port: TEST_DEV_SERVER_PORT,
      buildCommand: TEST_BUILD_COMMAND,
      readinessPath: TEST_READINESS_PATH,
      readinessTimeoutMs: TEST_READINESS_TIMEOUT_MS,
    },
  } as never);
};

const makeBasicConfig = (): DungeonmasterConfig => {
  const { DungeonmasterConfigStub } = jest.requireActual<{
    DungeonmasterConfigStub: ConfigStubFn;
  }>('@dungeonmaster/config');

  return DungeonmasterConfigStub();
};

export const runSiegemasterLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupSpawnAborted: (params: { quest: Quest }) => void;
  setupSpawnSuccess: (params: { quest: Quest; exitCode: ExitCode }) => void;
  setupSpawnWithSignal: (params: {
    quest: Quest;
    exitCode: ExitCode;
    signal: StreamSignal;
  }) => void;
  setupSpawnWithSessionAndSignal: (params: {
    quest: Quest;
    exitCode: ExitCode;
    signal: StreamSignal;
    sessionIdLine: string;
  }) => void;
  setupModifyReject: (params: { error: Error }) => void;
  setupStderrCapture: () => void;
  getStderrWrites: () => readonly unknown[];
  getPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
  getPersistedWorkItem: (params: { workItemId: QuestWorkItemId }) => WorkItem | undefined;
  getPersistedWorkItemByRole: (params: { role: WorkItem['role'] }) => WorkItem | undefined;
  getModifyContents: () => readonly unknown[];
  setupWithDevServer: (params: {
    quest: Quest;
    exitCode: ExitCode;
    signal: StreamSignal;
  }) => ChildProcess;
  setupBuildFails: (params: {
    quest: Quest;
    buildOutput: string;
    signal: StreamSignal;
    exitCode: ExitCode;
  }) => void;
  setupBuildExhausted: (params: { quest: Quest }) => void;
  setupServerStartFails: (params: { quest: Quest }) => void;
  setupTwoSequentialWithDevServer: (params: {
    quest: Quest;
    exitCode: ExitCode;
    signal: StreamSignal;
  }) => readonly [ChildProcess, ChildProcess];
  setupDevServerWithFirstFailSecondSucceeds: (params: {
    quest: Quest;
    exitCode: ExitCode;
    signal: StreamSignal;
  }) => ChildProcess;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const configProxy = dungeonmasterConfigResolveAdapterProxy();
  // buildPreflightLoopLayerBrokerProxy, devServerStopBrokerProxy, and devServerStartBrokerProxy
  // must be created BEFORE agentSpawnByRoleBrokerProxy so the stream-json spawn mock's
  // mockImplementation fallback takes precedence over the plain spawn mock's mockImplementation.
  // buildPreflightLoopLayerBrokerProxy internally creates buildPreflightBrokerProxy (execFile mock)
  // and agentSpawnByRoleBrokerProxy (stream-json spawn mock), but the parent's agentSpawnByRoleBrokerProxy
  // call below is the final one, so stream-json wins as the fallback. This matters for setupBuildFails
  // where the siege spawn uses the fallback mockImplementation and must receive a stream-json process.
  const buildProxy = buildPreflightLoopLayerBrokerProxy();
  devServerStopBrokerProxy();
  const serverStartProxy = devServerStartBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();
  const stderrSpy: { current: jest.SpyInstance | null } = { current: null };

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');
  jest.spyOn(crypto, 'randomUUID').mockReturnValue('aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee');

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      configProxy.setupConfigResolved({ config: makeBasicConfig() });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: (): void => {
      configProxy.setupConfigResolved({ config: makeBasicConfig() });
      getProxy.setupEmptyFolder();
    },
    setupSpawnAborted: ({ quest }: { quest: Quest }): void => {
      configProxy.setupConfigResolved({ config: makeBasicConfig() });
      getProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnFailureOnce();
    },
    setupSpawnSuccess: ({ quest, exitCode }: { quest: Quest; exitCode: ExitCode }): void => {
      configProxy.setupConfigResolved({ config: makeBasicConfig() });
      // Initial quest fetch + fresh quest fetch on failure path (exitCode != 0 means no signal → failure)
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({ lines: [], exitCode });
    },
    setupSpawnWithSignal: ({
      quest,
      exitCode,
      signal,
    }: {
      quest: Quest;
      exitCode: ExitCode;
      signal: StreamSignal;
    }): void => {
      configProxy.setupConfigResolved({ config: makeBasicConfig() });
      // Initial quest fetch + fresh quest fetch on failure path
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({
        lines: buildSignalLine({ signal }),
        exitCode,
      });
    },
    setupSpawnWithSessionAndSignal: ({
      quest,
      exitCode,
      signal,
      sessionIdLine,
    }: {
      quest: Quest;
      exitCode: ExitCode;
      signal: StreamSignal;
      sessionIdLine: string;
    }): void => {
      configProxy.setupConfigResolved({ config: makeBasicConfig() });
      // Initial quest fetch + fresh quest fetch on failure path
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({
        lines: [sessionIdLine, ...buildSignalLine({ signal })],
        exitCode,
      });
    },
    setupWithDevServer: ({
      quest,
      exitCode,
      signal,
    }: {
      quest: Quest;
      exitCode: ExitCode;
      signal: StreamSignal;
    }): ChildProcess => {
      configProxy.setupConfigResolved({ config: makeDevServerConfig() });
      buildProxy.setupBuildSuccess();
      const proc = makeSigtermResponsive(serverStartProxy.setupServerBecomesReady());
      // Initial quest fetch + fresh quest fetch on failure path
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({
        lines: buildSignalLine({ signal }),
        exitCode,
      });
      return proc;
    },
    setupBuildFails: ({
      quest,
      buildOutput,
      signal,
      exitCode,
    }: {
      quest: Quest;
      buildOutput: string;
      signal: StreamSignal;
      exitCode: ExitCode;
    }): void => {
      configProxy.setupConfigResolved({ config: makeDevServerConfig() });
      buildProxy.setupBuildFailure({ exitCode: 1 as never, output: buildOutput });
      // Spiritmender spawn (inline fix agent)
      spawnProxy.setupSpawnOnce({ lines: [], exitCode: 0 as never });
      buildProxy.setupBuildSuccess();
      makeSigtermResponsive(serverStartProxy.setupServerBecomesReady());
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      // Siege spawn after successful build + server start.
      // Must use setupSpawnAutoLines (not setupSpawnOnce) so siege signal lines are emitted
      // AFTER the siege readline callback is registered (not at setup time like setImmediate).
      // All prior setupSpawnOnce calls consumed their mockReturnValueOnce queue entries, so
      // siege falls through to the fallback mockImplementation set by setupSpawnAutoLines.
      spawnProxy.setupSpawnAutoLines({
        lines: buildSignalLine({ signal }),
        exitCode,
      });
    },
    setupBuildExhausted: ({ quest }: { quest: Quest }): void => {
      configProxy.setupConfigResolved({ config: makeDevServerConfig() });
      buildProxy.setupBuildFailure({ exitCode: 1 as never, output: 'Build error line 1' });
      spawnProxy.setupSpawnOnce({ lines: [], exitCode: 0 as never });
      buildProxy.setupBuildFailure({ exitCode: 1 as never, output: 'Build error line 2' });
      spawnProxy.setupSpawnOnce({ lines: [], exitCode: 0 as never });
      buildProxy.setupBuildFailure({ exitCode: 1 as never, output: 'Build error line 3' });
      // quest fetched twice: once at start, once for replan
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },
    setupServerStartFails: ({ quest }: { quest: Quest }): void => {
      configProxy.setupConfigResolved({ config: makeDevServerConfig() });
      buildProxy.setupBuildSuccess();
      serverStartProxy.setupServerExitsBeforeReady({ exitCode: 1 });
      // quest fetched twice: once at start, once for replan
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },
    getPersistedWorkItemStatus: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItemStatus | undefined => {
      const quest = parseLastPersisted(modifyProxy.getAllPersistedContents());
      return quest?.workItems.find((wi) => wi.id === workItemId)?.status;
    },
    getPersistedWorkItem: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItem | undefined => {
      const quest = parseLastPersisted(modifyProxy.getAllPersistedContents());
      return quest?.workItems.find((wi) => wi.id === workItemId);
    },
    getPersistedWorkItemByRole: ({ role }: { role: WorkItem['role'] }): WorkItem | undefined => {
      const quest = parseLastPersisted(modifyProxy.getAllPersistedContents());
      return quest?.workItems.find((wi) => wi.role === role);
    },
    setupModifyReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    setupStderrCapture: (): void => {
      stderrSpy.current = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    },

    getStderrWrites: (): readonly unknown[] =>
      stderrSpy.current?.mock.calls.map((call: readonly unknown[]) => call[0]) ?? [],

    getModifyContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    setupTwoSequentialWithDevServer: ({
      quest,
      exitCode,
      signal,
    }: {
      quest: Quest;
      exitCode: ExitCode;
      signal: StreamSignal;
    }): readonly [ChildProcess, ChildProcess] => {
      // First siege run — use setupSpawnOnce (fires setImmediate during first await)
      configProxy.setupConfigResolved({ config: makeDevServerConfig() });
      buildProxy.setupBuildSuccess();
      const proc1 = makeSigtermResponsive(serverStartProxy.setupServerBecomesReady());
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({ lines: buildSignalLine({ signal }), exitCode });

      // Second siege run — use setupSpawnAutoLines so lines fire when readline is created,
      // not via a setImmediate scheduled before the second siege even starts.
      configProxy.setupConfigResolved({ config: makeDevServerConfig() });
      buildProxy.setupBuildSuccess();
      const proc2 = makeSigtermResponsive(serverStartProxy.setupServerBecomesReady());
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnAutoLines({ lines: buildSignalLine({ signal }), exitCode });

      return [proc1, proc2] as const;
    },

    setupDevServerWithFirstFailSecondSucceeds: ({
      quest,
      exitCode,
      signal,
    }: {
      quest: Quest;
      exitCode: ExitCode;
      signal: StreamSignal;
    }): ChildProcess => {
      // First siege run — siege agent fails (not server failure, just siege outcome).
      // Use setupSpawnOnce so lines fire during the first await.
      configProxy.setupConfigResolved({ config: makeDevServerConfig() });
      buildProxy.setupBuildSuccess();
      makeSigtermResponsive(serverStartProxy.setupServerBecomesReady());
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({
        lines: buildSignalLine({ signal: { signal: 'failed' } as never }),
        exitCode: 1 as never,
      });

      // Second siege run — fresh server, succeeds.
      // Use setupSpawnAutoLines so lines fire when readline is created (second await).
      configProxy.setupConfigResolved({ config: makeDevServerConfig() });
      buildProxy.setupBuildSuccess();
      const proc2 = makeSigtermResponsive(serverStartProxy.setupServerBecomesReady());
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnAutoLines({ lines: buildSignalLine({ signal }), exitCode });

      // First run's server is killed in its finally block; proc2 is killed after second siege
      return proc2;
    },
  };
};
