import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
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
          hasFinalize?: boolean;
        }
      | {
          name: FileName;
          children: {
            name: FileName;
            standardPath: FilePath;
            alternatePath?: FilePath;
            installerLocation: 'standard' | 'alternate' | 'none';
            hasFinalize?: boolean;
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
          hasFinalize?: boolean;
        }
      | {
          name: FileName;
          children: {
            name: FileName;
            standardPath: FilePath;
            alternatePath?: FilePath;
            installerLocation: 'standard' | 'alternate' | 'none';
            hasFinalize?: boolean;
          }[];
        }
    )[];
  }) => void;
} => {
  const fsReaddirProxy = readdirSyncProxy();
  const joinHandle = registerMock({ fn: join });
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const fsExistsSyncProxy = existsSyncProxy();

  return {
    setupPackageDiscovery: ({ packagesPath, packages }) => {
      // The broker checks `<dungeonmasterRoot>/packages` first — in every monorepo/worktree
      // scenario `packagesPath` IS that path, so it exists.
      fsExistsSyncProxy.returns({ path: packagesPath, exists: true });
      fsReaddirProxy.returns({ path: packagesPath, names: packages.map((pkg) => pkg.name) });

      // A `@scope` entry in `packages` is a group folder, not a leaf package — the broker recurses
      // into it via a second `readdirSync` call, keyed here by the joined group path, and its
      // `children` are the leaf entries that actually get an existsSync check below.
      const leafEntries: {
        name: FileName;
        standardPath: FilePath;
        alternatePath?: FilePath;
        installerLocation: 'standard' | 'alternate' | 'none';
        hasFinalize?: boolean;
      }[] = [];

      for (const pkg of packages) {
        if ('children' in pkg) {
          fsReaddirProxy.returns({
            path: `${String(packagesPath)}/${String(pkg.name)}`,
            names: pkg.children.map((child) => child.name),
          });
          leafEntries.push(...pkg.children);
          continue;
        }

        leafEntries.push(pkg);
      }

      // A found installer gets its `start-install-finalize.js` sibling checked too; `hasFinalize`
      // answers that check, and an absent `hasFinalize` stages the sibling as missing.
      for (const entry of leafEntries) {
        if (entry.installerLocation === 'standard') {
          fsExistsSyncProxy.returns({ path: entry.standardPath, exists: true });
          fsExistsSyncProxy.returns({
            path: entry.standardPath.replace('/start-install.js', '/start-install-finalize.js'),
            exists: entry.hasFinalize ?? false,
          });
        } else {
          fsExistsSyncProxy.returns({ path: entry.standardPath, exists: false });

          const alternatePath =
            entry.alternatePath ??
            entry.standardPath.replace(
              '/dist/startup/start-install.js',
              '/dist/src/startup/start-install.js',
            );

          fsExistsSyncProxy.returns({
            path: alternatePath,
            exists: entry.installerLocation === 'alternate',
          });
          fsExistsSyncProxy.returns({
            path: alternatePath.replace('/start-install.js', '/start-install-finalize.js'),
            exists: entry.hasFinalize ?? false,
          });
        }
      }
    },

    setupEmptyPackagesDirectory: ({ packagesPath }) => {
      fsExistsSyncProxy.returns({ path: packagesPath, exists: true });
      fsReaddirProxy.returns({ path: packagesPath, names: [] });
    },

    // A published install has no monorepo `packages/` folder: `dungeonmasterRoot` resolves to
    // `node_modules` (or an npm global root) itself, one level above `@dungeonmaster/<name>` —
    // no `packages` segment in between. This stages that non-existence and scans
    // `dungeonmasterRoot` directly, reusing the same leaf/group staging as the monorepo case.
    setupInstalledConsumerPackageDiscovery: ({ dungeonmasterRoot, packages }) => {
      const monorepoPackagesPath = `${String(dungeonmasterRoot)}/packages`;
      fsExistsSyncProxy.returns({ path: monorepoPackagesPath, exists: false });
      fsReaddirProxy.returns({
        path: dungeonmasterRoot,
        names: packages.map((pkg) => pkg.name),
      });

      const leafEntries: {
        name: FileName;
        standardPath: FilePath;
        alternatePath?: FilePath;
        installerLocation: 'standard' | 'alternate' | 'none';
        hasFinalize?: boolean;
      }[] = [];

      for (const pkg of packages) {
        if ('children' in pkg) {
          fsReaddirProxy.returns({
            path: `${String(dungeonmasterRoot)}/${String(pkg.name)}`,
            names: pkg.children.map((child) => child.name),
          });
          leafEntries.push(...pkg.children);
          continue;
        }

        leafEntries.push(pkg);
      }

      // A found installer gets its `start-install-finalize.js` sibling checked too; `hasFinalize`
      // answers that check, and an absent `hasFinalize` stages the sibling as missing.
      for (const entry of leafEntries) {
        if (entry.installerLocation === 'standard') {
          fsExistsSyncProxy.returns({ path: entry.standardPath, exists: true });
          fsExistsSyncProxy.returns({
            path: entry.standardPath.replace('/start-install.js', '/start-install-finalize.js'),
            exists: entry.hasFinalize ?? false,
          });
        } else {
          fsExistsSyncProxy.returns({ path: entry.standardPath, exists: false });

          const alternatePath =
            entry.alternatePath ??
            entry.standardPath.replace(
              '/dist/startup/start-install.js',
              '/dist/src/startup/start-install.js',
            );

          fsExistsSyncProxy.returns({
            path: alternatePath,
            exists: entry.installerLocation === 'alternate',
          });
          fsExistsSyncProxy.returns({
            path: alternatePath.replace('/start-install.js', '/start-install-finalize.js'),
            exists: entry.hasFinalize ?? false,
          });
        }
      }
    },
  };
};
