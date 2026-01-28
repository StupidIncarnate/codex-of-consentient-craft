/**
 * PURPOSE: Tests for package discovery broker
 */

import { packageDiscoverBroker } from './package-discover-broker';
import { packageDiscoverBrokerProxy } from './package-discover-broker.proxy';
import { FilePathStub, PackageNameStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

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
        },
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/hooks' }),
          installPath: FilePathStub({
            value: '/home/user/dungeonmaster/packages/hooks/dist/startup/start-install.js',
          }),
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

      expect(result).toHaveLength(1);
      expect(result[0]?.packageName).toBe('@dungeonmaster/cli');
    });
  });
});
