/**
 * PURPOSE: Defines tree node structure for organizing tree items hierarchically
 *
 * USAGE:
 * const node = treeNodeContract.parse({
 *   name: folderNameContract.parse('guards'),
 *   children: new Map(),
 *   items: []
 * });
 * // Returns validated TreeNode
 */
import { z } from '#gateway/npm/zod';
import { folderNameContract } from '../folder-name/folder-name-contract';
import { treeItemContract } from '../tree-item/tree-item-contract';

interface TreeNodeSelf {
  name: string;
  items: z.infer<typeof treeItemContract>[];
  children: Map<string, TreeNodeSelf>;
}

// A getter, not `z.lazy` + a cast — its return type wraps `z.core.$ZodType`, the self-reference
// form `contracts/` allows.
export const treeNodeContract = z.object({
  name: z.string().brand<'TreeNodeName'>(),
  items: z.array(treeItemContract),
  get children(): z.ZodMap<typeof folderNameContract, z.core.$ZodType<TreeNodeSelf>> {
    return z.map(folderNameContract, treeNodeContract);
  },
});

export type TreeNode = z.infer<typeof treeNodeContract>;
