import { treeItemContract as _treeItemContract } from './tree-item-contract';
import { TreeItemStub } from './tree-item.stub';
import { GrepHitStub } from '../grep-hit/grep-hit.stub';

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

    expect(result).toStrictEqual({
      name: 'plain-transformer',
      type: 'transformer',
      path: '/src/transformers/plain-transformer.ts',
    });
  });

  it('VALID: {with hits array} => parses successfully', () => {
    const result = TreeItemStub({
      name: 'fs-access-adapter',
      type: 'adapter',
      path: '/src/adapters/fs-access-adapter.ts',
      hits: [GrepHitStub({ line: 14, text: 'if (error.code === "ENOENT") {' })],
    });

    expect(result).toStrictEqual({
      name: 'fs-access-adapter',
      type: 'adapter',
      path: '/src/adapters/fs-access-adapter.ts',
      hits: [{ line: 14, text: 'if (error.code === "ENOENT") {' }],
    });
  });
});
