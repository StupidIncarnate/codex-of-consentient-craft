import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { locationsRecipesPackagePathFindBroker } from './locations-recipes-package-path-find-broker';
import { locationsRecipesPackagePathFindBrokerProxy } from './locations-recipes-package-path-find-broker.proxy';

describe('locationsRecipesPackagePathFindBroker', () => {
  describe('the cwd is the repo root', () => {
    it('VALID: {cwd: /repo} => returns /repo/packages/hydration-recipes', async () => {
      const proxy = locationsRecipesPackagePathFindBrokerProxy();
      proxy.setupRepoRootAtCwd({
        cwdPath: '/repo',
        packagePath: FilePathStub({ value: '/repo/packages/hydration-recipes' }),
      });

      const result = await locationsRecipesPackagePathFindBroker();

      expect(result).toBe('/repo/packages/hydration-recipes');
    });
  });

  describe('the cwd sits deeper in the tree', () => {
    it('VALID: {cwd: /repo/packages/web/src} => resolves off the repo root, never the cwd', async () => {
      const proxy = locationsRecipesPackagePathFindBrokerProxy();
      proxy.setupRepoRootInParent({
        cwdPath: '/repo/packages/web/src',
        repoRoot: '/repo',
        packagePath: FilePathStub({ value: '/repo/packages/hydration-recipes' }),
      });

      const result = await locationsRecipesPackagePathFindBroker();

      expect(result).toBe('/repo/packages/hydration-recipes');
    });
  });

  describe('a consumer repo checked out elsewhere', () => {
    it('VALID: {repoRoot: /home/dev/their-app} => answers under THEIR root, so the recipes enumerated are theirs', async () => {
      const proxy = locationsRecipesPackagePathFindBrokerProxy();
      proxy.setupRepoRootInParent({
        cwdPath: '/home/dev/their-app/apps/api',
        repoRoot: '/home/dev/their-app',
        packagePath: FilePathStub({ value: '/home/dev/their-app/packages/hydration-recipes' }),
      });

      const result = await locationsRecipesPackagePathFindBroker();

      expect(result).toBe('/home/dev/their-app/packages/hydration-recipes');
    });
  });
});
