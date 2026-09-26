import { cpRunProxy } from './cp-run.proxy';

export const cpCopyRecursiveProxy = (): {
  setupResult: (params: {
    sources: string[];
    destination: string;
    hardlink?: boolean;
    exitCode: number;
    output: string;
  }) => void;
} => {
  const runProxy = cpRunProxy();

  return {
    setupResult: ({
      sources,
      destination,
      hardlink,
      exitCode,
      output,
    }: {
      sources: string[];
      destination: string;
      hardlink?: boolean;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: [hardlink === true ? '-al' : '-a', ...sources, destination],
        exitCode,
        output,
      });
    },
  };
};
