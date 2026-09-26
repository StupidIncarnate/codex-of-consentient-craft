import { gitRunProxy } from './git-run.proxy';

export const gitPushProxy = (): {
  setupPlainPush: (params: { exitCode: number; output: string }) => void;
  setupUpstreamPush: (params: { branchName: string; exitCode: number; output: string }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupPlainPush: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ['push'], exitCode, output });
    },
    setupUpstreamPush: ({
      branchName,
      exitCode,
      output,
    }: {
      branchName: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({ args: ['push', '-u', 'origin', branchName], exitCode, output });
    },
  };
};
