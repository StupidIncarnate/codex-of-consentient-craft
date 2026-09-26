import { workspaceGlobBaseDirsTransformer } from './workspace-glob-base-dirs-transformer';
import { WorkspacePackageJsonStub } from '../../contracts/workspace-package-json/workspace-package-json.stub';

describe('workspaceGlobBaseDirsTransformer', () => {
  describe('array of globs', () => {
    it('VALID: {workspaces: ["packages/*"]} => returns ["packages"]', () => {
      const { workspaces } = WorkspacePackageJsonStub({ workspaces: ['packages/*'] });

      const result = workspaceGlobBaseDirsTransformer({ workspaces });

      expect(result).toStrictEqual(['packages']);
    });

    it('VALID: {workspaces: ["packages/*", "packages/@gateway/*"]} => returns both base dirs', () => {
      const { workspaces } = WorkspacePackageJsonStub({
        workspaces: ['packages/*', 'packages/@gateway/*'],
      });

      const result = workspaceGlobBaseDirsTransformer({ workspaces });

      expect(result).toStrictEqual(['packages', 'packages/@gateway']);
    });

    it('VALID: {workspaces: ["apps/foo"]} => no glob ends in "/*", falls back to ["packages"]', () => {
      const { workspaces } = WorkspacePackageJsonStub({ workspaces: ['apps/foo'] });

      const result = workspaceGlobBaseDirsTransformer({ workspaces });

      expect(result).toStrictEqual(['packages']);
    });
  });

  describe('non-array workspaces', () => {
    it('VALID: {workspaces: {packages: ["packages/*"]}} => falls back to ["packages"]', () => {
      const { workspaces } = WorkspacePackageJsonStub({
        workspaces: { packages: ['packages/*'] },
      });

      const result = workspaceGlobBaseDirsTransformer({ workspaces });

      expect(result).toStrictEqual(['packages']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {workspaces: undefined} => falls back to ["packages"]', () => {
      const result = workspaceGlobBaseDirsTransformer({ workspaces: undefined });

      expect(result).toStrictEqual(['packages']);
    });
  });
});
