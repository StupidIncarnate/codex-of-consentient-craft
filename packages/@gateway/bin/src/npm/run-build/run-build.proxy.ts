import { npmRunProxy } from '../npm-run/npm-run.proxy';

export const runBuildProxy = (): {
  setupResult: (params: { workspace: string; exitCode: number; output: string }) => void;
} => {
  const runProxy = npmRunProxy();

  return {
    setupResult: ({
      workspace,
      exitCode,
      output,
    }: {
      workspace: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['run', 'build', `--workspace=${workspace}`],
        exitCode,
        output,
      });
    },
  };
};
