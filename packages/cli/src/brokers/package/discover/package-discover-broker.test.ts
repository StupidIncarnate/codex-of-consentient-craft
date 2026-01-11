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
      const { fsReaddirProxy, pathJoinProxy, fsExistsSyncProxy } = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/home/user/dungeonmaster' });

      // Setup packagesDir
      pathJoinProxy.returns({
        result: FilePathStub({ value: '/home/user/dungeonmaster/packages' }),
      });

      fsReaddirProxy.returns({
        files: [
          FileNameStub({ value: 'cli' }),
          FileNameStub({ value: 'shared' }),
          FileNameStub({ value: 'hooks' }),
        ],
      });

      // For cli: standardPath then alternatePath
      pathJoinProxy.returns({
        result: FilePathStub({
          value: '/home/user/dungeonmaster/packages/cli/dist/startup/start-install.js',
        }),
      });
      fsExistsSyncProxy.returns({ result: true }); // Found in standard path

      // For shared: standardPath (not found) then alternatePath (not found)
      pathJoinProxy.returns({
        result: FilePathStub({
          value: '/home/user/dungeonmaster/packages/shared/dist/startup/start-install.js',
        }),
      });
      fsExistsSyncProxy.returns({ result: false }); // Not in standard path
      pathJoinProxy.returns({
        result: FilePathStub({
          value: '/home/user/dungeonmaster/packages/shared/dist/src/startup/start-install.js',
        }),
      });
      fsExistsSyncProxy.returns({ result: false }); // Not in alternate path

      // For hooks: standardPath then alternatePath
      pathJoinProxy.returns({
        result: FilePathStub({
          value: '/home/user/dungeonmaster/packages/hooks/dist/startup/start-install.js',
        }),
      });
      fsExistsSyncProxy.returns({ result: true }); // Found in standard path

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
      const { fsReaddirProxy, pathJoinProxy, fsExistsSyncProxy } = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/dm' });

      pathJoinProxy.returns({
        result: FilePathStub({ value: '/dm/packages' }),
      });

      fsReaddirProxy.returns({
        files: [FileNameStub({ value: 'cli' }), FileNameStub({ value: 'shared' })],
      });

      // For cli: standardPath (not found) then alternatePath (not found)
      pathJoinProxy.returns({
        result: FilePathStub({ value: '/dm/packages/cli/dist/startup/start-install.js' }),
      });
      fsExistsSyncProxy.returns({ result: false });
      pathJoinProxy.returns({
        result: FilePathStub({ value: '/dm/packages/cli/dist/src/startup/start-install.js' }),
      });
      fsExistsSyncProxy.returns({ result: false });

      // For shared: standardPath (not found) then alternatePath (not found)
      pathJoinProxy.returns({
        result: FilePathStub({ value: '/dm/packages/shared/dist/startup/start-install.js' }),
      });
      fsExistsSyncProxy.returns({ result: false });
      pathJoinProxy.returns({
        result: FilePathStub({ value: '/dm/packages/shared/dist/src/startup/start-install.js' }),
      });
      fsExistsSyncProxy.returns({ result: false });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {dungeonmasterRoot: "/dm"} => returns empty array when packages directory is empty', () => {
      const { fsReaddirProxy, pathJoinProxy } = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/dm' });

      pathJoinProxy.returns({
        result: FilePathStub({ value: '/dm/packages' }),
      });

      fsReaddirProxy.returns({ files: [] });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {dungeonmasterRoot: "/path/with spaces"} => handles paths with spaces', () => {
      const { fsReaddirProxy, pathJoinProxy, fsExistsSyncProxy } = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/path/with spaces' });

      pathJoinProxy.returns({
        result: FilePathStub({ value: '/path/with spaces/packages' }),
      });

      fsReaddirProxy.returns({
        files: [FileNameStub({ value: 'cli' })],
      });

      // For cli: standardPath
      pathJoinProxy.returns({
        result: FilePathStub({
          value: '/path/with spaces/packages/cli/dist/startup/start-install.js',
        }),
      });
      fsExistsSyncProxy.returns({ result: true }); // Found in standard path

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toHaveLength(1);
      expect(result[0]?.packageName).toBe('@dungeonmaster/cli');
    });
  });
});
