import { pathJoinAdapterProxy, fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';

export const packageDiscoverBrokerProxy = (): {
  setupPackageDiscovery: (params: {
    packagesPath: FilePath;
    packages: (
      | {
          name: FileName;
          standardPath: FilePath;
          alternatePath?: FilePath;
          installerLocation: 'standard' | 'alternate' | 'none';
        }
      | {
          name: FileName;
          children: {
            name: FileName;
            standardPath: FilePath;
            alternatePath?: FilePath;
            installerLocation: 'standard' | 'alternate' | 'none';
          }[];
        }
    )[];
  }) => void;
  setupEmptyPackagesDirectory: (params: { packagesPath: FilePath }) => void;
} => {
  const fsReaddirProxy = fsReaddirAdapterProxy();
  // Unstaged: pathJoinAdapterProxy's default is a real path.join passthrough, and every
  // packagesPath/standardPath/alternatePath supplied below is already the real join of
  // dungeonmasterRoot + segments — there is nothing to fake, so fsExistsSync is the only mock
  // keyed here, addressed by those real paths.
  pathJoinAdapterProxy();
  const fsExistsSyncProxy = fsExistsSyncAdapterProxy();

  return {
    setupPackageDiscovery: ({ packagesPath, packages }) => {
      fsReaddirProxy.returns({ dirPath: packagesPath, files: packages.map((pkg) => pkg.name) });

      // A `@scope` entry in `packages` is a group folder, not a leaf package — the broker recurses
      // into it via a second `fsReaddirAdapter` call, keyed here by the joined group path, and its
      // `children` are the leaf entries that actually get an existsSync check below.
      const leafEntries: {
        name: FileName;
        standardPath: FilePath;
        alternatePath?: FilePath;
        installerLocation: 'standard' | 'alternate' | 'none';
      }[] = [];

      for (const pkg of packages) {
        if ('children' in pkg) {
          fsReaddirProxy.returns({
            dirPath: `${String(packagesPath)}/${String(pkg.name)}`,
            files: pkg.children.map((child) => child.name),
          });
          leafEntries.push(...pkg.children);
          continue;
        }

        leafEntries.push(pkg);
      }

      for (const entry of leafEntries) {
        if (entry.installerLocation === 'standard') {
          fsExistsSyncProxy.returns({ filePath: entry.standardPath, result: true });
        } else {
          fsExistsSyncProxy.returns({ filePath: entry.standardPath, result: false });

          if (entry.alternatePath) {
            fsExistsSyncProxy.returns({
              filePath: entry.alternatePath,
              result: entry.installerLocation === 'alternate',
            });
          }
        }
      }
    },

    setupEmptyPackagesDirectory: ({ packagesPath }) => {
      fsReaddirProxy.returns({ dirPath: packagesPath, files: [] });
    },
  };
};
