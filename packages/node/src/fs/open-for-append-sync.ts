/**
 * PURPOSE: Opens a file in append mode and returns its raw OS file descriptor. Reach for this
 * over `appendFileSync` when the descriptor itself is needed — a spawned process's `stdio` array
 * takes a real fd number, not a stream. Flag `'a'` creates the file if it is missing. Always
 * paired with `closeSync` once the descriptor is no longer needed, since a leaked fd outlives the
 * process that opened it.
 *
 * USAGE:
 * const fd = openForAppendSync('/tmp/dm-siege-inst_7f3a9c21/api-server.log');
 * // Returns the open file descriptor, creating the file if it did not exist
 */
import { openSync } from 'fs';

export const openForAppendSync = (path: string): number => openSync(path, 'a');
