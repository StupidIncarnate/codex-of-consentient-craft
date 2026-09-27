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
  setupInstalledConsumerPackageDiscovery: (params: {
    dungeonmasterRoot: FilePath;
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
      // The broker checks `<dungeonmasterRoot>/packages` first — in every monorepo/worktree
      // scenario `packagesPath` IS that path, so it exists.
      fsExistsSyncProxy.returns({ filePath: packagesPath, result: true });
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
      fsExistsSyncProxy.returns({ filePath: packagesPath, result: true });
      fsReaddirProxy.returns({ dirPath: packagesPath, files: [] });
    },

    // A published install has no monorepo `packages/` folder: `dungeonmasterRoot` resolves to
    // `node_modules` (or an npm global root) itself, one level above `@dungeonmaster/<name>` —
    // no `packages` segment in between. This stages that non-existence and scans
    // `dungeonmasterRoot` directly, reusing the same leaf/group staging as the monorepo case.
    setupInstalledConsumerPackageDiscovery: ({ dungeonmasterRoot, packages }) => {
      const monorepoPackagesPath = `${String(dungeonmasterRoot)}/packages` as never;
      fsExistsSyncProxy.returns({ filePath: monorepoPackagesPath, result: false });
      fsReaddirProxy.returns({
        dirPath: dungeonmasterRoot,
        files: packages.map((pkg) => pkg.name),
      });

      const leafEntries: {
        name: FileName;
        standardPath: FilePath;
        alternatePath?: FilePath;
        installerLocation: 'standard' | 'alternate' | 'none';
      }[] = [];

      for (const pkg of packages) {
        if ('children' in pkg) {
          fsReaddirProxy.returns({
            dirPath: `${String(dungeonmasterRoot)}/${String(pkg.name)}`,
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
  };
};
