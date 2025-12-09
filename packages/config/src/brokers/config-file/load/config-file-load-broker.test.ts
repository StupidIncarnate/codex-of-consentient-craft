import { configFileLoadBroker } from './config-file-load-broker';
import { configFileLoadBrokerProxy } from './config-file-load-broker.proxy';
import { InvalidConfigError } from '../../../errors/invalid-config/invalid-config-error';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { DungeonmasterConfigStub } from '../../../contracts/dungeonmaster-config/dungeonmaster-config.stub';

describe('configFileLoadBroker', () => {
  describe('successful config loading', () => {
    it('VALID: {configPath: "/project/.dungeonmaster"} => loads JSON config', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.dungeonmaster' });
      const mockConfig = DungeonmasterConfigStub();

      proxy.setupValidConfig({ config: mockConfig });

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
    });

    it('VALID: {configPath: "/complex/.dungeonmaster"} => loads config with architecture overrides', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/complex/.dungeonmaster' });
      const mockConfig = DungeonmasterConfigStub({
        framework: 'react',
        routing: 'react-router-dom',
        schema: ['zod'],
        architecture: {
          overrides: {
            state: { add: ['zustand'] },
          },
        },
      });

      proxy.setupValidConfig({ config: mockConfig });

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
    });
  });

  describe('config validation errors', () => {
    it('INVALID_CONFIG: {configPath: "/project/.dungeonmaster"} => throws when config is null', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.dungeonmaster' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_CONFIG: {configPath: "/project/.dungeonmaster"} => throws when config is string', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.dungeonmaster' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_CONFIG: {configPath: "/project/.dungeonmaster"} => throws when config is number', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.dungeonmaster' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_FRAMEWORK: {configPath: "/project/.dungeonmaster"} => throws when framework is missing', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.dungeonmaster' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_FRAMEWORK: {configPath: "/project/.dungeonmaster"} => throws when framework is null', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.dungeonmaster' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });
  });

  describe('file system errors', () => {
    it('ERROR: {configPath: "/nonexistent/.dungeonmaster"} => throws wrapped error when file read fails', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/nonexistent/.dungeonmaster' });

      proxy.setupFileNotFound();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('ERROR: {configPath: "/corrupted/.dungeonmaster"} => throws wrapped error when JSON parse fails', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/corrupted/.dungeonmaster' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('ERROR: {configPath: "/project/.dungeonmaster"} => wraps validation errors in InvalidConfigError', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.dungeonmaster' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {configPath: "/project/.dungeonmaster"} => strips unknown properties during validation', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.dungeonmaster' });
      const expectedConfig = DungeonmasterConfigStub();

      proxy.setupValidConfig({ config: expectedConfig });

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(expectedConfig);
    });

    it('EDGE: {configPath: "/project/.dungeonmaster"} => handles minimal valid config', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.dungeonmaster' });
      const mockConfig = DungeonmasterConfigStub({ framework: 'node-library', schema: 'zod' });

      proxy.setupValidConfig({ config: mockConfig });

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
    });
  });
});
