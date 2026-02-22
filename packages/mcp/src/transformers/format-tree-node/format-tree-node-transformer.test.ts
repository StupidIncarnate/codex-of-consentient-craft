import { formatTreeNodeTransformer } from './format-tree-node-transformer';
import { TreeNodeStub } from '../../contracts/tree-node/tree-node.stub';
import { FolderNameStub } from '../../contracts/folder-name/folder-name.stub';
import { TreeItemStub } from '../../contracts/tree-item/tree-item.stub';

describe('formatTreeNodeTransformer', () => {
  it('VALID: {node: empty node, indent: 0} => returns empty string', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toBe('');
  });

  it('VALID: {node: node with one item, indent: 0} => returns formatted item', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [
        TreeItemStub({
          name: 'has-permission-guard',
          type: 'guard',
          path: '/src/guards/has-permission-guard.ts',
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toBe('has-permission-guard (guard)');
  });

  it('VALID: {node: node with item and purpose, indent: 0} => returns formatted item with purpose', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [
        TreeItemStub({
          name: 'has-permission-guard',
          type: 'guard',
          path: '/src/guards/has-permission-guard.ts',
          purpose: 'Validates user permission',
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toBe('has-permission-guard (guard) - Validates user permission');
  });

  it('VALID: {node: node with multiple items, indent: 0} => returns alphabetically sorted items', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [
        TreeItemStub({
          name: 'is-admin-guard',
          type: 'guard',
          path: '/src/guards/is-admin-guard.ts',
        }),
        TreeItemStub({
          name: 'has-permission-guard',
          type: 'guard',
          path: '/src/guards/has-permission-guard.ts',
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toBe('has-permission-guard (guard)\nis-admin-guard (guard)');
  });

  it('VALID: {node: node with one item, indent: 1} => returns indented item', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [
        TreeItemStub({
          name: 'has-permission-guard',
          type: 'guard',
          path: '/src/guards/has-permission-guard.ts',
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 1 });

    expect(result).toBe('  has-permission-guard (guard)');
  });

  it('VALID: {node: node with children, indent: 0} => returns formatted children and items', () => {
    const childNode = TreeNodeStub({
      name: FolderNameStub({ value: 'auth' }),
      items: [
        TreeItemStub({
          name: 'is-admin-guard',
          type: 'guard',
          path: '/src/guards/auth/is-admin-guard.ts',
        }),
      ],
    });

    const children = new Map();
    children.set(FolderNameStub({ value: 'auth' }), childNode);

    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [
        TreeItemStub({
          name: 'has-permission-guard',
          type: 'guard',
          path: '/src/guards/has-permission-guard.ts',
        }),
      ],
      children,
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toBe('auth/\n  is-admin-guard (guard)\nhas-permission-guard (guard)');
  });

  it('VALID: {node: node with multiple children, indent: 0} => returns alphabetically sorted children', () => {
    const childNode1 = TreeNodeStub({
      name: FolderNameStub({ value: 'validation' }),
      items: [
        TreeItemStub({
          name: 'validate-email-guard',
          type: 'guard',
          path: '/src/guards/validation/validate-email-guard.ts',
        }),
      ],
    });

    const childNode2 = TreeNodeStub({
      name: FolderNameStub({ value: 'auth' }),
      items: [
        TreeItemStub({
          name: 'is-admin-guard',
          type: 'guard',
          path: '/src/guards/auth/is-admin-guard.ts',
        }),
      ],
    });

    const children = new Map();
    children.set(FolderNameStub({ value: 'validation' }), childNode1);
    children.set(FolderNameStub({ value: 'auth' }), childNode2);

    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [],
      children,
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toBe(
      'auth/\n  is-admin-guard (guard)\nvalidation/\n  validate-email-guard (guard)',
    );
  });
});
