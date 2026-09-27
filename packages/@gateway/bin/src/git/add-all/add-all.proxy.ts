import { gitRunProxy } from '../git-run/git-run.proxy';

const ARGS = ['add', '-A'];

export const addAllProxy = (): {
  setupResult: (params: { exitCode: number; output: string }) => void;
  getCallsFor: () => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ARGS, exitCode, output });
    },

    // No argument to address — `git add -A` takes no caller-supplied value, so the only unknown
    // a test can read back is which cwd it ran in.
    getCallsFor: (): readonly unknown[][] => runProxy.getCallsFor({ args: ARGS }),
  };
};
