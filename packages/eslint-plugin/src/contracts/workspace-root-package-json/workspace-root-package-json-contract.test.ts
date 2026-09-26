import { workspaceRootPackageJsonContract } from './workspace-root-package-json-contract';
import { WorkspaceRootPackageJsonStub } from './workspace-root-package-json.stub';

describe('workspaceRootPackageJsonContract', () => {
  describe('valid workspace roots', () => {
    it('VALID: {name, workspaces: array} => parses successfully', () => {
      const packageJson = WorkspaceRootPackageJsonStub({
        name: 'dungeonmaster',
        workspaces: ['packages/*'],
      });

      const result = workspaceRootPackageJsonContract.parse(packageJson);

      expect(result).toStrictEqual({ name: 'dungeonmaster', workspaces: ['packages/*'] });
    });

    it('VALID: {name, workspaces: object} => parses successfully', () => {
      const packageJson = WorkspaceRootPackageJsonStub({
        name: 'acme-app',
        workspaces: { packages: ['packages/*'] },
      });

      const result = workspaceRootPackageJsonContract.parse(packageJson);

      expect(result).toStrictEqual({
        name: 'acme-app',
        workspaces: { packages: ['packages/*'] },
      });
    });

    it('VALID: {name, workspaces, extra fields} => keeps extra fields via passthrough', () => {
      const result = workspaceRootPackageJsonContract.parse({
        name: 'dungeonmaster',
        workspaces: ['packages/*'],
        version: '1.0.0',
      });

      expect(result).toStrictEqual({
        name: 'dungeonmaster',
        workspaces: ['packages/*'],
        version: '1.0.0',
      });
    });
  });

  describe('invalid - not a workspace root', () => {
    it('INVALID: {name only, no workspaces} => safeParse fails', () => {
      const result = workspaceRootPackageJsonContract.safeParse({
        name: '@dungeonmaster/eslint-plugin',
      });

      expect(result.success).toBe(false);
    });

    it('INVALID: {workspaces only, no name} => safeParse fails', () => {
      const result = workspaceRootPackageJsonContract.safeParse({ workspaces: ['packages/*'] });

      expect(result.success).toBe(false);
    });

    it('INVALID: {name: 123} => safeParse fails', () => {
      const result = workspaceRootPackageJsonContract.safeParse({
        name: 123,
        workspaces: ['packages/*'],
      });

      expect(result.success).toBe(false);
    });
  });
});
