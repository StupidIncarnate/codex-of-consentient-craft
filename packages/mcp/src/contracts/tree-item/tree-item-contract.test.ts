import { treeItemContract as _treeItemContract } from './tree-item-contract';
import { TreeItemStub } from './tree-item.stub';

describe('treeItemContract', () => {
  it('VALID: {name, type, path, purpose} => parses successfully', () => {
    const result = TreeItemStub({
      name: 'has-permission-guard',
      type: 'guard',
      path: '/src/guards/has-permission-guard.ts',
      purpose: 'Validates permission',
    });

    expect(result).toStrictEqual({
      name: 'has-permission-guard',
      type: 'guard',
      path: '/src/guards/has-permission-guard.ts',
      purpose: 'Validates permission',
    });
  });

  it('VALID: {name, type, path} without purpose => parses successfully', () => {
    const result = TreeItemStub({
      name: 'plain-transformer',
      type: 'transformer',
      path: '/src/transformers/plain-transformer.ts',
    });

    expect(result.name).toBe('plain-transformer');
    expect(result.type).toBe('transformer');
    expect(result.path).toBe('/src/transformers/plain-transformer.ts');
    expect(result.purpose).toBeUndefined();
  });
});
