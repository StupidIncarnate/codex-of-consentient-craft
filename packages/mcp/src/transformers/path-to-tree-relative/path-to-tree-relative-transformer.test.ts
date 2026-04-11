import { pathToTreeRelativeTransformer } from './path-to-tree-relative-transformer';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';

describe('pathToTreeRelativeTransformer', () => {
  describe('monorepo paths', () => {
    it('VALID: {absolute monorepo path} => prepends package name, strips through src/', () => {
      const filepath = FilePathStub({
        value: '/home/user/repo/packages/hooks/src/adapters/fs/write-file/fs-write-file-adapter.ts',
      });

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('hooks/adapters/fs/write-file/fs-write-file-adapter.ts');
    });

    it('VALID: {relative monorepo path} => prepends package name, strips through src/', () => {
      const filepath = FilePathStub({
        value: 'packages/shared/src/brokers/foo/bar/foo-bar-broker.ts',
      });

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('shared/brokers/foo/bar/foo-bar-broker.ts');
    });

    it('VALID: {two different packages same sub-path} => two distinct roots', () => {
      const hooks = FilePathStub({
        value: 'packages/hooks/src/adapters/fs/write-file/fs-write-file-adapter.ts',
      });
      const shared = FilePathStub({
        value: 'packages/shared/src/adapters/fs/write-file/fs-write-file-adapter.ts',
      });

      const resultHooks = pathToTreeRelativeTransformer({ filepath: hooks });
      const resultShared = pathToTreeRelativeTransformer({ filepath: shared });

      expect(resultHooks).toBe('hooks/adapters/fs/write-file/fs-write-file-adapter.ts');
      expect(resultShared).toBe('shared/adapters/fs/write-file/fs-write-file-adapter.ts');
    });
  });

  describe('single-package repo paths', () => {
    it('VALID: {project with src/ only} => strips through src/, no package prefix', () => {
      const filepath = FilePathStub({
        value: '/home/user/my-project/src/brokers/user/fetch/user-fetch-broker.ts',
      });

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('brokers/user/fetch/user-fetch-broker.ts');
    });

    it('VALID: {relative project-root path} => strips through src/', () => {
      const filepath = FilePathStub({
        value: 'src/guards/has-permission-guard.ts',
      });

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('guards/has-permission-guard.ts');
    });
  });

  describe('scoped package alias paths', () => {
    it('VALID: {@dungeonmaster/shared/src/ path} => uses scoped alias as root', () => {
      const filepath = FilePathStub({
        value: '@dungeonmaster/shared/src/contracts/quest/quest-contract.ts',
      });

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('@dungeonmaster/shared/contracts/quest/quest-contract.ts');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {path without /src/ or packages/} => returns unchanged', () => {
      const filepath = FilePathStub({ value: '/tmp/scratch.ts' });

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('/tmp/scratch.ts');
    });

    it('EDGE: {path with multiple src/ segments} => uses last /src/', () => {
      const filepath = FilePathStub({
        value: '/home/user/projects/src-tooling/src/brokers/foo.ts',
      });

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('brokers/foo.ts');
    });

    it('EDGE: {packages/ in path but no src/ after} => falls through to /src/ logic', () => {
      const filepath = FilePathStub({
        value: '/home/user/my-project/src/brokers/packages-broker.ts',
      });

      const result = pathToTreeRelativeTransformer({ filepath });

      expect(result).toBe('brokers/packages-broker.ts');
    });
  });
});
