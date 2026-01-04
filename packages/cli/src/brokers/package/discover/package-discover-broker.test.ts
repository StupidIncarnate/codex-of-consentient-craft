/**
 * PURPOSE: Tests for package discovery broker
 */

import { packageDiscoverBroker } from './package-discover-broker';
import { packageDiscoverBrokerProxy } from './package-discover-broker.proxy';
import { FilePathStub, PackageNameStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

describe('packageDiscoverBroker', () => {
  describe('discovering packages', () => {
    it('VALID: {dungeonmasterRoot: "/home/user/dungeonmaster"} => returns packages with start-install.ts files', () => {
      const { fsReaddirProxy, pathJoinProxy, fsExistsSyncProxy } = packageDiscoverBrokerProxy();
      const dungeonmasterRoot = FilePathStub({ value: '/home/user/dungeonmaster' });

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

      pathJoinProxy.returns({
        result: FilePathStub({
          value: '/home/user/dungeonmaster/packages/cli/src/startup/start-install.ts',
        }),
      });
      fsExistsSyncProxy.returns({ result: true });

      pathJoinProxy.returns({
        result: FilePathStub({
          value: '/home/user/dungeonmaster/packages/shared/src/startup/start-install.ts',
        }),
      });
      fsExistsSyncProxy.returns({ result: false });

      pathJoinProxy.returns({
        result: FilePathStub({
          value: '/home/user/dungeonmaster/packages/hooks/src/startup/start-install.ts',
        }),
      });
      fsExistsSyncProxy.returns({ result: true });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toStrictEqual([
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
          installPath: FilePathStub({
            value: '/home/user/dungeonmaster/packages/cli/src/startup/start-install.ts',
          }),
        },
        {
          packageName: PackageNameStub({ value: '@dungeonmaster/hooks' }),
          installPath: FilePathStub({
            value: '/home/user/dungeonmaster/packages/hooks/src/startup/start-install.ts',
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

      pathJoinProxy.returns({
        result: FilePathStub({ value: '/dm/packages/cli/src/startup/start-install.ts' }),
      });
      fsExistsSyncProxy.returns({ result: false });

      pathJoinProxy.returns({
        result: FilePathStub({ value: '/dm/packages/shared/src/startup/start-install.ts' }),
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

      pathJoinProxy.returns({
        result: FilePathStub({
          value: '/path/with spaces/packages/cli/src/startup/start-install.ts',
        }),
      });
      fsExistsSyncProxy.returns({ result: true });

      const result = packageDiscoverBroker({ dungeonmasterRoot });

      expect(result).toHaveLength(1);
      expect(result[0]?.packageName).toBe('@dungeonmaster/cli');
    });
  });
});
