import { locationsRegistryPathFindBroker } from './locations-registry-path-find-broker';
import { locationsRegistryPathFindBrokerProxy } from './locations-registry-path-find-broker.proxy';
import { FilePathStub, AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('locationsRegistryPathFindBroker', () => {
  describe('registry path resolution', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/siegelense/registry.json', () => {
      const proxy = locationsRegistryPathFindBrokerProxy();

      proxy.setupRegistryPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
        registryPath: FilePathStub({
          value: '/home/user/.dungeonmaster/siegelense/registry.json',
        }),
      });

      const result = locationsRegistryPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/registry.json' }),
      );
    });

    it('EDGE: {rootPath with trailing separator} => returns registry.json joined without a double slash', () => {
      const proxy = locationsRegistryPathFindBrokerProxy();

      proxy.setupRegistryPath({
        homeDir: '/home/user/',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster/' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense/' }),
        registryPath: FilePathStub({
          value: '/home/user/.dungeonmaster/siegelense/registry.json',
        }),
      });

      const result = locationsRegistryPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/registry.json' }),
      );
    });

    it('EDGE: {homePath nested several levels deep} => returns registry.json appended to the full nested path', () => {
      const proxy = locationsRegistryPathFindBrokerProxy();

      proxy.setupRegistryPath({
        homeDir: '/srv/agents/worker-3/state',
        homePath: FilePathStub({ value: '/srv/agents/worker-3/state/.dungeonmaster' }),
        rootPath: FilePathStub({
          value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense',
        }),
        registryPath: FilePathStub({
          value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense/registry.json',
        }),
      });

      const result = locationsRegistryPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense/registry.json',
        }),
      );
    });
  });
});
