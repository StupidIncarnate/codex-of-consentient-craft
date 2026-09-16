import { locationsRegistryLockPathFindBroker } from './locations-registry-lock-path-find-broker';
import { locationsRegistryLockPathFindBrokerProxy } from './locations-registry-lock-path-find-broker.proxy';
import { FilePathStub, AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('locationsRegistryLockPathFindBroker', () => {
  describe('registry lock path resolution', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/siegelense/registry.lock', () => {
      const proxy = locationsRegistryLockPathFindBrokerProxy();

      proxy.setupRegistryLockPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
        registryLockPath: FilePathStub({
          value: '/home/user/.dungeonmaster/siegelense/registry.lock',
        }),
      });

      const result = locationsRegistryLockPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/registry.lock' }),
      );
    });

    it('EDGE: {rootPath with trailing separator} => returns registry.lock joined without a double slash', () => {
      const proxy = locationsRegistryLockPathFindBrokerProxy();

      proxy.setupRegistryLockPath({
        homeDir: '/home/user/',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster/' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense/' }),
        registryLockPath: FilePathStub({
          value: '/home/user/.dungeonmaster/siegelense/registry.lock',
        }),
      });

      const result = locationsRegistryLockPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/registry.lock' }),
      );
    });

    it('EDGE: {homePath nested several levels deep} => returns registry.lock appended to the full nested path', () => {
      const proxy = locationsRegistryLockPathFindBrokerProxy();

      proxy.setupRegistryLockPath({
        homeDir: '/srv/agents/worker-3/state',
        homePath: FilePathStub({ value: '/srv/agents/worker-3/state/.dungeonmaster' }),
        rootPath: FilePathStub({
          value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense',
        }),
        registryLockPath: FilePathStub({
          value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense/registry.lock',
        }),
      });

      const result = locationsRegistryLockPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense/registry.lock',
        }),
      );
    });
  });
});
