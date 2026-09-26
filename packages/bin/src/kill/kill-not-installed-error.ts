/**
 * PURPOSE: Names the one failure `run` cannot itself distinguish from an ordinary command failure —
 * the `kill` binary missing from `$PATH` collapses to `{exitCode: 1, output: '', signal: null}`.
 * Unlike `lsof`, a real `kill` failure (no such process, permission denied) always writes something
 * to stderr, so this detection is safe here — see `lsof-listening-pids.ts`'s header for the sibling
 * module where the same shape is genuinely ambiguous.
 *
 * USAGE:
 * throw new KillNotInstalledError('kill -SIGKILL 12345 produced no output');
 */

export class KillNotInstalledError extends Error {}
