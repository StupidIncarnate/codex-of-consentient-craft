/**
 * PURPOSE: Stub factory for FolderDependencyTree object type
 *
 * USAGE:
 * const tree = FolderDependencyTreeStub({ hierarchy: ContentTextStub({ value: 'test' }) });
 * // Returns validated FolderDependencyTree object
 */
import type { StubArgument } from '../../@types/stub-argument.type';
import {
  folderDependencyTreeContract,
  type FolderDependencyTree,
} from './folder-dependency-tree-contract';
import { ContentTextStub } from '../content-text/content-text.stub';

export const FolderDependencyTreeStub = ({
  ...props
}: StubArgument<FolderDependencyTree> = {}): FolderDependencyTree =>
  folderDependencyTreeContract.parse({
    hierarchy: ContentTextStub({ value: 'statics/          # Can import: nothing (leaf node)' }),
    graph: {},
    matrix: ContentTextStub({ value: 'FROM \\ TO' }),
    ...props,
  });
