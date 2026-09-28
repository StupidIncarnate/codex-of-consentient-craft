import { killPidProxy } from '#gateway/bin/kill/kill-pid/kill-pid.proxy';
import { listeningPidsProxy } from '#gateway/bin/lsof/listening-pids/listening-pids.proxy';

import type { NetworkPort } from '../../../contracts/network-port/network-port-contract';

export const portKillListenersBrokerProxy = (): {
  setupListeners: (params: { port: NetworkPort; pids: number[] }) => void;
  setupNoneListening: (params: { port: NetworkPort }) => void;
  setupKillResult: (params: { pid: number; exitCode: number; output: string }) => void;
  getKillCallsFor: (params: { pid: number }) => readonly unknown[][];
} => {
  const lsofProxy = listeningPidsProxy();
  const killProxy = killPidProxy();

  return {
    setupListeners: ({ port, pids }: { port: NetworkPort; pids: number[] }): void => {
      lsofProxy.setupPids({ port: Number(port), pids });
    },
    setupNoneListening: ({ port }: { port: NetworkPort }): void => {
      lsofProxy.setupNoneListening({ port: Number(port) });
    },
    setupKillResult: ({
      pid,
      exitCode,
      output,
    }: {
      pid: number;
      exitCode: number;
      output: string;
    }): void => {
      killProxy.setupResult({ pid, exitCode, output });
    },
    getKillCallsFor: ({ pid }: { pid: number }): readonly unknown[][] =>
      killProxy.getCallsFor({ pid }),
  };
};
