/**
 * PURPOSE: Captures the process's stdin stream. Reach for this over `process.stdin`
 * directly so a raw-import lint rule has one name per call site to catch.
 *
 * USAGE:
 * const answer = await question({ input: stdin, output: stdout, prompt: 'Name: ', fallback: '' });
 * // Same Readable object process.stdin is
 */

export const { stdin } = process;
