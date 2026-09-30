import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

export const gatewayExistingPackagesListBrokerProxy = (): {
  setupPackages: (params: {
    packagesDir: string;
    packages: (
      | { name: string; hasPackageJson: boolean }
      | { name: string; children: { name: string; hasPackageJson: boolean }[] }
    )[];
  }) => void;
  setupNoPackagesDir: (params: { packagesDir: string }) => void;
} => {
  const fsReaddirProxy = readdirSyncProxy();
  const joinHandle = registerMock({ fn: join });
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const fsExistsSyncProxy = existsSyncProxy();

  return {
    setupPackages: ({ packagesDir, packages }): void => {
      fsExistsSyncProxy.returns({ path: packagesDir, exists: true });
      fsReaddirProxy.returns({ path: packagesDir, names: packages.map((pkg) => pkg.name) });

      for (const pkg of packages) {
        if ('children' in pkg) {
          fsReaddirProxy.returns({
            path: `${packagesDir}/${pkg.name}`,
            names: pkg.children.map((child) => child.name),
          });
        }
      }

      for (const pkg of packages) {
        if ('children' in pkg) {
          for (const child of pkg.children) {
            fsExistsSyncProxy.returns({
              path: `${packagesDir}/${pkg.name}/${child.name}/package.json`,
              exists: child.hasPackageJson,
            });
          }
          continue;
        }
        fsExistsSyncProxy.returns({
          path: `${packagesDir}/${pkg.name}/package.json`,
          exists: pkg.hasPackageJson,
        });
      }
    },

    setupNoPackagesDir: ({ packagesDir }): void => {
      fsExistsSyncProxy.returns({ path: packagesDir, exists: false });
    },
  };
};
