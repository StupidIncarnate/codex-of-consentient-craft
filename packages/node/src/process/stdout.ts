/**
 * PURPOSE: Captures the process's stdout stream. Reach for this over `process.stdout`
 * directly so a raw-import lint rule has one name per call site to catch.
 *
 * USAGE:
 * stdout.write('hello\n');
 * // Same Writable object process.stdout is
 */

export const { stdout } = process;
