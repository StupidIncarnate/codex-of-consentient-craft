import type { RepoRootCwd } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { randomUUID } from '#gateway/node/crypto';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

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
type MainTailHomeDirParams = Parameters<
  ReturnType<typeof startMainTailLayerBrokerProxy>['setupHomeDir']
>[0];

const LAUNCHER_PROCESS_UUID = '00000000-0000-4000-8000-000000000a01';

export const agentLaunchBrokerProxy = (): {
  setupProcessUuid: (params: { uuid: string }) => void;
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
  setupMainTailHomeDir: (params: MainTailHomeDirParams) => void;
  setupMainTailLines: (params: { path: string; lines: readonly string[] }) => void;
  getSpawnedCwd: () => RepoRootCwd | undefined;
} => {
  const spawnProxy = agentSpawnUnifiedBrokerProxy();
  // The handle-broker proxy mocks `claudeLineNormalizeBroker`, `crypto.randomUUID`,
  // `Date.prototype.toISOString`, and the sub-agent tail. Each tail proxy stages by file path,
  // so the sub-agent tails and the main-session tail never answer for one another.
  chatStreamProcessHandleBrokerProxy();
  // startMainTailLayerBrokerProxy wires up the chatMainSessionTailBroker proxy chain so
  // launcher tests can seed the home dir and the tail's lines by path without going
  // through the underlying main-session-tail broker proxy directly.
  const mainTailLayerProxy = startMainTailLayerBrokerProxy();
  // composeKillLayerBroker is a pure function with no I/O; its proxy is empty but is
  // wired here to satisfy enforce-proxy-child-creation.
  composeKillLayerBrokerProxy();

  // Pin the launcher's own randomUUID call (mints the processId). The handle-broker proxy's UUID
  // mock seeds entry uuids on a different object, so the two never answer for one another and
  // tests can assert a deterministic processId. randomUUID takes no identifying argument — []
  // is the honest address.
  const processUuidHandle = registerMock({ fn: randomUUID });
  processUuidHandle.calledWith([]).returns(LAUNCHER_PROCESS_UUID);

  // The launcher writes its diagnostics to stderr; composed so no test writes to the real stream.
  stderrProxy();

  return {
    setupProcessUuid: ({ uuid }: { uuid: string }): void => {
      processUuidHandle.calledWith([]).returns(uuid);
    },
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
    setupMainTailHomeDir: (params: MainTailHomeDirParams): void => {
      mainTailLayerProxy.setupHomeDir(params);
    },
    setupMainTailLines: ({ path, lines }: { path: string; lines: readonly string[] }): void => {
      mainTailLayerProxy.setupLines({ path, lines });
    },
    // Delegates to the underlying spawn proxy so callers (e.g. chatSpawnBrokerProxy tests)
    // can verify that the resolved cwd was forwarded to the launcher's spawn call.
    getSpawnedCwd: (): RepoRootCwd | undefined => spawnProxy.getSpawnedCwd(),
  };
};
