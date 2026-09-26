/**
 * PURPOSE: Names the one failure `run` cannot itself distinguish from an ordinary command failure —
 * `git` missing from `$PATH` collapses to `{exitCode: 1, output: '', signal: null}`, identical in
 * shape to a real git invocation that happened to fail silently. Every `@dungeonmaster/bin/git`
 * function throws this instead of returning that ambiguous shape, so a caller can tell "git is not
 * installed here" apart from "git ran and failed" with an `instanceof` check.
 *
 * USAGE:
 * throw new GitNotInstalledError('git rev-parse --abbrev-ref HEAD produced no output in /repo');
 */

export class GitNotInstalledError extends Error {}
