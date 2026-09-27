import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';

// git-detect-default-branch spawns bare `git` for every rev-parse check, so runProxy's own staging
// (addressed by `{command, args}` since F25) tells the two sequential calls this broker issues
// apart, with no FIFO ordering needed at all.
export const gitDetectDefaultBranchBrokerProxy = (): {
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherExists: () => void;
  setupGitNotFound: () => void;
} => {
  const run = runProxy();
  // Created but unstaged: RunNotFoundError is a plain class with nothing to mock — composing its
  // proxy satisfies enforce-proxy-child-creation for the broker's own `instanceof` import.
  RunNotFoundErrorProxy();

  return {
    setupMainExists: (): void => {
      run.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'main'],
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    },

    setupMasterExists: (): void => {
      run.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'main'],
        exitCode: 1,
        stdout: '',
        stderr: 'fatal: not a valid ref',
      });
      run.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'master'],
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    },

    setupNeitherExists: (): void => {
      run.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'main'],
        exitCode: 1,
        stdout: '',
        stderr: 'fatal: not a valid ref',
      });
      run.setupSuccess({
        command: 'git',
        args: ['rev-parse', '--verify', 'master'],
        exitCode: 1,
        stdout: '',
        stderr: 'fatal: not a valid ref',
      });
    },

    // git itself is missing: every `git` invocation rejects with RunNotFoundError, which the
    // broker's own catch folds into a failed rev-parse for each call in turn.
    setupGitNotFound: (): void => {
      run.setupError({
        command: 'git',
        args: ['rev-parse', '--verify', 'main'],
        error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }),
      });
      run.setupError({
        command: 'git',
        args: ['rev-parse', '--verify', 'master'],
        error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }),
      });
    },
  };
};
