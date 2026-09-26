import { isGatewayPackageProjectFolderGuard } from './is-gateway-package-project-folder-guard';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';

describe('isGatewayPackageProjectFolderGuard', () => {
  describe('valid inputs', () => {
    it('VALID: {projectFolder path under packages/@gateway/node} => returns true', () => {
      const result = isGatewayPackageProjectFolderGuard({
        projectFolder: ProjectFolderStub({
          name: '@dungeonmaster/node',
          path: '/repo/packages/@gateway/node',
        }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {projectFolder path under packages/@gateway/browser} => returns true', () => {
      const result = isGatewayPackageProjectFolderGuard({
        projectFolder: ProjectFolderStub({
          name: '@dungeonmaster/browser',
          path: '/repo/packages/@gateway/browser',
        }),
      });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {projectFolder path outside the gateway group directory} => returns false', () => {
      const result = isGatewayPackageProjectFolderGuard({
        projectFolder: ProjectFolderStub({
          name: '@dungeonmaster/shared2',
          path: '/repo/packages/shared2',
        }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {projectFolder path names the pre-@gateway flat layout} => returns false', () => {
      const result = isGatewayPackageProjectFolderGuard({
        projectFolder: ProjectFolderStub({
          name: '@dungeonmaster/node',
          path: '/repo/packages/node',
        }),
      });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {projectFolder: undefined} => returns false', () => {
      const result = isGatewayPackageProjectFolderGuard({});

      expect(result).toBe(false);
    });
  });
});
