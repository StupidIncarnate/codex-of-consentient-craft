/**
 * PURPOSE: Wraps Node.js readline.createInterface for line-by-line stream reading
 *
 * USAGE:
 * const rl = readlineCreateInterfaceAdapter({ input: readableStream });
 * rl.on('line', (line) => { ... });
 * // Returns readline Interface for line-by-line processing
 */

import { createInterface, type Interface } from 'readline';
import type { Readable } from 'stream';

export const readlineCreateInterfaceAdapter = ({ input }: { input: Readable }): Interface =>
  createInterface({
    input,
    crlfDelay: Infinity,
  });
