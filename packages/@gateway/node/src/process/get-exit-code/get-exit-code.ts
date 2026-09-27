/**
 * PURPOSE: Reads the exit code staged on the process so far. A new, descriptive name
 * rather than a bare `process.exitCode` re-export, since a plain property read benefits
 * from a call site a raw-import lint rule can catch the same way it catches a function call.
 *
 * `?? undefined`, not a passthrough: newer `@types/node` (confirmed against a real consumer
 * install of `@types/node@24.19.0`, versus this repo's own pinned `24.0.15`) widen the getter's
 * type to `string | number | null | undefined`, so a bare passthrough breaks this wrapper's return
 * type the moment `npm install` picks up a newer patch inside the `^24.0.15` range it is pinned to.
 * Normalizing keeps every caller's contract at `string | number | undefined` either way.
 *
 * USAGE:
 * const code = getExitCode();
 * // Returns process.exitCode
 */

export const getExitCode = (): number | string | undefined => process.exitCode ?? undefined;
