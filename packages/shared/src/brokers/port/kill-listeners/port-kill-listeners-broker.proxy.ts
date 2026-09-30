import { killPidProxy } from '#gateway/bin/kill/kill-pid/kill-pid.proxy';
import { listeningPidsProxy } from '#gateway/bin/lsof/listening-pids/listening-pids.proxy';

export const portKillListenersBrokerProxy = (): {
  setupListeners: (params: { port: number; pids: number[] }) => void;
  setupNoneListening: (params: { port: number }) => void;
  setupKillResult: (params: { pid: number; exitCode: number; output: string }) => void;
  getKillCallsFor: (params: { pid: number }) => readonly unknown[][];
} => {
  const lsofProxy = listeningPidsProxy();
  const killProxy = killPidProxy();

  return {
    setupListeners: ({ port, pids }: { port: number; pids: number[] }): void => {
      lsofProxy.setupPids({ port: port, pids });
    },
    setupNoneListening: ({ port }: { port: number }): void => {
      lsofProxy.setupNoneListening({ port: port });
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
