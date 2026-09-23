import { LaneWorkspaceSeveralMatchedError } from './lane-workspace-several-matched-error';

describe('LaneWorkspaceSeveralMatchedError', () => {
  describe('the several-matches refusal', () => {
    it('ERROR: {repoRoot, packageType, two matches} => carries the class name and a message naming every match', () => {
      const error = new LaneWorkspaceSeveralMatchedError({
        repoRoot: '/repo',
        packageType: 'http-backend',
        matches: ['@scope/api', '@scope/gateway'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'LaneWorkspaceSeveralMatchedError',
        message:
          '2 packages under "/repo/packages" detected as packageType "http-backend": ' +
          '@scope/api, @scope/gateway. A lane spec\'s "--workspace=<name>" needs exactly one — narrow ' +
          'the repo, or give the spec its own explicit workspace name instead of this token.',
      });
    });

    it('ERROR: {repoRoot, packageType, matches} => stores all three fields verbatim', () => {
      const error = new LaneWorkspaceSeveralMatchedError({
        repoRoot: '/repo',
        packageType: 'frontend-react',
        matches: ['@scope/web', '@scope/admin'],
      });

      expect({
        repoRoot: error.repoRoot,
        packageType: error.packageType,
        matches: error.matches,
      }).toStrictEqual({
        repoRoot: '/repo',
        packageType: 'frontend-react',
        matches: ['@scope/web', '@scope/admin'],
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof LaneWorkspaceSeveralMatchedError => returns true', () => {
      const error = new LaneWorkspaceSeveralMatchedError({
        repoRoot: '/repo',
        packageType: 'http-backend',
        matches: ['@scope/api', '@scope/gateway'],
      });

      expect(error instanceof LaneWorkspaceSeveralMatchedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new LaneWorkspaceSeveralMatchedError({
        repoRoot: '/repo',
        packageType: 'http-backend',
        matches: ['@scope/api', '@scope/gateway'],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
