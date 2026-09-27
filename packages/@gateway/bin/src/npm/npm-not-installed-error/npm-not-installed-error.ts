/**
 * PURPOSE: Names "npm is not on this machine" for a caller of `#gateway/bin/npm`, re-thrown by
 * `npmRun` whenever `#gateway/node/child_process`'s `run` reports its own `RunNotFoundError`.
 *
 * USAGE:
 * throw new NpmNotInstalledError('npm install could not start in /repo: ...');
 */

export class NpmNotInstalledError extends Error {}
