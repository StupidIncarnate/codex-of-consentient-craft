import { gitRunProxy } from './git-run.proxy';

export const worktreeAddProxy = (): {
  setupCreateBranch: (params: {
    worktreePath: string;
    branchName: string;
    baseBranch: string;
    exitCode: number;
    output: string;
  }) => void;
  setupAttachExisting: (params: {
    worktreePath: string;
    branchName: string;
    exitCode: number;
    output: string;
  }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupCreateBranch: ({
      worktreePath,
      branchName,
      baseBranch,
      exitCode,
      output,
    }: {
      worktreePath: string;
      branchName: string;
      baseBranch: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        exitCode,
        output,
      });
    },
    setupAttachExisting: ({
      worktreePath,
      branchName,
      exitCode,
      output,
    }: {
      worktreePath: string;
      branchName: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['worktree', 'add', worktreePath, branchName],
        exitCode,
        output,
      });
    },
  };
};
