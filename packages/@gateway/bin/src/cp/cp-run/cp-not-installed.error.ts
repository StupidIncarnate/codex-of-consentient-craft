/**
 * PURPOSE: Names "cp is not on this machine" for a caller of `#gateway/bin/cp`, re-thrown by
 * `cpRun` whenever `#gateway/node/child_process`'s `run` reports its own `RunNotFoundError`.
 *
 * USAGE:
 * throw new CpNotInstalledError('cp -a /src /dest could not start in /repo: ...');
 */

export class CpNotInstalledError extends Error {}
