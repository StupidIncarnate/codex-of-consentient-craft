import { treeFormatterTransformer } from './tree-formatter-transformer';
import { TreeItemStub } from '../../contracts/tree-item/tree-item.stub';
import { GrepHitStub } from '../../contracts/grep-hit/grep-hit.stub';

describe('treeFormatterTransformer', () => {
  describe('monorepo rooting — prevents cross-package collisions', () => {
    it('VALID: {single monorepo package} => tree rooted at package name', () => {
      const item1 = TreeItemStub({
        name: 'has-permission-guard',
        type: 'guard',
        purpose: 'Validates user permission',
        path: 'packages/mcp/src/guards/has-permission-guard.ts',
      });
      const item2 = TreeItemStub({
        name: 'is-admin-guard',
        type: 'guard',
        purpose: 'Checks if user is admin',
        path: 'packages/mcp/src/guards/is-admin-guard.ts',
      });

      const result = treeFormatterTransformer({ items: [item1, item2] });

      expect(result).toBe(
        `mcp/
  guards/
    has-permission-guard (guard) - Validates user permission
    is-admin-guard (guard) - Checks if user is admin`,
      );
    });

    it('VALID: {two packages same sub-path} => two distinct package roots, no collision', () => {
      const hooksItem = TreeItemStub({
        name: 'fs-write-file-adapter',
        type: 'adapter',
        purpose: 'Write file (hooks)',
        path: 'packages/hooks/src/adapters/fs/write-file/fs-write-file-adapter.ts',
      });
      const sharedItem = TreeItemStub({
        name: 'fs-write-file-adapter',
        type: 'adapter',
        purpose: 'Write file (shared)',
        path: 'packages/shared/src/adapters/fs/write-file/fs-write-file-adapter.ts',
      });

      const result = treeFormatterTransformer({ items: [hooksItem, sharedItem] });

      expect(result).toBe(
        `hooks/
  adapters/
    fs/
      write-file/
        fs-write-file-adapter (adapter) - Write file (hooks)

shared/
  adapters/
    fs/
      write-file/
        fs-write-file-adapter (adapter) - Write file (shared)`,
      );
    });

    it('VALID: {nested folders in monorepo} => proper indentation under package root', () => {
      const item1 = TreeItemStub({
        name: 'rule-ban-primitives-broker',
        type: 'broker',
        purpose: 'Bans raw primitives',
        path: 'packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts',
      });
      const item2 = TreeItemStub({
        name: 'rule-ban-adhoc-types-broker',
        type: 'broker',
        purpose: 'Bans adhoc types',
        path: 'packages/eslint-plugin/src/brokers/rule/ban-adhoc-types/rule-ban-adhoc-types-broker.ts',
      });

      const result = treeFormatterTransformer({ items: [item1, item2] });

      expect(result).toBe(
        `eslint-plugin/
  brokers/
    rule/
      ban-adhoc-types/
        rule-ban-adhoc-types-broker (broker) - Bans adhoc types
      ban-primitives/
        rule-ban-primitives-broker (broker) - Bans raw primitives`,
      );
    });
  });

  describe('single-package repo rooting', () => {
    it('VALID: {project with src/ at root} => tree rooted at top-level folder inside src/', () => {
      const item1 = TreeItemStub({
        name: 'user-fetch-broker',
        type: 'broker',
        purpose: 'Fetch user',
        path: '/home/user/my-project/src/brokers/user/fetch/user-fetch-broker.ts',
      });
      const item2 = TreeItemStub({
        name: 'has-permission-guard',
        type: 'guard',
        purpose: 'Check permission',
        path: '/home/user/my-project/src/guards/has-permission-guard.ts',
      });

      const result = treeFormatterTransformer({ items: [item1, item2] });

      expect(result).toBe(
        `brokers/
  user/
    fetch/
      user-fetch-broker (broker) - Fetch user

guards/
  has-permission-guard (guard) - Check permission`,
      );
    });
  });

  describe('rendering details', () => {
    it('VALID: {file without purpose} => shows without dash', () => {
      const item = TreeItemStub({
        name: 'plain-transformer',
        type: 'transformer',
        purpose: undefined,
        path: 'packages/mcp/src/transformers/plain-transformer.ts',
      });

      const result = treeFormatterTransformer({ items: [item] });

      expect(result).toBe(`mcp/
  transformers/
    plain-transformer (transformer)`);
    });

    it('EMPTY: {no items} => returns empty string', () => {
      const result = treeFormatterTransformer({ items: [] });

      expect(result).toBe('');
    });

    it('VALID: {items with grep hits} => renders hits below items', () => {
      const item = TreeItemStub({
        name: 'fs-access-adapter',
        type: 'adapter',
        purpose: 'Checks if a file is accessible',
        path: 'packages/mcp/src/adapters/fs-access-adapter.ts',
        hits: [
          GrepHitStub({ line: 14, text: "if (error.code === 'ENOENT') {" }),
          GrepHitStub({ line: 18, text: "throw new FileNotFoundError('ENOENT');" }),
        ],
      });

      const result = treeFormatterTransformer({ items: [item] });

      expect(result).toBe(
        `mcp/
  adapters/
    fs-access-adapter (adapter) - Checks if a file is accessible
      :14  if (error.code === 'ENOENT') {
      :18  throw new FileNotFoundError('ENOENT');`,
      );
    });

    it('VALID: {mix of items with and without hits} => only hit items show hits', () => {
      const itemWithHits = TreeItemStub({
        name: 'fs-access-adapter',
        type: 'adapter',
        purpose: 'Checks access',
        path: 'packages/mcp/src/adapters/fs-access-adapter.ts',
        hits: [GrepHitStub({ line: 14, text: "if (error.code === 'ENOENT') {" })],
      });
      const itemWithoutHits = TreeItemStub({
        name: 'fs-read-adapter',
        type: 'adapter',
        purpose: 'Reads files',
        path: 'packages/mcp/src/adapters/fs-read-adapter.ts',
      });

      const result = treeFormatterTransformer({ items: [itemWithHits, itemWithoutHits] });

      expect(result).toBe(
        `mcp/
  adapters/
    fs-access-adapter (adapter) - Checks access
      :14  if (error.code === 'ENOENT') {
    fs-read-adapter (adapter) - Reads files`,
      );
    });
  });
});
