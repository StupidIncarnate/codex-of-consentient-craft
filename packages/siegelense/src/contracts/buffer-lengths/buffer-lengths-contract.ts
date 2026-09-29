/**
 * PURPOSE: The lengths of a browser session's three listener buffers (console, network, websocket)
 * at one moment, as `BrowserSession.bufferLengths` reports them. A run records this as the START of
 * its window and reads each buffer forward from that index.
 *
 * USAGE:
 * bufferLengthsContract.parse({ consoleLines: 12, networkLines: 3, websocketLines: 0 });
 * // Returns a BufferLengths with each count branded as a BufferLineCount
 */

import { z } from '#gateway/npm/zod';

import { bufferLineCountContract } from '../buffer-line-count/buffer-line-count-contract';

export const bufferLengthsContract = z
  .object({
    consoleLines: bufferLineCountContract,
    networkLines: bufferLineCountContract,
    websocketLines: bufferLineCountContract,
  })
  .strict()
  .brand<'BufferLengths'>();

export type BufferLengths = z.infer<typeof bufferLengthsContract>;
