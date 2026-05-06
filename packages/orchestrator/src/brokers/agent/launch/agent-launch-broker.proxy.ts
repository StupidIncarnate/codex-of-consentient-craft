import type { RepoRootCwd } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { agentSpawnUnifiedBrokerProxy } from '../spawn-unified/agent-spawn-unified-broker.proxy';
import { chatStreamProcessHandleBrokerProxy } from '../../chat/stream-process-handle/chat-stream-process-handle-broker.proxy';
import { composeKillLayerBrokerProxy } from './compose-kill-layer-broker.proxy';
import { startMainTailLayerBrokerProxy } from './start-main-tail-layer-broker.proxy';

type SpawnEmitParams = Parameters<
  ReturnType<typeof agentSpawnUnifiedBrokerProxy>['setupSpawnAndEmitLines']
>[0];
type SpawnExitOnKillReturn = ReturnType<
  ReturnType<typeof agentSpawnUnifiedBrokerProxy>['setupSpawnExitOnKill']
>;
type SuccessConfigParams = Parameters<
  ReturnType<typeof agentSpawnUnifiedBrokerProxy>['setupSuccessConfig']
>[0];
type MainTailGuildParams = Parameters<
  ReturnType<typeof startMainTailLayerBrokerProxy>['setupGuild']
>[0];

const LAUNCHER_PROCESS_UUID = '00000000-0000-4000-8000-000000000a01';

export const agentLaunchBrokerProxy = (): {
  setupSpawnAndEmitLines: (params: SpawnEmitParams) => void;
  setupSpawnExitOnKill: (params: SpawnEmitParams) => SpawnExitOnKillReturn;
  setupSpawnSuccess: (params: SuccessConfigParams) => void;
  setupSpawnThrow: (params: { error: Error }) => void;
  setupSpawnThrowOnce: (params: { error: Error }) => void;
  setupSpawnLazy: () => void;
  setAutoEmitLines: (params: { lines: readonly string[] }) => void;
  emitLines: (params: { lines: readonly string[] }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedOptions: () => unknown;
  setupMainTailGuild: (params: MainTailGuildParams) => void;
  setupMainTailLines: (params: { lines: readonly string[] }) => void;
  triggerMainTailChange: () => void;
  getSpawnedCwd: () => RepoRootCwd | undefined;
} => {
  const spawnProxy = agentSpawnUnifiedBrokerProxy();
  // The handle-broker proxy mocks `claudeLineNormalizeBroker`, `crypto.randomUUID`,
  // `Date.prototype.toISOString`, and the sub-agent tail (which uses fsWatchTailAdapter).
  // Wired BEFORE startMainTailLayerBrokerProxy so the launcher's main-session-tail call
  // sees the most-recent fsWatchTailAdapter mock closure — which is mainTailLayerProxy's
  // closure (registered next), not the subagent's. Without this ordering, the launcher's
  // watch() listener gets pushed into the subagent proxy's closure and `triggerMainTail
  // Change` (which fires mainTailLayerProxy's closure) finds it empty.
  chatStreamProcessHandleBrokerProxy();
  // startMainTailLayerBrokerProxy wires up the chatMainSessionTailBroker proxy chain so
  // launcher tests can seed guild config, tail lines, and trigger appends without going
  // through the underlying main-session-tail broker proxy directly. Registered AFTER
  // chatStreamProcessHandleBrokerProxy so its fsWatchTailAdapter closure is the active
  // mock impl when the launcher's main-tail call fires.
  const mainTailLayerProxy = startMainTailLayerBrokerProxy();
  // composeKillLayerBroker is a pure function with no I/O; its proxy is empty but is
  // wired here to satisfy enforce-proxy-child-creation.
  composeKillLayerBrokerProxy();

  // Mock the launcher's own crypto.randomUUID call (mints the processId). registerSpyOn
  // is stack-based — this handle is independent of the handle-broker proxy's UUID mock
  // (which seeds entry uuids), so tests can assert a deterministic processId.
  registerSpyOn({ object: crypto, method: 'randomUUID' }).mockReturnValue(LAUNCHER_PROCESS_UUID);

  return {
    setupSpawnAndEmitLines: (params: SpawnEmitParams): void => {
      spawnProxy.setupSpawnAndEmitLines(params);
    },
    setupSpawnExitOnKill: (params: SpawnEmitParams): SpawnExitOnKillReturn =>
      spawnProxy.setupSpawnExitOnKill(params),
    setupSpawnSuccess: (params: SuccessConfigParams): void => {
      spawnProxy.setupSuccessConfig(params);
    },
    setupSpawnThrow: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrow({ error });
    },
    setupSpawnThrowOnce: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrowOnce({ error });
    },
    setupSpawnLazy: (): void => {
      spawnProxy.setupSpawnOnceLazy();
    },
    setAutoEmitLines: ({ lines }: { lines: readonly string[] }): void => {
      spawnProxy.setAutoEmitLines({ lines });
    },
    emitLines: ({ lines }: { lines: readonly string[] }): void => {
      spawnProxy.emitLines({ lines });
    },
    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
    getSpawnedOptions: (): unknown => spawnProxy.getSpawnedOptions(),
    setupMainTailGuild: (params: MainTailGuildParams): void => {
      mainTailLayerProxy.setupGuild(params);
    },
    setupMainTailLines: ({ lines }: { lines: readonly string[] }): void => {
      mainTailLayerProxy.setupLines({ lines });
    },
    triggerMainTailChange: (): void => {
      mainTailLayerProxy.triggerChange();
    },
    // Delegates to the underlying spawn proxy so callers (e.g. chatSpawnBrokerProxy tests)
    // can verify that the resolved cwd was forwarded to the launcher's spawn call.
    getSpawnedCwd: (): RepoRootCwd | undefined => spawnProxy.getSpawnedCwd(),
  };
};
