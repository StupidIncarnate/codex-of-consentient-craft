import { folderDependencyTreeContract as _folderDependencyTreeContract } from './folder-dependency-tree-contract';
import { FolderDependencyTreeStub } from './folder-dependency-tree.stub';
import { ContentTextStub } from '../content-text/content-text.stub';
import { FolderTypeStub } from '@questmaestro/shared/contracts';
import { ImportPathStub } from '../import-path/import-path.stub';

describe('folderDependencyTreeContract', () => {
  it('VALID: {} => parses successfully with default values', () => {
    const result = FolderDependencyTreeStub();

    expect(result).toStrictEqual({
      hierarchy: ContentTextStub({ value: 'statics/          # Can import: nothing (leaf node)' }),
      graph: {
        [FolderTypeStub({ value: 'statics' })]: [],
      },
      matrix: ContentTextStub({
        value: 'FROM \\ TO    | statics\n-------------+-------------\nstatics      |             ',
      }),
    });
  });

  it('VALID: {graph: {guards: [statics]}} => parses successfully', () => {
    const guardsKey = FolderTypeStub({ value: 'guards' });
    const staticsPath = ImportPathStub({ value: 'statics' });

    const result = FolderDependencyTreeStub({
      graph: {
        [guardsKey]: [staticsPath],
      },
    });

    expect(result.graph[guardsKey]).toStrictEqual([staticsPath]);
  });
});
