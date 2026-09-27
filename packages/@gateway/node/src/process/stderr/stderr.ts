/**
 * PURPOSE: Captures the process's stderr stream. Reach for this over `process.stderr`
 * directly so a raw-import lint rule has one name per call site to catch.
 *
 * USAGE:
 * stderr.write('oops\n');
 * // Same Writable object process.stderr is
 */

export const { stderr } = process;
