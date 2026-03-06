/**
 * PURPOSE: Defines the shape of an item that has an `id` property, used for deep upsert operations
 *
 * USAGE:
 * import type { ItemWithId } from './item-with-id-contract';
 * // Use as constraint for arrays that support id-based upsert
 */

import { z } from 'zod';

export const itemWithIdContract = z
  .object({
    id: z.unknown(),
    _delete: z.boolean().optional(),
  })
  .passthrough();

export type ItemWithId = z.infer<typeof itemWithIdContract>;
