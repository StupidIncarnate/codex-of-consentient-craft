/**
 * PURPOSE: Returns the process's stdin stream, read at call time. Reach for this over
 * `process.stdin` directly so a raw-import lint rule has one name per call site to catch. It is a
 * function, not a captured constant: reading `process.stdin` makes Node open stdin, and when the
 * host's stdin is a pipe (a jest worker) that leaves a PIPEWRAP handle open in every module that
 * merely imported the barrel.
 *
 * USAGE:
 * const answer = await question({ input: getStdin(), output: stdout, prompt: 'Name: ', fallback: '' });
 * // Same Readable object process.stdin is, opened by this call and not before
 */

export const getStdin = (): NodeJS.ReadStream => process.stdin;
