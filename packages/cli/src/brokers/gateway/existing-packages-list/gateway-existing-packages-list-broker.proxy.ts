import { pathJoinAdapterProxy, fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
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
  const fsReaddirProxy = fsReaddirAdapterProxy();
  // Unstaged: pathJoinAdapterProxy's default is a real path.join passthrough, and every path this
  // proxy stages below is already the real join of packagesDir + segments — nothing to fake.
  pathJoinAdapterProxy();
  const fsExistsSyncProxy = fsExistsSyncAdapterProxy();

  return {
    setupPackages: ({ packagesDir, packages }): void => {
      fsExistsSyncProxy.returns({ filePath: packagesDir, result: true });
      fsReaddirProxy.returns({ dirPath: packagesDir, files: packages.map((pkg) => pkg.name) });

      for (const pkg of packages) {
        if ('children' in pkg) {
          fsReaddirProxy.returns({
            dirPath: `${String(packagesDir)}/${String(pkg.name)}`,
            files: pkg.children.map((child) => child.name),
          });
        }
      }

      for (const pkg of packages) {
        if ('children' in pkg) {
          for (const child of pkg.children) {
            fsExistsSyncProxy.returns({
              filePath: filePathContract.parse(
                `${String(packagesDir)}/${String(pkg.name)}/${String(child.name)}/package.json`,
              ),
              result: child.hasPackageJson,
            });
          }
          continue;
        }
        fsExistsSyncProxy.returns({
          filePath: filePathContract.parse(
            `${String(packagesDir)}/${String(pkg.name)}/package.json`,
          ),
          result: pkg.hasPackageJson,
        });
      }
    },

    setupNoPackagesDir: ({ packagesDir }): void => {
      fsExistsSyncProxy.returns({ filePath: packagesDir, result: false });
    },
  };
};
