/**
 * PURPOSE: Reports the diff undid by a reset step ({ files, added, modified, removed }).
 *
 * USAGE:
 * resetUndidContract.parse({ files: 4, added: 2, modified: 1, removed: 1 });
 * // Returns a validated ResetUndid
 */

import { z } from 'zod';

import { readingCountContract } from '../reading-count/reading-count-contract';

export const resetUndidContract = z.object({
  files: readingCountContract,
  added: readingCountContract,
  modified: readingCountContract,
  removed: readingCountContract,
});

export type ResetUndid = z.infer<typeof resetUndidContract>;
