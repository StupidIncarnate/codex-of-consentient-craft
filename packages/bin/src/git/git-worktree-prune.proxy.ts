import { gitRunProxy } from './git-run.proxy';

export const gitWorktreePruneProxy = (): {
  setupResult: (params: { exitCode: number; output: string }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ['worktree', 'prune'], exitCode, output });
    },
  };
};
