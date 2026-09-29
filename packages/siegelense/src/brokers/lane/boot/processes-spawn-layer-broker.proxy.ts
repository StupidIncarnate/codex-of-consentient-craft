// PURPOSE: Proxy for processes-spawn-layer-broker — stages each launch's spawn (sticky, or one-shot
// so a boot and a respawn of the same command get different pids) and each ready URL's answer.
// USAGE: const proxy = processesSpawnLayerBrokerProxy(); proxy.setupSpawn({ command, args, pid });

import { childProcessSpawnDetachedAdapterProxy } from '../../../adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.proxy';
import { laneReadyWaitBrokerProxy } from '../ready-wait/lane-ready-wait-broker.proxy';

// First clock read answers the spawn's own deadline computation; every later read is far past it,
// so the first failed probe reports "expired" with no real wait.
const CLOCK_BASE_MS = 1_700_000_000_000;
const CLOCK_PAST_DEADLINE_MS = 1_710_000_000_000;

export const processesSpawnLayerBrokerProxy = (): {
  setupSpawn: (params: { command: string; args: readonly string[]; pid: number }) => void;
  setupSpawnOnce: (params: { command: string; args: readonly string[]; pid: number }) => void;
  setupReachable: (params: { url: string }) => void;
  setupUnreachable: (params: { url: string }) => void;
  setupDeadlineAlreadyPast: () => void;
  getSpawnOptionsFor: (params: { command: string; args: readonly string[] }) => unknown;
} => {
  const spawnProxy = childProcessSpawnDetachedAdapterProxy();
  const readyWaitProxy = laneReadyWaitBrokerProxy();

  return {
    setupSpawn: ({
      command,
      args,
      pid,
    }: {
      command: string;
      args: readonly string[];
      pid: number;
    }): void => {
      spawnProxy.succeeds({ command, args: [...args], pid });
    },

    setupSpawnOnce: ({
      command,
      args,
      pid,
    }: {
      command: string;
      args: readonly string[];
      pid: number;
    }): void => {
      spawnProxy.succeedsOnce({ command, args: [...args], pid });
    },

    setupReachable: ({ url }: { url: string }): void => {
      readyWaitProxy.setupReachable({ url });
    },

    setupUnreachable: ({ url }: { url: string }): void => {
      readyWaitProxy.setupUnreachable({ url });
    },

    setupDeadlineAlreadyPast: (): void => {
      readyWaitProxy.stageDeadlineExceeded({
        firstCallMs: CLOCK_BASE_MS,
        thenMs: CLOCK_PAST_DEADLINE_MS,
      });
    },

    getSpawnOptionsFor: ({
      command,
      args,
    }: {
      command: string;
      args: readonly string[];
    }): unknown => spawnProxy.getOptionsFor({ command, args: [...args] }),
  };
};
