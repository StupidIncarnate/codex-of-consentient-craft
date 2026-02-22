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
import { z } from 'zod';
import { folderNameContract } from '../folder-name/folder-name-contract';
import type { FolderName } from '../folder-name/folder-name-contract';
import { treeItemContract } from '../tree-item/tree-item-contract';

export const treeNodeContract = z.object({
  name: folderNameContract,
  items: z.array(treeItemContract),
});

export type TreeNode = z.infer<typeof treeNodeContract> & {
  children: Map<FolderName, TreeNode>;
};
