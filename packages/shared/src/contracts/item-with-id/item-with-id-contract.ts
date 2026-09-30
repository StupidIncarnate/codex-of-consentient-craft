/**
 * PURPOSE: Defines the shape of an item that has an `id` property, used for deep upsert operations
 *
 * USAGE:
 * import type { ItemWithId } from './item-with-id-contract';
 * // Use as constraint for arrays that support id-based upsert
 */

import { z } from '#gateway/npm/zod';

export const itemWithIdContract = z
  .object({
    id: z.string(),
    _delete: z.boolean().optional(),
  })
  .loose()
  .brand<'ItemWithId'>();

// The input type, which carries no brand: this is a generic constraint (`T extends ItemWithId`)
// that every quest item array must satisfy structurally, not a parsed value.
export type ItemWithId = z.input<typeof itemWithIdContract>;
