/**
 * PURPOSE: Captures the current process's pid. Reach for this over `process.pid` directly
 * so a raw-import lint rule has one name per call site to catch.
 *
 * USAGE:
 * const currentPid = pid;
 * // Same value process.pid holds
 */

export const { pid } = process;
