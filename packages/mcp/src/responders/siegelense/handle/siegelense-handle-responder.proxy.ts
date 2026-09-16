/**
 * PURPOSE: Proxy for siegelense-handle-responder. Mocks the four siegelense package functions this
 * responder calls directly — `instanceStartBroker`, `instanceRunBroker`, `instanceKillBroker` and
 * `registryReadBroker` — at the same reference the responder imports, the same way
 * `orchestratorGetQuestSummaryAdapterProxy` mocks `StartOrchestrator.getQuestSummary` directly rather
 * than through an intermediate adapter: this responder reaches siegelense's brokers with no adapter
 * layer in between, so the boundary this proxy mocks is those broker functions themselves. Also
 * composes `SiegelenseReadLayerResponderProxy` and spreads its setup methods in, since
 * `SiegelenseHandleResponder` delegates its four read tools to that layer.
 *
 * USAGE:
 * const proxy = SiegelenseHandleResponderProxy();
 * proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
 * proxy.setupStartReturns({ specName: 'dungeonmaster-web', questId: null, guildId: null, manifest: InstanceManifestStub() });
 */

import {
  instanceKillBroker,
  instanceRunBroker,
  instanceStartBroker,
  registryReadBroker,
} from '@dungeonmaster/siegelense/brokers';
import {
  instanceKillBrokerProxy,
  instanceRunBrokerProxy,
  instanceStartBrokerProxy,
  registryReadBrokerProxy,
} from '@dungeonmaster/siegelense/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { SiegelenseReadLayerResponderProxy } from './siegelense-read-layer-responder.proxy';

type Registry = Awaited<ReturnType<typeof registryReadBroker>>;
type InstanceManifest = Awaited<ReturnType<typeof instanceStartBroker>>;
type RunResult = Awaited<ReturnType<typeof instanceRunBroker>>;
type KillResult = Awaited<ReturnType<typeof instanceKillBroker>>;

export const SiegelenseHandleResponderProxy = (): {
  setupRegistry: (params: { registry: Registry }) => void;
  setupStartReturns: (params: {
    specName: string;
    questId: string | null;
    guildId: string | null;
    manifest: InstanceManifest;
  }) => void;
  setupStartThrows: (params: {
    specName: string;
    questId: string | null;
    guildId: string | null;
    error: Error;
  }) => void;
  setupRunReturns: (params: {
    instanceId: string;
    steps: unknown[];
    stopOn: string;
    result: RunResult;
  }) => void;
  setupRunThrows: (params: {
    instanceId: string;
    steps: unknown[];
    stopOn: string;
    error: Error;
  }) => void;
  setupKillReturns: (params: { instanceId: string; result: KillResult }) => void;
  setupKillThrows: (params: { instanceId: string; error: Error }) => void;
} & ReturnType<typeof SiegelenseReadLayerResponderProxy> => {
  // Composed to satisfy enforce-proxy-child-creation. This responder calls the four siegelense
  // broker functions directly (no adapter in between — see the responder's own header comment), so
  // the mock boundary this proxy actually stages is those broker functions themselves, below. Each
  // child proxy's own setup methods mock several layers deeper (fs, net, spawn); nothing here calls
  // them, since the registerMock calls below intercept the call before any of that real broker body
  // ever runs — the same "created but never driven" shape instanceStartBrokerProxy itself uses for
  // its own phantom child compositions.
  registryReadBrokerProxy();
  instanceStartBrokerProxy();
  instanceRunBrokerProxy();
  instanceKillBrokerProxy();
  const readLayerProxy = SiegelenseReadLayerResponderProxy();

  const registryHandle = registerMock({ fn: registryReadBroker });
  const startHandle = registerMock({ fn: instanceStartBroker });
  const runHandle = registerMock({ fn: instanceRunBroker });
  const killHandle = registerMock({ fn: instanceKillBroker });

  return {
    ...readLayerProxy,
    setupRegistry: ({ registry }: { registry: Registry }): void => {
      registryHandle.calledWith([]).resolves(registry);
    },
    setupStartReturns: ({
      specName,
      questId,
      guildId,
      manifest,
    }: {
      specName: string;
      questId: string | null;
      guildId: string | null;
      manifest: InstanceManifest;
    }): void => {
      startHandle.calledWith([{ specName, questId, guildId }]).resolves(manifest);
    },
    setupStartThrows: ({
      specName,
      questId,
      guildId,
      error,
    }: {
      specName: string;
      questId: string | null;
      guildId: string | null;
      error: Error;
    }): void => {
      startHandle.calledWith([{ specName, questId, guildId }]).rejects(error);
    },
    setupRunReturns: ({
      instanceId,
      steps,
      stopOn,
      result,
    }: {
      instanceId: string;
      steps: unknown[];
      stopOn: string;
      result: RunResult;
    }): void => {
      runHandle.calledWith([{ instanceId, steps, stopOn }]).resolves(result);
    },
    setupRunThrows: ({
      instanceId,
      steps,
      stopOn,
      error,
    }: {
      instanceId: string;
      steps: unknown[];
      stopOn: string;
      error: Error;
    }): void => {
      runHandle.calledWith([{ instanceId, steps, stopOn }]).rejects(error);
    },
    setupKillReturns: ({
      instanceId,
      result,
    }: {
      instanceId: string;
      result: KillResult;
    }): void => {
      killHandle.calledWith([{ instanceId }]).resolves(result);
    },
    setupKillThrows: ({ instanceId, error }: { instanceId: string; error: Error }): void => {
      killHandle.calledWith([{ instanceId }]).rejects(error);
    },
  };
};
