/**
 * PURPOSE: Reads all of process.stdin to a string until EOF. Reach for this over iterating
 * `process.stdin` directly so every stdin-reading caller shares one buffering strategy.
 *
 * USAGE:
 * const data = await readStdinToEnd();
 * // Returns the full stdin contents as a string. Returns '' if stdin is closed immediately.
 */

export const readStdinToEnd = async (): Promise<string> => {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
};
