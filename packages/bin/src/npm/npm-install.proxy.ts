import { npmRunProxy } from './npm-run.proxy';

export const npmInstallProxy = (): {
  setupResult: (params: { exitCode: number; output: string }) => void;
} => {
  const runProxy = npmRunProxy();

  return {
    setupResult: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ['install'], exitCode, output });
    },
  };
};
