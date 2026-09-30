/**
 * PURPOSE: Defines tree node structure for organizing tree items hierarchically
 *
 * USAGE:
 * const node = treeNodeContract.parse({
 *   name: 'guards',
 *   children: new Map(),
 *   items: []
 * });
 * // Returns validated TreeNode
 */
import { z } from '#gateway/npm/zod';
import { treeItemContract } from '../tree-item/tree-item-contract';
import type { TreeItem } from '../tree-item/tree-item-contract';

// Spelled out, not inferred: the getter below needs the node's own type before `treeNodeContract`
// exists. It carries the same brands the contract's output does, so a child read out of `children`
// is a `TreeNode`.
interface TreeNodeSelf extends z.core.$brand<'TreeNode'> {
  name: string & z.core.$brand<'TreeNodeName'>;
  items: TreeItem[];
  children: Map<string, TreeNodeSelf>;
}

// A getter, not `z.lazy` + a cast — its return type wraps `z.core.$ZodType`, the self-reference
// form `contracts/` allows.
export const treeNodeContract = z.object({
  name: z.string().brand<'TreeNodeName'>(),
  items: z.array(treeItemContract),
  get children(): z.ZodMap<z.ZodString, z.core.$ZodType<TreeNodeSelf>> {
    return z.map(z.string(), treeNodeContract);
  },
}).brand<'TreeNode'>();

export type TreeNode = z.infer<typeof treeNodeContract>;
