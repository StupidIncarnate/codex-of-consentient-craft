import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
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
  const pathJoinProxy = pathJoinAdapterProxy();
  const fsExistsSyncProxy = fsExistsSyncAdapterProxy();

  return {
    setupPackageDiscovery: ({ packagesPath, packages }) => {
      // First pathJoin returns the packages directory
      pathJoinProxy.returns({ result: packagesPath });

      // fsReaddir returns the list of package directory names
      fsReaddirProxy.returns({ files: packages.map((pkg) => pkg.name) });

      // For each package, set up the path checks
      for (const pkg of packages) {
        // Standard path check
        pathJoinProxy.returns({ result: pkg.standardPath });

        if (pkg.installerLocation === 'standard') {
          // Found at standard path - no alternate check needed
          fsExistsSyncProxy.returns({ result: true });
        } else {
          // Not found at standard path
          fsExistsSyncProxy.returns({ result: false });

          // Alternate path check - caller must provide alternatePath if not 'standard'
          if (pkg.alternatePath) {
            pathJoinProxy.returns({ result: pkg.alternatePath });
          }

          if (pkg.installerLocation === 'alternate') {
            fsExistsSyncProxy.returns({ result: true });
          } else {
            // Not found at either path
            fsExistsSyncProxy.returns({ result: false });
          }
        }
      }
    },

    setupEmptyPackagesDirectory: ({ packagesPath }) => {
      pathJoinProxy.returns({ result: packagesPath });
      fsReaddirProxy.returns({ files: [] });
    },
  };
};
