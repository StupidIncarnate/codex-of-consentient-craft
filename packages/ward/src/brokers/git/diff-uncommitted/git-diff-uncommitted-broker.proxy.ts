import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';

// The `git diff` and the `git ls-files` are both spawned as bare `git`, so runProxy's own staging
// (addressed by `{command, args}` since F25) tells the two calls apart — the broker awaits them
// through Promise.all, so no ordering matters anyway.
export const gitDiffUncommittedBrokerProxy = (): {
  setupWorkingTree: (params: { trackedOutput: string; untrackedOutput: string }) => void;
  setupGitNotFound: () => void;
  getSpawnedArgs: () => readonly unknown[];
} => {
  const run = runProxy();
  // Created but unstaged: RunNotFoundError is a plain class with nothing to mock — composing its
  // proxy satisfies enforce-proxy-child-creation for the broker's own `instanceof` import.
  RunNotFoundErrorProxy();

  return {
    setupWorkingTree: ({
      trackedOutput,
      untrackedOutput,
    }: {
      trackedOutput: string;
      untrackedOutput: string;
    }): void => {
      run.setupSuccess({
        command: 'git',
        args: ['diff', '--name-only', '--diff-filter=d', 'HEAD'],
        exitCode: 0,
        stdout: trackedOutput,
        stderr: '',
      });
      run.setupSuccess({
        command: 'git',
        args: ['ls-files', '--others', '--exclude-standard'],
        exitCode: 0,
        stdout: untrackedOutput,
        stderr: '',
      });
    },

    // git itself is missing: both parallel calls reject with RunNotFoundError, which the broker's
    // own catch folds into an empty reading for each.
    setupGitNotFound: (): void => {
      run.setupError({
        command: 'git',
        args: ['diff', '--name-only', '--diff-filter=d', 'HEAD'],
        error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }),
      });
      run.setupError({
        command: 'git',
        args: ['ls-files', '--others', '--exclude-standard'],
        error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }),
      });
    },

    getSpawnedArgs: (): readonly unknown[] => run.getCallsFor({ command: 'git' }),
  };
};
