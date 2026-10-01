import { workspacePackageListBroker } from './workspace-package-list-broker';
import { workspacePackageListBrokerProxy } from './workspace-package-list-broker.proxy';

describe('workspacePackageListBroker', () => {
  describe('valid input', () => {
    it('VALID: {a plain package and a scoped package} => lists both with their names and folders', () => {
      const proxy = workspacePackageListBrokerProxy();
      proxy.setupSubfolders({ dirPath: '/repo/packages', folders: ['alpha', '@gateway'] });
      proxy.setupSubfolders({ dirPath: '/repo/packages/@gateway', folders: ['beta'] });
      proxy.setupPackageJson({
        packageDir: '/repo/packages/alpha',
        json: '{"name":"@repo/alpha"}',
      });
      proxy.setupPackageJson({
        packageDir: '/repo/packages/@gateway/beta',
        json: '{"name":"@repo/beta"}',
      });

      const result = workspacePackageListBroker({ rootDir: '/repo' });

      expect(result).toStrictEqual([
        { name: '@repo/alpha', dir: '/repo/packages/alpha' },
        { name: '@repo/beta', dir: '/repo/packages/@gateway/beta' },
      ]);
    });
  });

  describe('folders that are not packages', () => {
    it('EMPTY: {a folder whose package.json has no name} => leaves it out', () => {
      const proxy = workspacePackageListBrokerProxy();
      proxy.setupSubfolders({ dirPath: '/repo-unnamed/packages', folders: ['loose', 'alpha'] });
      proxy.setupPackageJson({ packageDir: '/repo-unnamed/packages/loose', json: '{}' });
      proxy.setupPackageJson({
        packageDir: '/repo-unnamed/packages/alpha',
        json: '{"name":"@repo/alpha"}',
      });

      const result = workspacePackageListBroker({ rootDir: '/repo-unnamed' });

      expect(result).toStrictEqual([{ name: '@repo/alpha', dir: '/repo-unnamed/packages/alpha' }]);
    });

    it('EMPTY: {no package folders} => returns an empty list', () => {
      const proxy = workspacePackageListBrokerProxy();
      proxy.setupSubfolders({ dirPath: '/repo-empty/packages', folders: [] });

      const result = workspacePackageListBroker({ rootDir: '/repo-empty' });

      expect(result).toStrictEqual([]);
    });
  });
});
