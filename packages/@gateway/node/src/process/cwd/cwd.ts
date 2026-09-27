/**
 * PURPOSE: Reads the process's current working directory. Reach for this over
 * `process.cwd()` directly so callers go through the gateway's one sanctioned wrapper
 * (`no-bare-process-cwd` allows this file and this file alone to call the raw global).
 *
 * USAGE:
 * const dir = cwd();
 * // Returns the same string process.cwd() does
 */

export const cwd = (): string => process.cwd();
