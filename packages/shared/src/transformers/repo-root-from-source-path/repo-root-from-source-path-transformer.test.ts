import { repoRootFromSourcePathTransformer } from './repo-root-from-source-path-transformer';

describe('repoRootFromSourcePathTransformer', () => {
  describe('valid input', () => {
    it('VALID: {plain package file} => returns the folder above packages/', () => {
      const result = repoRootFromSourcePathTransformer({
        filePath: '/repo/packages/shared/src/contracts/a/a-contract.ts',
      });

      expect(result).toBe('/repo');
    });

    it('VALID: {scoped package file} => returns the folder above packages/', () => {
      const result = repoRootFromSourcePathTransformer({
        filePath: '/repo/packages/@gateway/node/src/fs/fs.ts',
      });

      expect(result).toBe('/repo');
    });

    it('VALID: {worktree path} => returns the worktree, the nearest folder above packages/', () => {
      const result = repoRootFromSourcePathTransformer({
        filePath: '/repo/worktrees/pivot/packages/shared/src/x.ts',
      });

      expect(result).toBe('/repo/worktrees/pivot');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {file outside a package src} => returns undefined', () => {
      const result = repoRootFromSourcePathTransformer({ filePath: '/repo/scripts/build.ts' });

      expect(result).toBe(undefined);
    });
  });
});
