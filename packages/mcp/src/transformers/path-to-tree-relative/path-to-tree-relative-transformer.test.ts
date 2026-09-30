import { pathToTreeRelativeTransformer } from './path-to-tree-relative-transformer';

describe('pathToTreeRelativeTransformer', () => {
  describe('monorepo paths', () => {
    it('VALID: {absolute monorepo path} => prepends package name, strips through src/', () => {
      const filepath = '/home/user/repo/packages/hooks/src/adapters/fs/write-file/fs-write-file-adapter.ts';

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('hooks/adapters/fs/write-file/fs-write-file-adapter.ts');
    });

    it('VALID: {relative monorepo path} => prepends package name, strips through src/', () => {
      const filepath = 'packages/shared/src/brokers/foo/bar/foo-bar-broker.ts';

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('shared/brokers/foo/bar/foo-bar-broker.ts');
    });

    it('VALID: {two different packages same sub-path} => two distinct roots', () => {
      const hooks = 'packages/hooks/src/adapters/fs/write-file/fs-write-file-adapter.ts';
      const shared = 'packages/orchestrator/src/adapters/fs/write-file/fs-write-file-adapter.ts';

      const resultHooks = pathToTreeRelativeTransformer({ filepath: hooks });
      const resultShared = pathToTreeRelativeTransformer({ filepath: shared });

      expect(resultHooks).toBe('hooks/adapters/fs/write-file/fs-write-file-adapter.ts');
      expect(resultShared).toBe('orchestrator/adapters/fs/write-file/fs-write-file-adapter.ts');
    });
  });

  describe('@-scoped group folder paths (gateway packages)', () => {
    it('VALID: {absolute path under packages/@gateway/npm/src/} => prepends the real package name, not the group, strips through src/', () => {
      const filepath = '/home/user/repo/packages/@gateway/npm/src/glob/glob-adapter.ts';

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('npm/glob/glob-adapter.ts');
    });

    it('VALID: {two gateway packages, same sub-path} => two distinct roots, neither named after the group', () => {
      const npmPath = 'packages/@gateway/npm/src/glob/index.ts';
      const nodePath = 'packages/@gateway/node/src/glob/index.ts';

      expect(pathToTreeRelativeTransformer({ filepath: npmPath })).toBe('npm/glob/index.ts');
      expect(pathToTreeRelativeTransformer({ filepath: nodePath })).toBe('node/glob/index.ts');
    });
  });

  describe('single-package repo paths', () => {
    it('VALID: {project with src/ only} => strips through src/, no package prefix', () => {
      const filepath = '/home/user/my-project/src/brokers/user/fetch/user-fetch-broker.ts';

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('brokers/user/fetch/user-fetch-broker.ts');
    });

    it('VALID: {relative project-root path} => strips through src/', () => {
      const filepath = 'src/guards/has-permission-guard.ts';

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('guards/has-permission-guard.ts');
    });
  });

  describe('scoped package alias paths', () => {
    it('VALID: {@dungeonmaster/shared/src/ path} => uses scoped alias as root', () => {
      const filepath = '@dungeonmaster/shared/src/contracts/quest/quest-contract.ts';

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('@dungeonmaster/shared/contracts/quest/quest-contract.ts');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {path without /src/ or packages/} => returns unchanged', () => {
      const filepath = '/tmp/scratch.ts';

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('/tmp/scratch.ts');
    });

    it('EDGE: {path with multiple src/ segments} => uses last /src/', () => {
      const filepath = '/home/user/projects/src-tooling/src/brokers/foo.ts';

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('brokers/foo.ts');
    });

    it('EDGE: {packages/ in path but no src/ after} => falls through to /src/ logic', () => {
      const filepath = '/home/user/my-project/src/brokers/packages-broker.ts';

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('brokers/packages-broker.ts');
    });
  });
});
