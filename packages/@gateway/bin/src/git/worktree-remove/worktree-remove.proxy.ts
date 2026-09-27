import { gitRunProxy } from '../git-run/git-run.proxy';

export const worktreeRemoveProxy = (): {
  setupResult: (params: { worktreePath: string; exitCode: number; output: string }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      worktreePath,
      exitCode,
      output,
    }: {
      worktreePath: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['worktree', 'remove', '--force', worktreePath],
        exitCode,
        output,
      });
    },
  };
};
