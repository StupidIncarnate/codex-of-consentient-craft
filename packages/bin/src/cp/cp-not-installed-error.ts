/**
 * PURPOSE: Names the one failure `run` cannot itself distinguish from an ordinary command failure —
 * `cp` missing from `$PATH` collapses to `{exitCode: 1, output: '', signal: null}`. A real `cp`
 * failure (missing source, cross-device link) always writes a message to stderr, so this detection
 * is safe here — see `@dungeonmaster/bin/git`'s `git-run.ts` header for the general reasoning.
 *
 * USAGE:
 * throw new CpNotInstalledError('cp -a produced no output');
 */

export class CpNotInstalledError extends Error {}
