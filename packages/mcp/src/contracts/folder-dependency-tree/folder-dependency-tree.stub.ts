import type { StubArgument } from '@questmaestro/shared/@types';
import { folderDependencyTreeContract } from './folder-dependency-tree-contract';
import type { FolderDependencyTree } from './folder-dependency-tree-contract';
import { ContentTextStub } from '../content-text/content-text.stub';
import { FolderTypeStub } from '@questmaestro/shared/contracts';

export const FolderDependencyTreeStub = ({
  ...props
}: StubArgument<FolderDependencyTree> = {}): FolderDependencyTree =>
  folderDependencyTreeContract.parse({
    hierarchy: ContentTextStub({ value: 'statics/          # Can import: nothing (leaf node)' }),
    graph: {
      [FolderTypeStub({ value: 'statics' })]: [],
    },
    matrix: ContentTextStub({
      value: 'FROM \\ TO    | statics\n-------------+-------------\nstatics      |             ',
    }),
    ...props,
  });
