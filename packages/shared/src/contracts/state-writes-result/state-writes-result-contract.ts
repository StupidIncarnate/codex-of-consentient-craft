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

import { z } from '#gateway/npm/zod';

export const stateWritesResultContract = z
  .object({
    inMemoryStores: z.array(z.string().brand<'StateWritesResultInMemoryStores'>()),
    fileWrites: z.array(z.string().brand<'StateWritesResultFileWrites'>()),
    browserStorageWrites: z.array(z.string().brand<'StateWritesResultBrowserStorageWrites'>()),
  })
  .brand<'StateWritesResult'>();

export type StateWritesResult = z.infer<typeof stateWritesResultContract>;
