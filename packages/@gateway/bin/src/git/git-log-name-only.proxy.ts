import { gitRunProxy } from './git-run.proxy';

export const logNameOnlyProxy = (): {
  setupResult: (params: { baseRef: string; exitCode: number; output: string }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      baseRef,
      exitCode,
      output,
    }: {
      baseRef: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['log', '--name-only', '--format=%x1e%H%x1f%s%x1f%b%x1f', `${baseRef}..HEAD`],
        exitCode,
        output,
      });
    },
  };
};
