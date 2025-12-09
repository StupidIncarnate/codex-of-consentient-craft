import { configFileFindBroker } from './config-file-find-broker';
import { configFileFindBrokerProxy } from './config-file-find-broker.proxy';
import { ConfigNotFoundError } from '../../../errors/config-not-found/config-not-found-error';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('configFileFindBroker', () => {
  describe('config file found cases', () => {
    it('VALID: {startPath: "/project/src/file.ts"} => finds config in same directory', async () => {
      const proxy = configFileFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupConfigFound({
        startPath: '/project/src/file.ts',
        configPath: '/project/src/.dungeonmaster',
      });

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/project/src/.dungeonmaster');
    });

    it('VALID: {startPath: "/project/sub/file.ts"} => finds config in parent directory', async () => {
      const proxy = configFileFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/sub/file.ts' });

      proxy.setupConfigFoundInParent({
        startPath: '/project/sub/file.ts',
        parentPath: '/project',
        configPath: '/project/.dungeonmaster',
      });

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/project/.dungeonmaster');
    });

    it('VALID: {startPath: "/deep/nested/project/src/file.ts"} => finds config walking up multiple levels', async () => {
      const proxy = configFileFindBrokerProxy();
      const startPath = FilePathStub({ value: '/deep/nested/project/src/file.ts' });

      proxy.setupConfigFoundInParent({
        startPath: '/deep/nested/project/src/file.ts',
        parentPath: '/deep',
        configPath: '/deep/.dungeonmaster',
      });

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/deep/.dungeonmaster');
    });

    it('VALID: {startPath: "/root-config/file.ts"} => finds config at filesystem root', async () => {
      const proxy = configFileFindBrokerProxy();
      const startPath = FilePathStub({ value: '/root-config/file.ts' });

      proxy.setupConfigFoundInParent({
        startPath: '/root-config/file.ts',
        parentPath: '/',
        configPath: '/.dungeonmaster',
      });

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/.dungeonmaster');
    });
  });

  describe('config file not found cases', () => {
    it('ERROR: {startPath: "/project/file.ts"} => throws ConfigNotFoundError when no config exists', async () => {
      const proxy = configFileFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/file.ts' });

      proxy.setupConfigNotFound({ startPath: '/project/file.ts' });

      await expect(configFileFindBroker({ startPath })).rejects.toThrow(ConfigNotFoundError);
    });

    it('ERROR: {startPath: "/deep/nested/file.ts"} => throws ConfigNotFoundError after walking entire tree', async () => {
      const proxy = configFileFindBrokerProxy();
      const startPath = FilePathStub({ value: '/deep/nested/file.ts' });

      proxy.setupConfigNotFound({ startPath: '/deep/nested/file.ts' });

      await expect(configFileFindBroker({ startPath })).rejects.toThrow(ConfigNotFoundError);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {startPath: "/file.ts"} => finds config at root or throws error', async () => {
      const proxy = configFileFindBrokerProxy();
      const startPath = FilePathStub({ value: '/file.ts' });

      proxy.setupConfigNotFound({ startPath: '/file.ts' });

      await expect(configFileFindBroker({ startPath })).rejects.toThrow(ConfigNotFoundError);
    });

    it('EDGE: {startPath: "/single/.hidden"} => handles hidden files as start path', async () => {
      const proxy = configFileFindBrokerProxy();
      const startPath = FilePathStub({ value: '/single/.hidden' });

      proxy.setupConfigFound({
        startPath: '/single/.hidden',
        configPath: '/single/.dungeonmaster',
      });

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/single/.dungeonmaster');
    });

    it('EDGE: {startPath: "/path with spaces/file.ts"} => handles paths with spaces', async () => {
      const proxy = configFileFindBrokerProxy();
      const startPath = FilePathStub({ value: '/path with spaces/file.ts' });

      proxy.setupConfigFound({
        startPath: '/path with spaces/file.ts',
        configPath: '/path with spaces/.dungeonmaster',
      });

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/path with spaces/.dungeonmaster');
    });
  });
});
