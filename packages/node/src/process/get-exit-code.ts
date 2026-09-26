/**
 * PURPOSE: Reads the exit code staged on the process so far. A new, descriptive name
 * rather than a bare `process.exitCode` re-export, since a plain property read benefits
 * from a call site a raw-import lint rule can catch the same way it catches a function call.
 *
 * USAGE:
 * const code = getExitCode();
 * // Returns process.exitCode
 */

export const getExitCode = (): number | string | undefined => process.exitCode;
