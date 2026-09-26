import { gitRunProxy } from './git-run.proxy';

export const gitUntrackedFilesProxy = (): {
  setupResult: (params: { exitCode: number; output: string }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({
        args: ['ls-files', '--others', '--exclude-standard'],
        exitCode,
        output,
      });
    },
  };
};
