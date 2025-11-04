/**
 * PURPOSE: Creates test data for tree items with name, type, path, and optional purpose
 *
 * USAGE:
 * const item = TreeItemStub({ name: 'guard', type: 'guard', path: '/src/guards/guard.ts' });
 * // Returns tree item for tree formatter testing
 */
import { treeItemContract } from './tree-item-contract';
import type { TreeItem } from './tree-item-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const TreeItemStub = ({ ...props }: StubArgument<TreeItem> = {}): TreeItem =>
  treeItemContract.parse({
    name: 'example-guard',
    type: 'guard',
    path: '/project/src/guards/example-guard.ts',
    ...props,
  });
