import { gitRunProxy } from './git-run.proxy';

const ARGS = ['rev-parse', '--abbrev-ref', 'HEAD'];

export const gitCurrentBranchProxy = (): {
  setupBranch: (params: { branch: string }) => void;
  setupDetached: () => void;
  setupFailure: (params: { exitCode: number; output: string }) => void;
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
  };
};
