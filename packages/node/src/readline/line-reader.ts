/**
 * PURPOSE: Thin `readline.createInterface` wrapper for tapping a readable stream line by line.
 * Takes an `onError` callback the raw interface has no equivalent parameter for — a torn stream
 * mid-tail emits its own `'error'` event, and without a place to route it that error is silently
 * lost rather than surfaced to whatever is watching the tail.
 *
 * USAGE:
 * const reader = lineReader({ input: someReadableStream });
 * reader.onLine((line) => { ... });
 * reader.onError((error) => { ... });
 * reader.close();
 */

import { createInterface } from 'readline';
import type { Readable } from 'stream';

export const lineReader = ({
  input,
}: {
  input: Readable;
}): {
  onLine: (callback: (line: string) => void) => void;
  onError: (callback: (error: Error) => void) => void;
  close: () => void;
} => {
  const rl = createInterface({ input });

  return {
    onLine: (callback): void => {
      rl.on('line', callback);
    },
    // readline's own interface re-emits a torn input stream's 'error' on ITSELF (`rl`), not on
    // `input` — verified directly: a listener on `input` alone still leaves `rl`'s own re-emit
    // unheard, which Node throws as an unhandled error.
    onError: (callback): void => {
      rl.on('error', callback);
    },
    close: (): void => {
      rl.close();
    },
  };
};
