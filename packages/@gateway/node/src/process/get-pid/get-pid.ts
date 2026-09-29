/**
 * PURPOSE: Reads the current process's pid at call time. Reach for this over `process.pid` (or the
 * load-time `pid` capture) when a caller writes or compares its own pid and a test must be able to
 * stage it.
 *
 * USAGE:
 * const currentPid = getPid();
 * // Whatever process.pid holds right now
 */

export const getPid = (): number => process.pid;
