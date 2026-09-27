import { gitRunProxy } from '../git-run/git-run.proxy';

const ARGS = ['rev-parse', '--abbrev-ref', 'HEAD'];

export const currentBranchProxy = (): {
  setupBranch: (params: { branch: string }) => void;
  setupDetached: () => void;
  setupFailure: (params: { exitCode: number; output: string }) => void;
  getCallsFor: () => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupBranch: ({ branch }: { branch: string }): void => {
      runProxy.setupResult({ args: ARGS, exitCode: 0, output: branch });
    },
    setupDetached: (): void => {
      runProxy.setupResult({ args: ARGS, exitCode: 0, output: 'HEAD' });
    },
    setupFailure: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ARGS, exitCode, output });
    },

    // No argument to address — the args are the fixed ARGS constant. The unknown a test cannot
    // otherwise read back is which cwd the caller actually resolved.
    getCallsFor: (): readonly unknown[][] => runProxy.getCallsFor({ args: ARGS }),
  };
};
