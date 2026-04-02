/**
 * PURPOSE: Defines schema for tree formatter input (list item + path)
 *
 * USAGE:
 * const item: TreeItem = treeItemContract.parse({ name: 'guard', type: 'guard', purpose: 'Checks', path: '/path' });
 * // Returns validated tree item with path for formatting
 */
import { z } from 'zod';
import { grepHitContract } from '../grep-hit/grep-hit-contract';
import { discoverListItemContract } from '../discover-list-item/discover-list-item-contract';

export const treeItemContract = discoverListItemContract.extend({
  path: z.string().brand<'AbsoluteFilePath'>(),
  hits: z.array(grepHitContract).optional(),
});

export type TreeItem = z.infer<typeof treeItemContract>;
