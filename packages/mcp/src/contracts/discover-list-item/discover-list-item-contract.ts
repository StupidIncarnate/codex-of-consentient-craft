/**
 * PURPOSE: Defines lightweight schema for discover list items (name, type, purpose only)
 *
 * USAGE:
 * const item: DiscoverListItem = discoverListItemContract.parse({ name: 'guard', type: 'guard', purpose: 'Checks permission' });
 * // Returns validated list item for compact tree view
 */
import { z } from 'zod';

export const discoverListItemContract = z.object({
  name: z.string().brand<'FunctionName'>(),
  type: z.string().brand<'FileType'>(),
  purpose: z.string().brand<'Purpose'>().optional(),
});

export type DiscoverListItem = z.infer<typeof discoverListItemContract>;
