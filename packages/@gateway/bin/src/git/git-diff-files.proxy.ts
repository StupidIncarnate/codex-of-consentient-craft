import { gitRunProxy } from './git-run.proxy';

export const diffFilesProxy = (): {
  setupResult: (params: { revisionArg: string; exitCode: number; output: string }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      revisionArg,
      exitCode,
      output,
    }: {
      revisionArg: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({ args: ['diff', revisionArg, '--name-only'], exitCode, output });
    },
  };
};
