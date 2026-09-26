import { npmRunProxy } from './npm-run.proxy';

export const npmRunScriptProxy = (): {
  setupResult: (params: {
    script: string;
    workspace?: string;
    args?: string[];
    exitCode: number;
    output: string;
  }) => void;
} => {
  const runProxy = npmRunProxy();

  return {
    setupResult: ({
      script,
      workspace,
      args,
      exitCode,
      output,
    }: {
      script: string;
      workspace?: string;
      args?: string[];
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: [
          'run',
          script,
          ...(workspace === undefined ? [] : [`--workspace=${workspace}`]),
          ...(args ?? []),
        ],
        exitCode,
        output,
      });
    },
  };
};
