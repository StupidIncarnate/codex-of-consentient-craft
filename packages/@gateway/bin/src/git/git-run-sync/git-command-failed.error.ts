/**
 * PURPOSE: Names "git started and exited unsuccessfully" for a caller of `gitRunSync`, carrying the
 * exit status, the signal and git's own stderr. Reach for `GitNotInstalledError` instead when git
 * never started at all; `gitRun` reports a non-zero exit as a returned `exitCode` and never throws this.
 *
 * USAGE:
 * throw new GitCommandFailedError({ args: ['remote'], cwd: '/repo', status: 128, signal: null, stderr: 'fatal: not a git repository' });
 */

export class GitCommandFailedError extends Error {
  public readonly status: number | null;
  public readonly signal: NodeJS.Signals | null;
  public readonly stderr: string;

  public constructor({
    args,
    cwd,
    status,
    signal,
    stderr,
  }: {
    args: readonly string[];
    cwd: string;
    status: number | null;
    signal: NodeJS.Signals | null;
    stderr: string;
  }) {
    super(
      `git ${args.join(' ')} failed in ${cwd} (status ${String(status)}, signal ${String(signal)}): ${stderr}`,
    );
    this.status = status;
    this.signal = signal;
    this.stderr = stderr;
  }
}
