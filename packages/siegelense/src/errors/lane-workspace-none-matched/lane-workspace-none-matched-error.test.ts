import { LaneWorkspaceNoneMatchedError } from './lane-workspace-none-matched-error';

describe('LaneWorkspaceNoneMatchedError', () => {
  describe('the zero-match refusal', () => {
    it('ERROR: {repoRoot, packageType} => carries the class name and a message naming both', () => {
      const error = new LaneWorkspaceNoneMatchedError({
        repoRoot: '/repo',
        packageType: 'http-backend',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'LaneWorkspaceNoneMatchedError',
        message:
          'No package under "/repo/packages" detected as packageType "http-backend". A lane spec\'s ' +
          '"--workspace=<name>" needs exactly one such package to resolve the token against — add one, ' +
          'or point the spec at a repo that has one.',
      });
    });

    it('ERROR: {repoRoot, packageType} => stores both fields verbatim', () => {
      const error = new LaneWorkspaceNoneMatchedError({
        repoRoot: '/repo',
        packageType: 'frontend-react',
      });

      expect({ repoRoot: error.repoRoot, packageType: error.packageType }).toStrictEqual({
        repoRoot: '/repo',
        packageType: 'frontend-react',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof LaneWorkspaceNoneMatchedError => returns true', () => {
      const error = new LaneWorkspaceNoneMatchedError({
        repoRoot: '/repo',
        packageType: 'http-backend',
      });

      expect(error instanceof LaneWorkspaceNoneMatchedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new LaneWorkspaceNoneMatchedError({
        repoRoot: '/repo',
        packageType: 'http-backend',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
