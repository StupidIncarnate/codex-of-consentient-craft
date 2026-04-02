import { formatTreeNodeTransformer } from './format-tree-node-transformer';
import { TreeNodeStub } from '../../contracts/tree-node/tree-node.stub';
import { FolderNameStub } from '../../contracts/folder-name/folder-name.stub';
import { TreeItemStub } from '../../contracts/tree-item/tree-item.stub';
import { GrepHitStub } from '../../contracts/grep-hit/grep-hit.stub';
import { TreeOutputStub } from '../../contracts/tree-output/tree-output.stub';

describe('formatTreeNodeTransformer', () => {
  it('EMPTY: {node: empty node, indent: 0} => returns empty string', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toStrictEqual(TreeOutputStub({ value: '' }));
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

    expect(result).toStrictEqual(TreeOutputStub({ value: 'has-permission-guard (guard)' }));
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

    expect(result).toStrictEqual(
      TreeOutputStub({ value: 'has-permission-guard (guard) - Validates user permission' }),
    );
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

    expect(result).toStrictEqual(
      TreeOutputStub({ value: 'has-permission-guard (guard)\nis-admin-guard (guard)' }),
    );
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

    expect(result).toStrictEqual(TreeOutputStub({ value: '  has-permission-guard (guard)' }));
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

    expect(result).toStrictEqual(
      TreeOutputStub({ value: 'auth/\n  is-admin-guard (guard)\nhas-permission-guard (guard)' }),
    );
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

    expect(result).toStrictEqual(
      TreeOutputStub({
        value: 'auth/\n  is-admin-guard (guard)\nvalidation/\n  validate-email-guard (guard)',
      }),
    );
  });

  it('VALID: {node: item with hits, indent: 0} => renders hits indented below item', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'adapters' }),
      items: [
        TreeItemStub({
          name: 'fs-access-adapter',
          type: 'adapter',
          path: '/src/adapters/fs-access-adapter.ts',
          purpose: 'Checks if a file is accessible',
          hits: [GrepHitStub({ line: 14, text: "if (error.code === 'ENOENT') {" })],
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toStrictEqual(
      TreeOutputStub({
        value:
          "fs-access-adapter (adapter) - Checks if a file is accessible\n  :14  if (error.code === 'ENOENT') {",
      }),
    );
  });

  it('VALID: {node: item with multiple hits, indent: 0} => renders all hits below item', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'adapters' }),
      items: [
        TreeItemStub({
          name: 'fs-access-adapter',
          type: 'adapter',
          path: '/src/adapters/fs-access-adapter.ts',
          hits: [
            GrepHitStub({ line: 14, text: "if (error.code === 'ENOENT') {" }),
            GrepHitStub({ line: 18, text: "throw new FileNotFoundError('ENOENT');" }),
          ],
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toStrictEqual(
      TreeOutputStub({
        value:
          "fs-access-adapter (adapter)\n  :14  if (error.code === 'ENOENT') {\n  :18  throw new FileNotFoundError('ENOENT');",
      }),
    );
  });

  it('VALID: {node: item without hits, indent: 0} => renders normally with no extra lines', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [
        TreeItemStub({
          name: 'has-permission-guard',
          type: 'guard',
          path: '/src/guards/has-permission-guard.ts',
          purpose: 'Validates user permission',
          hits: undefined,
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toStrictEqual(
      TreeOutputStub({ value: 'has-permission-guard (guard) - Validates user permission' }),
    );
  });

  it('VALID: {node: item with hits, indent: 1} => renders hits with correct indentation', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'adapters' }),
      items: [
        TreeItemStub({
          name: 'fs-access-adapter',
          type: 'adapter',
          path: '/src/adapters/fs-access-adapter.ts',
          hits: [GrepHitStub({ line: 14, text: "if (error.code === 'ENOENT') {" })],
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 1 });

    expect(result).toStrictEqual(
      TreeOutputStub({
        value: "  fs-access-adapter (adapter)\n    :14  if (error.code === 'ENOENT') {",
      }),
    );
  });

  it('EDGE: {node: item with empty hits array, indent: 0} => renders item with no hit lines', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [
        TreeItemStub({
          name: 'has-permission-guard',
          type: 'guard',
          path: '/src/guards/has-permission-guard.ts',
          hits: [],
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toStrictEqual(TreeOutputStub({ value: 'has-permission-guard (guard)' }));
  });

  it('EDGE: {node: item with unknown type, indent: 0} => renders item without type parenthetical', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'e2e' }),
      items: [
        TreeItemStub({
          name: 'smoke.spec',
          type: 'unknown',
          path: '/packages/testing/e2e/web/smoke.spec.ts',
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toStrictEqual(TreeOutputStub({ value: 'smoke.spec' }));
  });

  it('EDGE: {node: item with unknown type and purpose, indent: 0} => renders name and purpose without type', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'e2e' }),
      items: [
        TreeItemStub({
          name: 'smoke.spec',
          type: 'unknown',
          path: '/packages/testing/e2e/web/smoke.spec.ts',
          purpose: 'End-to-end smoke test',
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toStrictEqual(TreeOutputStub({ value: 'smoke.spec - End-to-end smoke test' }));
  });

  it('EDGE: {node: item with empty string purpose, indent: 0} => renders item without purpose suffix', () => {
    const node = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [
        TreeItemStub({
          name: 'has-permission-guard',
          type: 'guard',
          path: '/src/guards/has-permission-guard.ts',
          purpose: '',
        }),
      ],
    });

    const result = formatTreeNodeTransformer({ node, indent: 0 });

    expect(result).toStrictEqual(TreeOutputStub({ value: 'has-permission-guard (guard)' }));
  });
});
