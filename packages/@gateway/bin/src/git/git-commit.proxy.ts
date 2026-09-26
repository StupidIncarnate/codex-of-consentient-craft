import { gitRunProxy } from './git-run.proxy';

export const commitProxy = (): {
  setupResult: (params: {
    message: string;
    allowEmpty?: boolean;
    exitCode: number;
    output: string;
  }) => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      message,
      allowEmpty,
      exitCode,
      output,
    }: {
      message: string;
      allowEmpty?: boolean;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['commit', '-m', message, ...(allowEmpty === true ? ['--allow-empty'] : [])],
        exitCode,
        output,
      });
    },
  };
};
