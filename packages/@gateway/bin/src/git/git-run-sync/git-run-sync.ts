/**
 * PURPOSE: Blocking `git` call for a caller that cannot await — a test harness standing up a real
 * fixture repo from a synchronous setup hook. Returns stdout and throws on any unsuccessful exit, so
 * a fixture step that failed stops the setup there. Reach for `gitRun` everywhere else: it is
 * asynchronous and hands a non-zero exit back as data.
 *
 * USAGE:
 * const remotes = gitRunSync({ args: ['remote'], cwd: '/tmp/fixture-repo' });
 * // Returns git's stdout, e.g. 'origin\n'
 *
 * `env`, when given, is the child's WHOLE environment (not an overlay), as `runSyncWithInput` passes
 * it: a caller adding variables spreads its own env snapshot in first.
 */

import { RunNotFoundError, runSyncWithInput } from '#gateway/node/child_process';

import { GitNotInstalledError } from '../git-run/git-not-installed.error';
import { GitCommandFailedError } from './git-command-failed.error';

export const gitRunSync = ({
  args,
  cwd,
  env,
}: {
  args: string[];
  cwd: string;
  env?: Record<string, string | undefined>;
}): string => {
  const result = ((): ReturnType<typeof runSyncWithInput> => {
    try {
      return runSyncWithInput({
        command: 'git',
        args,
        cwd,
        input: '',
        ...(env === undefined ? {} : { env }),
      });
    } catch (error: unknown) {
      if (error instanceof RunNotFoundError) {
        throw new GitNotInstalledError(
          `git ${args.join(' ')} could not start in ${cwd}: ${error.message}`,
        );
      }
      throw error;
    }
  })();

  if (result.status !== 0) {
    throw new GitCommandFailedError({
      args,
      cwd,
      status: result.status,
      signal: result.signal,
      stderr: result.stderr,
    });
  }

  return result.stdout;
};
