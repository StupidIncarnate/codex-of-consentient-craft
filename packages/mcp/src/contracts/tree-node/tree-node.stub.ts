/**
 * PURPOSE: Creates test data for tree nodes with folder names, children map, and items
 *
 * USAGE:
 * const node = TreeNodeStub({ name: FolderNameStub({ value: 'guards' }), items: [] });
 * // Returns tree node for testing tree structure
 */
import { treeNodeContract } from './tree-node-contract';
import type { TreeNode } from './tree-node-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { FolderNameStub } from '../folder-name/folder-name.stub';
import { TreeItemStub } from '../tree-item/tree-item.stub';

export const TreeNodeStub = ({ ...props }: StubArgument<TreeNode> = {}): TreeNode => {
  const { children, ...dataProps } = props;

  return {
    ...treeNodeContract.parse({
      name: FolderNameStub({ value: 'guards' }),
      items: [TreeItemStub()],
      ...dataProps,
    }),
    children: (children ?? new Map()) as Map<ReturnType<typeof FolderNameStub>, TreeNode>,
  };
};
