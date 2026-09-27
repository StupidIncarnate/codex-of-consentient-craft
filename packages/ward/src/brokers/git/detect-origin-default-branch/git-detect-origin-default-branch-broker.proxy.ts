import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';

// Both rev-parse calls this broker issues are spawned as bare `git`, so runProxy's own staging
// (addressed by `{command, args}` since F25) tells them apart, with no FIFO ordering needed.
export const gitDetectOriginDefaultBranchBrokerProxy = (): {
  setupOriginMainExists: () => void;
  setupOriginMasterExists: () => void;
  setupNoOriginRefs: () => void;
  setupGitNotFound: () => void;
  getSpawnedArgs: () => readonly unknown[];
} => {
  const run = runProxy();
  // Created but unstaged: RunNotFoundError is a plain class with nothing to mock — composing its
  // proxy satisfies enforce-proxy-child-creation for the broker's own `instanceof` import.
  RunNotFoundErrorProxy();

  return {
    setupOriginMainExists: (): void => {
      run.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'origin/main'],
        exitCode: 0,
        stdout: 'abc123\n',
        stderr: '',
      });
    },

    setupOriginMasterExists: (): void => {
      run.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'origin/main'],
        exitCode: 1,
        stdout: '',
        stderr: 'fatal: Needed a single revision',
      });
      run.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'origin/master'],
        exitCode: 0,
        stdout: 'def456\n',
        stderr: '',
      });
    },

    setupNoOriginRefs: (): void => {
      run.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'origin/main'],
        exitCode: 1,
        stdout: '',
        stderr: 'fatal: Needed a single revision',
      });
      run.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'origin/master'],
        exitCode: 1,
        stdout: '',
        stderr: 'fatal: Needed a single revision',
      });
    },

    // git itself is missing: every `git` invocation rejects with RunNotFoundError, which the
    // broker's own catch folds into a failed rev-parse for each call in turn.
    setupGitNotFound: (): void => {
      run.setupError({
        command: 'git',
        args: ['rev-parse', '--verify', 'origin/main'],
        error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }),
      });
      run.setupError({
        command: 'git',
        args: ['rev-parse', '--verify', 'origin/master'],
        error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }),
      });
    },

    getSpawnedArgs: (): readonly unknown[] => run.getCallsFor({ command: 'git' }),
  };
};
