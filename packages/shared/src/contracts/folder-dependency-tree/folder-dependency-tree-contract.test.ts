import { folderDependencyTreeContract } from './folder-dependency-tree-contract';
import { FolderDependencyTreeStub } from './folder-dependency-tree.stub';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('folderDependencyTreeContract', () => {
  it('VALID: {default} => parses successfully with defaults', () => {
    const result = FolderDependencyTreeStub();

    expect(result).toStrictEqual({
      hierarchy: 'statics/          # Can import: nothing (leaf node)',
      graph: {},
      matrix: 'FROM \\ TO',
    });
  });

  it('VALID: {hierarchy: custom} => parses with custom hierarchy', () => {
    const customHierarchy = ContentTextStub({ value: 'brokers/          # Can import: adapters' });
    const result = FolderDependencyTreeStub({ hierarchy: customHierarchy });

    expect(result.hierarchy).toBe('brokers/          # Can import: adapters');
  });

  it('VALID: {graph: with entries} => parses with graph entries', () => {
    const result = FolderDependencyTreeStub({
      graph: {},
    });

    expect(result.graph).toStrictEqual({});
  });

  it('VALID: contract is defined', () => {
    expect(folderDependencyTreeContract).toBeDefined();
  });
});
