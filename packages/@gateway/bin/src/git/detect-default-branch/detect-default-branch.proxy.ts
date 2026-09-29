import { gitRunProxy } from '../git-run/git-run.proxy';

export const detectDefaultBranchProxy = (): {
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherExists: () => void;
  setupNotFound: () => void;
  getCallsFor: () => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupMainExists: (): void => {
      runProxy.setupResult({ args: ['rev-parse', '--verify', 'main'], exitCode: 0, output: '' });
    },
    setupMasterExists: (): void => {
      runProxy.setupResult({ args: ['rev-parse', '--verify', 'main'], exitCode: 128, output: '' });
      runProxy.setupResult({ args: ['rev-parse', '--verify', 'master'], exitCode: 0, output: '' });
    },
    setupNeitherExists: (): void => {
      runProxy.setupResult({ args: ['rev-parse', '--verify', 'main'], exitCode: 128, output: '' });
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'master'],
        exitCode: 128,
        output: '',
      });
    },

    // `git` never starting fails the FIRST call, so staging that one is all a not-found needs.
    setupNotFound: (): void => {
      runProxy.setupNotFound({ args: ['rev-parse', '--verify', 'main'] });
    },

    // Neither call takes a caller-supplied value — `main`/`master` are this function's own
    // literals, not something a caller passes in — so read-back has nothing to address beyond
    // "was either verify call made", which this predicate recognizes regardless of which branch
    // name it checked.
    getCallsFor: (): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: (args: readonly unknown[]): boolean =>
          args[0] === 'rev-parse' &&
          args[1] === '--verify' &&
          (args[2] === 'main' || args[2] === 'master'),
      }),
  };
};
