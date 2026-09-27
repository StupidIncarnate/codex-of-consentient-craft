/**
 * PURPOSE: Names "kill is not on this machine" for a caller of `#gateway/bin/kill`, re-thrown
 * by `killRun` whenever `#gateway/node/child_process`'s `run` reports its own
 * `RunNotFoundError`.
 *
 * USAGE:
 * throw new KillNotInstalledError('kill -SIGKILL 12345 could not start in /repo: ...');
 */

export class KillNotInstalledError extends Error {}
