// PURPOSE: Proxy for processes-spawn-layer-broker — stages each launch's spawn (sticky:
// a later staging of the same address replaces the pid, which is how a respawn of one command
// gets a different pid than its boot) and each ready URL's answer.
// USAGE: const proxy = processesSpawnLayerBrokerProxy(); proxy.setupSpawn({ command, args, cwd, pid });

import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { spawnDetachedProxy } from '#gateway/node/child_process/spawn-detached/spawn-detached.proxy';

import { laneReadyWaitBrokerProxy } from '../ready-wait/lane-ready-wait-broker.proxy';

// First clock read answers the spawn's own deadline computation; every later read is far past it,
// so the first failed probe reports "expired" with no real wait.
const CLOCK_BASE_MS = 1_700_000_000_000;
const CLOCK_PAST_DEADLINE_MS = 1_710_000_000_000;

export const processesSpawnLayerBrokerProxy = (): {
  setupSpawn: (params: {
    command: string;
    args: readonly string[];
    cwd: string;
    pid: number;
  }) => void;
  setupReachable: (params: { url: string }) => void;
  setupUnreachable: (params: { url: string }) => void;
  setupDeadlineAlreadyPast: () => void;
  getSpawnOptionsFor: (params: {
    command: string;
    args: readonly string[];
    cwd: string;
  }) => readonly unknown[];
} => {
  const spawnProxy = spawnDetachedProxy();
  const readyWaitProxy = laneReadyWaitBrokerProxy();
  const clockProxy = nowProxy();
  clockProxy.setupNow({ ms: CLOCK_BASE_MS });

  return {
    setupSpawn: ({
      command,
      args,
      cwd,
      pid,
    }: {
      command: string;
      args: readonly string[];
      cwd: string;
      pid: number;
    }): void => {
      spawnProxy.setupSuccess({ command, args: [...args], cwd, pid });
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
      cwd,
    }: {
      command: string;
      args: readonly string[];
      cwd: string;
    }): readonly unknown[] => spawnProxy.getSpawnedOptions({ command, args: [...args], cwd }),
  };
};
