/**
 * PURPOSE: Captures the process's argv array. Reach for this over `process.argv` directly
 * so a raw-import lint rule has one name per call site to catch.
 *
 * USAGE:
 * const args = argv;
 * // Same array process.argv is
 */

export const { argv } = process;
