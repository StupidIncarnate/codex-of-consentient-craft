/**
 * PURPOSE: Stages the exit code the process reports when it later exits naturally.
 *
 * USAGE:
 * setExitCode(1);
 * // Sets process.exitCode; the process itself keeps running
 */

export const setExitCode = (code: number | string | undefined): void => {
  process.exitCode = code;
};
