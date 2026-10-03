/**
 * PURPOSE: Defines the schema and branded type for an individual item in a tracked disk store,
 * including its location, size, modification timestamp, and eviction protection reason. Reach
 * for this over raw filesystem stats when planning disk budget reclamation across stores.
 *
 * USAGE:
 * diskItemContract.parse({
 *   storeId: 'ward-run-results',
 *   path: '/repo/.ward/run-1.json',
 *   bytes: 1024,
 *   mtimeMs: 1700000000000,
 *   protectedReason: null,
 * });
 * // Returns: DiskItem validated object
 */

import { z } from '#gateway/npm/zod';

export const diskItemContract = z
  .object({
    storeId: z.string().brand<'DiskItemStoreId'>(),
    path: z.string().brand<'DiskItemPath'>(),
    bytes: z.number().int().nonnegative().brand<'DiskItemBytes'>(),
    mtimeMs: z.number().int().nonnegative().brand<'DiskItemMtimeMs'>(),
    protectedReason: z.string().brand<'DiskItemProtectedReason'>().nullable(),
  })
  .brand<'DiskItem'>();

export type DiskItem = z.infer<typeof diskItemContract>;
