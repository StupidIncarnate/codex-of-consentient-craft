/**
 * PURPOSE: The length of one of a browser session's listener buffers (console, network,
 * websocket) at the moment it is read, as `BrowserSession.bufferLengths` reports it. Reach for this
 * over ReadingCount: a run records a BufferLineCount as the START of its window and reads forward
 * from it, while a ReadingCount is what that window then tallies.
 *
 * USAGE:
 * bufferLineCountContract.parse(12);
 * // Returns a branded BufferLineCount
 */

import { z } from '#gateway/npm/zod';

export const bufferLineCountContract = z.number().int().nonnegative().brand<'BufferLineCount'>();

export type BufferLineCount = z.infer<typeof bufferLineCountContract>;
