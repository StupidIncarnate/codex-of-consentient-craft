/**
 * PURPOSE: Defines the structured result of scanning a package for state-write operations
 *
 * USAGE:
 * stateWritesResultContract.parse({
 *   inMemoryStores: [],
 *   fileWrites: [],
 *   browserStorageWrites: [],
 * });
 * // Returns validated StateWritesResult
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const stateWritesResultContract = z.object({
  inMemoryStores: z.array(contentTextContract),
  fileWrites: z.array(contentTextContract),
  browserStorageWrites: z.array(contentTextContract),
});

export type StateWritesResult = z.infer<typeof stateWritesResultContract>;
