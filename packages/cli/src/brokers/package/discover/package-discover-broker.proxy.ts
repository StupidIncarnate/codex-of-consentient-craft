import { pathJoinAdapterProxy, fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';

export const packageDiscoverBrokerProxy = (): {
  setupPackageDiscovery: (params: {
    packagesPath: FilePath;
    packages: {
      name: FileName;
      standardPath: FilePath;
      alternatePath?: FilePath;
      installerLocation: 'standard' | 'alternate' | 'none';
    }[];
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

      for (const pkg of packages) {
        if (pkg.installerLocation === 'standard') {
          fsExistsSyncProxy.returns({ filePath: pkg.standardPath, result: true });
        } else {
          fsExistsSyncProxy.returns({ filePath: pkg.standardPath, result: false });

          if (pkg.alternatePath) {
            fsExistsSyncProxy.returns({
              filePath: pkg.alternatePath,
              result: pkg.installerLocation === 'alternate',
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
