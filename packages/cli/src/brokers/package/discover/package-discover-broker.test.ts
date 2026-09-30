/**
 * PURPOSE: Tests for package discovery broker
 */

import { packageDiscoverBroker } from './package-discover-broker';
import { packageDiscoverBrokerProxy } from './package-discover-broker.proxy';
import { PackageNameStub } from '@dungeonmaster/shared/contracts/package-name/package-name.stub';

describe('packageDiscoverBroker', () => {
  describe('discovering packages', () => {
    it('VALID: {dungeonmasterRoot: "/home/user/dungeonmaster"} => returns packages with start-install.js files', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = '/home/user/dungeonmaster';

      proxy.setupPackageDiscovery({
        packagesPath: '/home/user/dungeonmaster/packages',
        packages: [
          {
            name: 'cli',
            standardPath: '/home/user/dungeonmaster/packages/cli/dist/startup/start-install.js',
            installerLocation: 'standard',
          },
          {
            name: 'shared',
            standardPath: '/home/user/dungeonmaster/packages/shared/dist/startup/start-install.js',
            alternatePath: '/home/user/dungeonmaster/packages/shared/dist/src/startup/start-install.js',
            installerLocation: 'none',
          },
          {
            name: 'hooks',
            standardPath: '/home/user/dungeonmaster/packages/hooks/dist/startup/start-install.js',
            installerLocation: 'standard',
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
          installPath: '/home/user/dungeonmaster/packages/cli/dist/startup/start-install.js',
          finalizeInstallPath: null,
        },
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/hooks' }),
          installPath: '/home/user/dungeonmaster/packages/hooks/dist/startup/start-install.js',
          finalizeInstallPath: null,
        },
      ]);
    });

    it('VALID: {dungeonmasterRoot: "/dm"} => returns empty array when no packages have install scripts', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = '/dm';

      proxy.setupPackageDiscovery({
        packagesPath: '/dm/packages',
        packages: [
          {
            name: 'cli',
            standardPath: '/dm/packages/cli/dist/startup/start-install.js',
            alternatePath: '/dm/packages/cli/dist/src/startup/start-install.js',
            installerLocation: 'none',
          },
          {
            name: 'shared',
            standardPath: '/dm/packages/shared/dist/startup/start-install.js',
            alternatePath: '/dm/packages/shared/dist/src/startup/start-install.js',
            installerLocation: 'none',
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {dungeonmasterRoot: "/dm"} => returns empty array when packages directory is empty', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = '/dm';

      proxy.setupEmptyPackagesDirectory({
        packagesPath: '/dm/packages',
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([]);
    });
  });

  describe('gateway-style @-scoped group folders', () => {
    it("VALID: {dungeonmasterRoot, packages: [cli, @gateway/{npm,node}]} => discovers the group's children by their real package.json name, and does not treat @gateway itself as a package", () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = '/home/user/dungeonmaster';

      proxy.setupPackageDiscovery({
        packagesPath: '/home/user/dungeonmaster/packages',
        packages: [
          {
            name: 'cli',
            standardPath: '/home/user/dungeonmaster/packages/cli/dist/startup/start-install.js',
            installerLocation: 'standard',
          },
          {
            name: '@gateway',
            children: [
              {
                name: 'npm',
                standardPath: '/home/user/dungeonmaster/packages/@gateway/npm/dist/startup/start-install.js',
                installerLocation: 'standard',
              },
              {
                name: 'node',
                standardPath: '/home/user/dungeonmaster/packages/@gateway/node/dist/startup/start-install.js',
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
          installPath: '/home/user/dungeonmaster/packages/cli/dist/startup/start-install.js',
          finalizeInstallPath: null,
        },
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/npm' }),
          installPath: '/home/user/dungeonmaster/packages/@gateway/npm/dist/startup/start-install.js',
          finalizeInstallPath: null,
        },
      ]);
    });
  });

  describe('installed consumer (no monorepo packages/ folder)', () => {
    it("VALID: {dungeonmasterRoot: '/consumer/node_modules', packages: [@dungeonmaster group]} => scans dungeonmasterRoot itself instead of joining 'packages'", () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = '/consumer/node_modules';

      proxy.setupInstalledConsumerPackageDiscovery({
        dungeonmasterRoot,
        packages: [
          {
            name: '@dungeonmaster',
            children: [
              {
                name: 'cli',
                standardPath: '/consumer/node_modules/@dungeonmaster/cli/dist/startup/start-install.js',
                installerLocation: 'standard',
              },
              {
                name: 'orchestrator',
                standardPath: '/consumer/node_modules/@dungeonmaster/orchestrator/dist/startup/start-install.js',
                installerLocation: 'standard',
              },
              {
                name: 'shared',
                standardPath: '/consumer/node_modules/@dungeonmaster/shared/dist/startup/start-install.js',
                installerLocation: 'none',
              },
            ],
          },
          {
            name: 'zod',
            standardPath: '/consumer/node_modules/zod/dist/startup/start-install.js',
            installerLocation: 'none',
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
          installPath: '/consumer/node_modules/@dungeonmaster/cli/dist/startup/start-install.js',
          finalizeInstallPath: null,
        },
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/orchestrator' }),
          installPath: '/consumer/node_modules/@dungeonmaster/orchestrator/dist/startup/start-install.js',
          finalizeInstallPath: null,
        },
      ]);
    });
  });

  describe('a package with a start-install-finalize.js sibling', () => {
    it('VALID: {siegelense holds both start-install.js and start-install-finalize.js} => finalizeInstallPath is populated', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = '/dm';

      proxy.setupPackageDiscovery({
        packagesPath: '/dm/packages',
        packages: [
          {
            name: 'siegelense',
            standardPath: '/dm/packages/siegelense/dist/startup/start-install.js',
            installerLocation: 'standard',
            hasFinalize: true,
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/siegelense' }),
          installPath: '/dm/packages/siegelense/dist/startup/start-install.js',
          finalizeInstallPath: '/dm/packages/siegelense/dist/startup/start-install-finalize.js',
        },
      ]);
    });

    it('VALID: {installer at the alternate dist/src/startup location, with a finalize sibling} => finalizeInstallPath sits beside the alternate installer', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = '/dm';

      proxy.setupPackageDiscovery({
        packagesPath: '/dm/packages',
        packages: [
          {
            name: 'siegelense',
            standardPath: '/dm/packages/siegelense/dist/startup/start-install.js',
            installerLocation: 'alternate',
            hasFinalize: true,
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/siegelense' }),
          installPath: '/dm/packages/siegelense/dist/src/startup/start-install.js',
          finalizeInstallPath: '/dm/packages/siegelense/dist/src/startup/start-install-finalize.js',
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {dungeonmasterRoot: "/path/with spaces"} => handles paths with spaces', () => {
      const proxy = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = '/path/with spaces';

      proxy.setupPackageDiscovery({
        packagesPath: '/path/with spaces/packages',
        packages: [
          {
            name: 'cli',
            standardPath: '/path/with spaces/packages/cli/dist/startup/start-install.js',
            installerLocation: 'standard',
          },
        ],
      });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
          installPath: '/path/with spaces/packages/cli/dist/startup/start-install.js',
          finalizeInstallPath: null,
        },
      ]);
    });
  });
});
