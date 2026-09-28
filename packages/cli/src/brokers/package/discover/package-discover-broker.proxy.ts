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
      // The sibling start-install-finalize.js path for this package's own installerLocation.
      // Left unset when the package has no finalize step — fsExistsSyncAdapterProxy's own
      // default (false for any unaddressed path) is what makes finalizeInstallPath read null.
      finalizeInstallPath?: FilePath;
    }[];
  }) => void;
  setupEmptyPackagesDirectory: (params: { packagesPath: FilePath }) => void;
} => {
  const fsReaddirProxy = fsReaddirAdapterProxy();
  // Unstaged: pathJoinAdapterProxy's default is a real path.join passthrough, and every
  // packagesPath/standardPath/alternatePath/finalizeInstallPath supplied below is already the
  // real join of dungeonmasterRoot + segments — there is nothing to fake, so fsExistsSync is the
  // only mock keyed here, addressed by those real paths.
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

        if (pkg.finalizeInstallPath) {
          fsExistsSyncProxy.returns({ filePath: pkg.finalizeInstallPath, result: true });
        }
      }
    },

    setupEmptyPackagesDirectory: ({ packagesPath }) => {
      fsReaddirProxy.returns({ dirPath: packagesPath, files: [] });
    },
  };
};
