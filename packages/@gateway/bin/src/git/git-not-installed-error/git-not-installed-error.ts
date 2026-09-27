/**
 * PURPOSE: Names "git is not on this machine" for a caller of `#gateway/bin/git`, re-thrown by
 * `gitRun` whenever `#gateway/node/child_process`'s `run` reports its own `RunNotFoundError` —
 * so a caller can tell "git is not installed here" apart from "git ran and failed" with an
 * `instanceof` check, without needing to know `run`'s own error type.
 *
 * USAGE:
 * throw new GitNotInstalledError('git rev-parse --abbrev-ref HEAD could not start in /repo: ...');
 */

export class GitNotInstalledError extends Error {}
