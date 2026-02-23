/**
 * PURPOSE: Wraps Node.js readline.createInterface to create a line-by-line reader from a readable stream
 *
 * USAGE:
 * const rl = readlineCreateLineReaderAdapter({ input: childProcess.stdout });
 * rl.on('line', (line) => { ... });
 * // Returns readline.Interface for line-by-line reading
 */

import { createInterface } from 'readline';
import type { Interface as ReadlineInterface } from 'readline';

export const readlineCreateLineReaderAdapter = ({
  input,
}: {
  input: NodeJS.ReadableStream;
}): ReadlineInterface => createInterface({ input });
