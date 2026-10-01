import { workPlanFileRepoRelativeTransformer } from './work-plan-file-repo-relative-transformer';

const WORKTREE = '/home/testuser/repo/worktrees/add-auth-1918a5ee';
const REPO = '/home/testuser/repo';

describe('workPlanFileRepoRelativeTransformer', () => {
  describe('a relative path', () => {
    it('VALID: {filePath: bare repo-relative} => returns it unchanged', () => {
      const result = workPlanFileRepoRelativeTransformer({
        filePath: 'packages/web/src/a.tsx',
        roots: [WORKTREE, REPO],
      });

      expect(result).toBe('packages/web/src/a.tsx');
    });

    it('VALID: {filePath: ./-relative} => drops the leading ./', () => {
      const result = workPlanFileRepoRelativeTransformer({
        filePath: './packages/web/src/a.tsx',
        roots: [WORKTREE, REPO],
      });

      expect(result).toBe('packages/web/src/a.tsx');
    });
  });

  describe('an absolute path', () => {
    it('VALID: {filePath under the worktree} => strips the worktree, not the shorter repo root', () => {
      const result = workPlanFileRepoRelativeTransformer({
        filePath: `${WORKTREE}/packages/web/src/a.tsx`,
        roots: [REPO, WORKTREE],
      });

      expect(result).toBe('packages/web/src/a.tsx');
    });

    it('VALID: {filePath under the repo root} => strips the repo root', () => {
      const result = workPlanFileRepoRelativeTransformer({
        filePath: `${REPO}/packages/web/src/a.tsx`,
        roots: [WORKTREE, REPO],
      });

      expect(result).toBe('packages/web/src/a.tsx');
    });

    it('INVALID: {filePath under neither root} => returns undefined', () => {
      const result = workPlanFileRepoRelativeTransformer({
        filePath: '/elsewhere/packages/web/src/a.tsx',
        roots: [WORKTREE, REPO],
      });

      expect(result).toBe(undefined);
    });

    it('EDGE: {filePath beside the root, sharing its prefix} => returns undefined, since roots match whole segments', () => {
      const result = workPlanFileRepoRelativeTransformer({
        filePath: `${REPO}-other/packages/web/src/a.tsx`,
        roots: [WORKTREE, REPO],
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {roots: []} => returns undefined for an absolute path', () => {
      const result = workPlanFileRepoRelativeTransformer({
        filePath: `${REPO}/packages/web/src/a.tsx`,
        roots: [],
      });

      expect(result).toBe(undefined);
    });

    it('INVALID: {filePath: Windows drive path} => returns undefined', () => {
      const result = workPlanFileRepoRelativeTransformer({
        filePath: 'C:\\repo\\packages\\web\\a.tsx',
        roots: [WORKTREE, REPO],
      });

      expect(result).toBe(undefined);
    });
  });
});
