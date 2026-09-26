import { killRunProxy } from './kill-run.proxy';

export const killPidProxy = (): {
  setupResult: (params: {
    pid: number;
    signal?: NodeJS.Signals;
    exitCode: number;
    output: string;
  }) => void;
} => {
  const runProxy = killRunProxy();

  return {
    setupResult: ({
      pid,
      signal,
      exitCode,
      output,
    }: {
      pid: number;
      signal?: NodeJS.Signals;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: [`-${signal ?? 'SIGKILL'}`, String(pid)],
        exitCode,
        output,
      });
    },
  };
};
