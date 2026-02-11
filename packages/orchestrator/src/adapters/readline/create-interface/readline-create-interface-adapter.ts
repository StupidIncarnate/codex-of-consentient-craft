/**
 * PURPOSE: Wraps Node.js readline.createInterface for line-by-line reading of a readable stream
 *
 * USAGE:
 * const rl = readlineCreateInterfaceAdapter({ input: stdout });
 * rl.onLine(({ line }) => { process.stdout.write(line + '\n'); });
 * rl.close();
 * // Returns a simplified readline interface with onLine callback and close method
 */

import { createInterface } from 'readline';
import type { Readable } from 'stream';

export interface ReadlineInterface {
  onLine: (callback: (params: { line: string }) => void) => void;
  close: () => void;
}

export const readlineCreateInterfaceAdapter = ({
  input,
}: {
  input: Readable;
}): ReadlineInterface => {
  const rl = createInterface({ input });

  return {
    onLine: (callback): void => {
      rl.on('line', (line) => {
        callback({ line });
      });
    },
    close: (): void => {
      rl.close();
    },
  };
};
