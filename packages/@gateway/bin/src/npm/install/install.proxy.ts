import { npmRunProxy } from '../npm-run/npm-run.proxy';

const ARGS = ['install'];

export const installProxy = (): {
  setupResult: (params: { exitCode: number; output: string }) => void;
  getCallsFor: () => readonly unknown[][];
} => {
  const runProxy = npmRunProxy();

  return {
    setupResult: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ARGS, exitCode, output });
    },

    // No argument to address — `npm install` takes no caller-supplied value beyond cwd.
    getCallsFor: (): readonly unknown[][] => runProxy.getCallsFor({ args: ARGS }),
  };
};
