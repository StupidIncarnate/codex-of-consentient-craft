import { gitRunProxy } from '../git-run/git-run.proxy';

const ARGS = ['ls-files', '--others', '--exclude-standard'];

export const untrackedFilesProxy = (): {
  setupResult: (params: { exitCode: number; output: string }) => void;
  setupNotFound: () => void;
  getCallsFor: () => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ARGS, exitCode, output });
    },

    setupNotFound: (): void => {
      runProxy.setupNotFound({ args: ARGS });
    },

    // No argument to address — args are the fixed ARGS constant.
    getCallsFor: (): readonly unknown[][] => runProxy.getCallsFor({ args: ARGS }),
  };
};
