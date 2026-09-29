/**
 * PURPOSE: Tests for package discovery broker
 */

import { packageDiscoverBroker } from './package-discover-broker';
import { packageDiscoverBrokerProxy } from './package-discover-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { PackageNameStub } from '@dungeonmaster/shared/contracts/package-name/package-name.stub';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';

describe('packageDiscoverBroker', () => {
  describe('discovering packages', () => {
    it('VALID: {dungeonmasterRoot: "/home/user/dungeonmaster"} => returns packages with start-install.js files', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/home/user/dungeonmaster' });

      proxy.setupPackageDiscovery({
        packagesPath: FilePathStub({ value: '/home/user/dungeonmaster/packages' }),
        packages: [
          {
            name: FileNameStub({ value: 'cli' }),
            standardPath: FilePathStub({
              value: '/home/user/dungeonmaster/packages/cli/dist/startup/start-install.js',
            }),
            installerLocation: 'standard',
          },
          {
            name: FileNameStub({ value: 'shared' }),
            standardPath: FilePathStub({
              value: '/home/user/dungeonmaster/packages/shared/dist/startup/start-install.js',
            }),
            alternatePath: FilePathStub({
              value: '/home/user/dungeonmaster/packages/shared/dist/src/startup/start-install.js',
            }),
            installerLocation: 'none',
          },
          {
            name: FileNameStub({ value: 'hooks' }),
            standardPath: FilePathStub({
              value: '/home/user/dungeonmaster/packages/hooks/dist/startup/start-install.js',
            }),
            installerLocation: 'standard',
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
          installPath: FilePathStub({
            value: '/home/user/dungeonmaster/packages/cli/dist/startup/start-install.js',
          }),
          finalizeInstallPath: null,
        },
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/hooks' }),
          installPath: FilePathStub({
            value: '/home/user/dungeonmaster/packages/hooks/dist/startup/start-install.js',
          }),
          finalizeInstallPath: null,
        },
      ]);
    });

    it('VALID: {dungeonmasterRoot: "/dm"} => returns empty array when no packages have install scripts', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/dm' });

      proxy.setupPackageDiscovery({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
        packages: [
          {
            name: FileNameStub({ value: 'cli' }),
            standardPath: FilePathStub({ value: '/dm/packages/cli/dist/startup/start-install.js' }),
            alternatePath: FilePathStub({
              value: '/dm/packages/cli/dist/src/startup/start-install.js',
            }),
            installerLocation: 'none',
          },
          {
            name: FileNameStub({ value: 'shared' }),
            standardPath: FilePathStub({
              value: '/dm/packages/shared/dist/startup/start-install.js',
            }),
            alternatePath: FilePathStub({
              value: '/dm/packages/shared/dist/src/startup/start-install.js',
            }),
            installerLocation: 'none',
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {dungeonmasterRoot: "/dm"} => returns empty array when packages directory is empty', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/dm' });

      proxy.setupEmptyPackagesDirectory({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([]);
    });
  });

  describe('gateway-style @-scoped group folders', () => {
    it("VALID: {dungeonmasterRoot, packages: [cli, @gateway/{npm,node}]} => discovers the group's children by their real package.json name, and does not treat @gateway itself as a package", () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/home/user/dungeonmaster' });

      proxy.setupPackageDiscovery({
        packagesPath: FilePathStub({ value: '/home/user/dungeonmaster/packages' }),
        packages: [
          {
            name: FileNameStub({ value: 'cli' }),
            standardPath: FilePathStub({
              value: '/home/user/dungeonmaster/packages/cli/dist/startup/start-install.js',
            }),
            installerLocation: 'standard',
          },
          {
            name: FileNameStub({ value: '@gateway' }),
            children: [
              {
                name: FileNameStub({ value: 'npm' }),
                standardPath: FilePathStub({
                  value:
                    '/home/user/dungeonmaster/packages/@gateway/npm/dist/startup/start-install.js',
                }),
                installerLocation: 'standard',
              },
              {
                name: FileNameStub({ value: 'node' }),
                standardPath: FilePathStub({
                  value:
                    '/home/user/dungeonmaster/packages/@gateway/node/dist/startup/start-install.js',
                }),
                installerLocation: 'none',
              },
            ],
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
          installPath: FilePathStub({
            value: '/home/user/dungeonmaster/packages/cli/dist/startup/start-install.js',
          }),
          finalizeInstallPath: null,
        },
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/npm' }),
          installPath: FilePathStub({
            value: '/home/user/dungeonmaster/packages/@gateway/npm/dist/startup/start-install.js',
          }),
          finalizeInstallPath: null,
        },
      ]);
    });
  });

  describe('installed consumer (no monorepo packages/ folder)', () => {
    it("VALID: {dungeonmasterRoot: '/consumer/node_modules', packages: [@dungeonmaster group]} => scans dungeonmasterRoot itself instead of joining 'packages'", () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/consumer/node_modules' });

      proxy.setupInstalledConsumerPackageDiscovery({
        dungeonmasterRoot,
        packages: [
          {
            name: FileNameStub({ value: '@dungeonmaster' }),
            children: [
              {
                name: FileNameStub({ value: 'cli' }),
                standardPath: FilePathStub({
                  value: '/consumer/node_modules/@dungeonmaster/cli/dist/startup/start-install.js',
                }),
                installerLocation: 'standard',
              },
              {
                name: FileNameStub({ value: 'orchestrator' }),
                standardPath: FilePathStub({
                  value:
                    '/consumer/node_modules/@dungeonmaster/orchestrator/dist/startup/start-install.js',
                }),
                installerLocation: 'standard',
              },
              {
                name: FileNameStub({ value: 'shared' }),
                standardPath: FilePathStub({
                  value:
                    '/consumer/node_modules/@dungeonmaster/shared/dist/startup/start-install.js',
                }),
                installerLocation: 'none',
              },
            ],
          },
          {
            name: FileNameStub({ value: 'zod' }),
            standardPath: FilePathStub({
              value: '/consumer/node_modules/zod/dist/startup/start-install.js',
            }),
            installerLocation: 'none',
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
          installPath: FilePathStub({
            value: '/consumer/node_modules/@dungeonmaster/cli/dist/startup/start-install.js',
          }),
          finalizeInstallPath: null,
        },
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/orchestrator' }),
          installPath: FilePathStub({
            value:
              '/consumer/node_modules/@dungeonmaster/orchestrator/dist/startup/start-install.js',
          }),
          finalizeInstallPath: null,
        },
      ]);
    });
  });

  describe('a package with a start-install-finalize.js sibling', () => {
    it('VALID: {siegelense holds both start-install.js and start-install-finalize.js} => finalizeInstallPath is populated', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/dm' });

      proxy.setupPackageDiscovery({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
        packages: [
          {
            name: FileNameStub({ value: 'siegelense' }),
            standardPath: FilePathStub({
              value: '/dm/packages/siegelense/dist/startup/start-install.js',
            }),
            installerLocation: 'standard',
            hasFinalize: true,
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/siegelense' }),
          installPath: FilePathStub({
            value: '/dm/packages/siegelense/dist/startup/start-install.js',
          }),
          finalizeInstallPath: FilePathStub({
            value: '/dm/packages/siegelense/dist/startup/start-install-finalize.js',
          }),
        },
      ]);
    });

    it('VALID: {installer at the alternate dist/src/startup location, with a finalize sibling} => finalizeInstallPath sits beside the alternate installer', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/dm' });

      proxy.setupPackageDiscovery({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
        packages: [
          {
            name: FileNameStub({ value: 'siegelense' }),
            standardPath: FilePathStub({
              value: '/dm/packages/siegelense/dist/startup/start-install.js',
            }),
            installerLocation: 'alternate',
            hasFinalize: true,
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/siegelense' }),
          installPath: FilePathStub({
            value: '/dm/packages/siegelense/dist/src/startup/start-install.js',
          }),
          finalizeInstallPath: FilePathStub({
            value: '/dm/packages/siegelense/dist/src/startup/start-install-finalize.js',
          }),
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {dungeonmasterRoot: "/path/with spaces"} => handles paths with spaces', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/path/with spaces' });

      proxy.setupPackageDiscovery({
        packagesPath: FilePathStub({ value: '/path/with spaces/packages' }),
        packages: [
          {
            name: FileNameStub({ value: 'cli' }),
            standardPath: FilePathStub({
              value: '/path/with spaces/packages/cli/dist/startup/start-install.js',
            }),
            installerLocation: 'standard',
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
          installPath: FilePathStub({
            value: '/path/with spaces/packages/cli/dist/startup/start-install.js',
          }),
          finalizeInstallPath: null,
        },
      ]);
    });
  });
});
