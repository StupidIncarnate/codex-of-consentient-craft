/**
 * PURPOSE: Names the one failure `run` cannot itself distinguish from an ordinary command failure —
 * `npm` missing from `$PATH` collapses to `{exitCode: 1, output: '', signal: null}`, identical in
 * shape to a real npm invocation that happened to fail silently. Every `@dungeonmaster/bin/npm`
 * function throws this instead of returning that ambiguous shape.
 *
 * USAGE:
 * throw new NpmNotInstalledError('npm install produced no output in /repo');
 */

export class NpmNotInstalledError extends Error {}
