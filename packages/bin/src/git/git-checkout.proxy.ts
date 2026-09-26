import { gitRunProxy } from './git-run.proxy';

export const gitCheckoutProxy = (): {
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
      runProxy.setupResult({ args: ['checkout', branchName], exitCode, output });
    },
  };
};
