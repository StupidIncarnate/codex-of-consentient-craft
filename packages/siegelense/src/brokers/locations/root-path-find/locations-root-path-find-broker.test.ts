import { locationsRootPathFindBroker } from './locations-root-path-find-broker';
import { locationsRootPathFindBrokerProxy } from './locations-root-path-find-broker.proxy';
import { FilePathStub, AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('locationsRootPathFindBroker', () => {
  describe('root path resolution', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/siegelense', () => {
      const proxy = locationsRootPathFindBrokerProxy();

      proxy.setupRootPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
      });

      const result = locationsRootPathFindBroker();

      expect(result).toBe(AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }));
    });

    it('EDGE: {homePath with trailing separator} => returns siegelense joined without a double slash', () => {
      const proxy = locationsRootPathFindBrokerProxy();

      proxy.setupRootPath({
        homeDir: '/home/user/',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster/' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
      });

      const result = locationsRootPathFindBroker();

      expect(result).toBe(AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }));
    });

    it('EDGE: {homePath nested several levels deep} => returns siegelense appended to the full nested path', () => {
      const proxy = locationsRootPathFindBrokerProxy();

      proxy.setupRootPath({
        homeDir: '/srv/agents/worker-3/state',
        homePath: FilePathStub({ value: '/srv/agents/worker-3/state/.dungeonmaster' }),
        rootPath: FilePathStub({
          value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense',
        }),
      });

      const result = locationsRootPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense' }),
      );
    });
  });
});
