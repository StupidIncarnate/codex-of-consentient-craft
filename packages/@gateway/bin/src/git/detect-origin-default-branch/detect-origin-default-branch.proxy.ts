import { gitRunProxy } from '../git-run/git-run.proxy';

export const detectOriginDefaultBranchProxy = (): {
  setupOriginMainExists: () => void;
  setupOriginMasterExists: () => void;
  setupNeitherExists: () => void;
  getCallsFor: () => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupOriginMainExists: (): void => {
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'origin/main'],
        exitCode: 0,
        output: '',
      });
    },
    setupOriginMasterExists: (): void => {
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'origin/main'],
        exitCode: 128,
        output: '',
      });
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'origin/master'],
        exitCode: 0,
        output: '',
      });
    },
    setupNeitherExists: (): void => {
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'origin/main'],
        exitCode: 128,
        output: '',
      });
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'origin/master'],
        exitCode: 128,
        output: '',
      });
    },

    // Neither call takes a caller-supplied value — `origin/main`/`origin/master` are this
    // function's own literals — so read-back has nothing to address beyond "was either verify
    // call made", which this predicate recognizes regardless of which ref it checked.
    getCallsFor: (): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: (args: readonly unknown[]): boolean =>
          args[0] === 'rev-parse' &&
          args[1] === '--verify' &&
          (args[2] === 'origin/main' || args[2] === 'origin/master'),
      }),
  };
};
