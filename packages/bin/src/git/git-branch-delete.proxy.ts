import { gitRunProxy } from './git-run.proxy';

export const gitBranchDeleteProxy = (): {
  setupResult: (params: { branchName: string; exitCode: number; output: string }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      branchName,
      exitCode,
      output,
    }: {
      branchName: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({ args: ['branch', '-D', branchName], exitCode, output });
    },
  };
};
