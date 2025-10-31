import { FolderDependencyTreeStub } from './folder-dependency-tree.stub';
import { ContentTextStub } from '../content-text/content-text.stub';
import { FolderTypeStub } from '@questmaestro/shared/contracts';

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
    const result = FolderDependencyTreeStub({
      graph: {
        [FolderTypeStub({ value: 'guards' })]: [FolderTypeStub({ value: 'statics' })],
      },
    });

    expect(result.graph).toStrictEqual({
      [FolderTypeStub({ value: 'guards' })]: [FolderTypeStub({ value: 'statics' })],
    });
  });
});
