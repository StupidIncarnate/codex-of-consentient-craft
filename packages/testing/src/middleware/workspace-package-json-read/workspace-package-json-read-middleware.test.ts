import { workspacePackageJsonReadMiddleware } from './workspace-package-json-read-middleware';
import { workspacePackageJsonReadMiddlewareProxy } from './workspace-package-json-read-middleware.proxy';

describe('workspacePackageJsonReadMiddleware', () => {
  describe('existing, valid package.json', () => {
    it('VALID: {sibling package.json with name + exports} => returns parsed WorkspacePackageJson', () => {
      const proxy = workspacePackageJsonReadMiddlewareProxy();
      proxy.setupPackageJsonAt({
        packageJsonPath: '/repo/packages/bin/package.json',
        packageJson: {
          name: '@dungeonmaster/bin',
          exports: { './testing': { source: './testing.ts' } },
        },
      });
      const packageJsonPath = '/repo/packages/bin/package.json';

      const result = workspacePackageJsonReadMiddleware({ packageJsonPath });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/bin',
        exports: { './testing': { source: './testing.ts' } },
      });
    });

    it('VALID: {root package.json with workspaces} => returns parsed WorkspacePackageJson', () => {
      const proxy = workspacePackageJsonReadMiddlewareProxy();
      proxy.setupPackageJsonAt({
        packageJsonPath: '/repo/package.json',
        packageJson: { name: 'dungeonmaster', workspaces: ['packages/*'] },
      });
      const packageJsonPath = '/repo/package.json';

      const result = workspacePackageJsonReadMiddleware({ packageJsonPath });

      expect(result).toStrictEqual({ name: 'dungeonmaster', workspaces: ['packages/*'] });
    });
  });

  describe('missing file', () => {
    it('EMPTY: {packageJsonPath does not exist} => returns null', () => {
      const proxy = workspacePackageJsonReadMiddlewareProxy();
      proxy.setupMissingAt({ packageJsonPath: '/repo/packages/ghost/package.json' });
      const packageJsonPath = '/repo/packages/ghost/package.json';

      const result = workspacePackageJsonReadMiddleware({ packageJsonPath });

      expect(result).toBe(null);
    });
  });

  describe('unparseable content', () => {
    it('INVALID: {name is a number, not a string} => returns null', () => {
      const proxy = workspacePackageJsonReadMiddlewareProxy();
      proxy.setupPackageJsonAt({
        packageJsonPath: '/repo/packages/bin/package.json',
        packageJson: { name: 123 },
      });
      const packageJsonPath = '/repo/packages/bin/package.json';

      const result = workspacePackageJsonReadMiddleware({ packageJsonPath });

      expect(result).toBe(null);
    });
  });
});
