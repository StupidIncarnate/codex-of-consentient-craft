import { gitRunProxy } from '../git-run/git-run.proxy';

const ARGS = ['rev-parse', 'HEAD'];

export const headShaProxy = (): {
  setupResult: (params: { exitCode: number; output: string }) => void;
  getCallsFor: () => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ARGS, exitCode, output });
    },

    // No argument to address — args are the fixed ARGS constant.
    getCallsFor: (): readonly unknown[][] => runProxy.getCallsFor({ args: ARGS }),
  };
};
