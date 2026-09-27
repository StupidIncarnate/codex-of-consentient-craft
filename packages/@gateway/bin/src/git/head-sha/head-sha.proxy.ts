import { gitRunProxy } from '../git-run/git-run.proxy';

export const headShaProxy = (): {
  setupResult: (params: { exitCode: number; output: string }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ['rev-parse', 'HEAD'], exitCode, output });
    },
  };
};
