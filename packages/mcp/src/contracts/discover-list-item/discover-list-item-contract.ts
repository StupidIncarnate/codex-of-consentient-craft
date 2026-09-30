/**
 * PURPOSE: Defines lightweight schema for discover list items (name, type, purpose only)
 *
 * USAGE:
 * const item: DiscoverListItem = discoverListItemContract.parse({ name: 'guard', type: 'guard', purpose: 'Checks permission' });
 * // Returns validated list item for compact tree view
 */
import { z } from '#gateway/npm/zod';

export const discoverListItemContract = z
  .object({
    name: z.string().brand<'DiscoverListItemName'>(),
    type: z.string().brand<'DiscoverListItemType'>(),
    purpose: z.string().brand<'DiscoverListItemPurpose'>().optional(),
  })
  .brand<'DiscoverListItem'>();

export type DiscoverListItem = z.infer<typeof discoverListItemContract>;
