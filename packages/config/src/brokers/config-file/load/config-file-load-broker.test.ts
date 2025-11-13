import { configFileLoadBroker } from './config-file-load-broker';
import { configFileLoadBrokerProxy } from './config-file-load-broker.proxy';
import { InvalidConfigError } from '../../../errors/invalid-config/invalid-config-error';
import { FilePathStub } from '@questmaestro/shared/contracts';
import { QuestmaestroConfigStub } from '../../../contracts/questmaestro-config/questmaestro-config.stub';

describe('configFileLoadBroker', () => {
  describe('successful config loading', () => {
    it('VALID: {configPath: "/project/.questmaestro"} => loads JSON config', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.questmaestro' });
      const mockConfig = QuestmaestroConfigStub();

      proxy.setupValidConfig({ config: mockConfig });

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
    });

    it('VALID: {configPath: "/complex/.questmaestro"} => loads config with architecture overrides', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/complex/.questmaestro' });
      const mockConfig = QuestmaestroConfigStub({
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
    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is null', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.questmaestro' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is string', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.questmaestro' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is number', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.questmaestro' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_FRAMEWORK: {configPath: "/project/.questmaestro"} => throws when framework is missing', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.questmaestro' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_FRAMEWORK: {configPath: "/project/.questmaestro"} => throws when framework is null', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.questmaestro' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });
  });

  describe('file system errors', () => {
    it('ERROR: {configPath: "/nonexistent/.questmaestro"} => throws wrapped error when file read fails', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/nonexistent/.questmaestro' });

      proxy.setupFileNotFound();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('ERROR: {configPath: "/corrupted/.questmaestro"} => throws wrapped error when JSON parse fails', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/corrupted/.questmaestro' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('ERROR: {configPath: "/project/.questmaestro"} => wraps validation errors in InvalidConfigError', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.questmaestro' });

      proxy.setupInvalidJson();

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {configPath: "/project/.questmaestro"} => strips unknown properties during validation', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.questmaestro' });
      const expectedConfig = QuestmaestroConfigStub();

      proxy.setupValidConfig({ config: expectedConfig });

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(expectedConfig);
    });

    it('EDGE: {configPath: "/project/.questmaestro"} => handles minimal valid config', async () => {
      const proxy = configFileLoadBrokerProxy();
      const configPath = FilePathStub({ value: '/project/.questmaestro' });
      const mockConfig = QuestmaestroConfigStub({ framework: 'node-library', schema: 'zod' });

      proxy.setupValidConfig({ config: mockConfig });

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
    });
  });
});
