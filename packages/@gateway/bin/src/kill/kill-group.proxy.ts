import { killRunProxy } from './kill-run.proxy';

export const killGroupProxy = (): {
  setupResult: (params: {
    pgid: number;
    signal?: NodeJS.Signals;
    exitCode: number;
    output: string;
  }) => void;
} => {
  const runProxy = killRunProxy();

  return {
    setupResult: ({
      pgid,
      signal,
      exitCode,
      output,
    }: {
      pgid: number;
      signal?: NodeJS.Signals;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: [`-${signal ?? 'SIGKILL'}`, `-${pgid}`],
        exitCode,
        output,
      });
    },
  };
};
