/**
 * PURPOSE: Creates test data for tree nodes with folder names, children map, and items
 *
 * USAGE:
 * const node = TreeNodeStub({ name: 'guards', items: [] });
 * // Returns tree node for testing tree structure
 */
import { treeNodeContract } from './tree-node-contract';
import type { TreeNode } from './tree-node-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { TreeItemStub } from '../tree-item/tree-item.stub';

export const TreeNodeStub = ({ ...props }: StubArgument<TreeNode> = {}): TreeNode =>
  treeNodeContract.parse({
    name: 'guards',
    items: [TreeItemStub()],
    children: new Map(),
    ...props,
  });
