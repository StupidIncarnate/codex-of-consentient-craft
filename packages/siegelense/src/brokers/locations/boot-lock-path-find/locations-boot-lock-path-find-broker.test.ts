import { locationsBootLockPathFindBroker } from './locations-boot-lock-path-find-broker';
import { locationsBootLockPathFindBrokerProxy } from './locations-boot-lock-path-find-broker.proxy';
import { FilePathStub, AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('locationsBootLockPathFindBroker', () => {
  describe('boot lock path resolution', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/siegelense/boot.lock', () => {
      const proxy = locationsBootLockPathFindBrokerProxy();

      proxy.setupBootLockPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
        bootLockPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense/boot.lock' }),
      });

      const result = locationsBootLockPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/boot.lock' }),
      );
    });

    it('EDGE: {rootPath with trailing separator} => returns boot.lock joined without a double slash', () => {
      const proxy = locationsBootLockPathFindBrokerProxy();

      proxy.setupBootLockPath({
        homeDir: '/home/user/',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster/' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense/' }),
        bootLockPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense/boot.lock' }),
      });

      const result = locationsBootLockPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/boot.lock' }),
      );
    });

    it('EDGE: {homePath nested several levels deep} => returns boot.lock appended to the full nested path', () => {
      const proxy = locationsBootLockPathFindBrokerProxy();

      proxy.setupBootLockPath({
        homeDir: '/srv/agents/worker-3/state',
        homePath: FilePathStub({ value: '/srv/agents/worker-3/state/.dungeonmaster' }),
        rootPath: FilePathStub({
          value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense',
        }),
        bootLockPath: FilePathStub({
          value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense/boot.lock',
        }),
      });

      const result = locationsBootLockPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense/boot.lock',
        }),
      );
    });
  });
});
