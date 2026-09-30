/**
 * PURPOSE: Stub factory for FolderDependencyTree object type
 *
 * USAGE:
 * const tree = FolderDependencyTreeStub({ hierarchy: 'test' });
 * // Returns validated FolderDependencyTree object
 */
import type { StubArgument } from '../../@types/stub-argument.type';
import {
  folderDependencyTreeContract,
  type FolderDependencyTree,
} from './folder-dependency-tree-contract';

export const FolderDependencyTreeStub = ({
  ...props
}: StubArgument<FolderDependencyTree> = {}): FolderDependencyTree =>
  folderDependencyTreeContract.parse({
    hierarchy: 'statics/          # Can import: nothing (leaf node)',
    graph: {},
    matrix: 'FROM \\ TO',
    ...props,
  });
