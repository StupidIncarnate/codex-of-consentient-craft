import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';

export const gatewayExistingPackagesListBrokerProxy = (): {
  setupPackages: (params: {
    packagesDir: FilePath;
    packages: (
      | { name: FileName; hasPackageJson: boolean }
      | { name: FileName; children: { name: FileName; hasPackageJson: boolean }[] }
    )[];
  }) => void;
  setupNoPackagesDir: (params: { packagesDir: FilePath }) => void;
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
            path: `${String(packagesDir)}/${String(pkg.name)}`,
            names: pkg.children.map((child) => child.name),
          });
        }
      }

      for (const pkg of packages) {
        if ('children' in pkg) {
          for (const child of pkg.children) {
            fsExistsSyncProxy.returns({
              path: filePathContract.parse(
                `${String(packagesDir)}/${String(pkg.name)}/${String(child.name)}/package.json`,
              ),
              exists: child.hasPackageJson,
            });
          }
          continue;
        }
        fsExistsSyncProxy.returns({
          path: filePathContract.parse(`${String(packagesDir)}/${String(pkg.name)}/package.json`),
          exists: pkg.hasPackageJson,
        });
      }
    },

    setupNoPackagesDir: ({ packagesDir }): void => {
      fsExistsSyncProxy.returns({ path: packagesDir, exists: false });
    },
  };
};
