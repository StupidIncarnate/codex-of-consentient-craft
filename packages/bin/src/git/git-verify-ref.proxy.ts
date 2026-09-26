import { gitRunProxy } from './git-run.proxy';

export const gitVerifyRefProxy = (): {
  setupResult: (params: { ref: string; exitCode: number }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({ ref, exitCode }: { ref: string; exitCode: number }): void => {
      runProxy.setupResult({ args: ['rev-parse', '--verify', ref], exitCode, output: '' });
    },
  };
};
