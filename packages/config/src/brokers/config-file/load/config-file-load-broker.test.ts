import { configFileLoadBroker } from './config-file-load-broker';
import { InvalidConfigError } from '../../../errors/invalid-config/invalid-config-error';
import { fsReadFile } from '../../../adapters/fs/fs-read-file';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { filePathContract } from '@questmaestro/shared/contracts';

// Mock adapters (the boundary)
jest.mock('../../../adapters/fs/fs-read-file');

const mockFsReadFile = jest.mocked(fsReadFile);

describe('configFileLoadBroker', () => {
  describe('successful config loading', () => {
    it('VALID: {configPath: "/project/.questmaestro"} => loads JSON config', async () => {
      const configPath = filePathContract.parse('/project/.questmaestro');
      const mockConfig = {
        framework: 'react',
        schema: 'zod',
      };

      mockFsReadFile.mockResolvedValue(FileContentsStub(JSON.stringify(mockConfig)));

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
      expect(mockFsReadFile).toHaveBeenCalledTimes(1);
      expect(mockFsReadFile).toHaveBeenCalledWith({ filePath: configPath });
    });

    it('VALID: {configPath: "/complex/.questmaestro"} => loads config with architecture overrides', async () => {
      const configPath = filePathContract.parse('/complex/.questmaestro');
      const mockConfig = {
        framework: 'react',
        routing: 'react-router-dom',
        schema: ['zod'],
        architecture: {
          overrides: {
            state: { add: ['zustand'] },
          },
        },
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub(JSON.stringify(mockConfig)));

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
    });
  });

  describe('config validation errors', () => {
    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is null', async () => {
      const configPath = filePathContract.parse('/project/.questmaestro');

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('null'));

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is string', async () => {
      const configPath = filePathContract.parse('/project/.questmaestro');

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('"invalid"'));

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is number', async () => {
      const configPath = filePathContract.parse('/project/.questmaestro');

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('123'));

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_FRAMEWORK: {configPath: "/project/.questmaestro"} => throws when framework is missing', async () => {
      const configPath = filePathContract.parse('/project/.questmaestro');
      const mockConfig = {
        schema: 'zod',
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub(JSON.stringify(mockConfig)));

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_FRAMEWORK: {configPath: "/project/.questmaestro"} => throws when framework is null', async () => {
      const configPath = filePathContract.parse('/project/.questmaestro');
      const mockConfig = {
        framework: null,
        schema: 'zod',
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub(JSON.stringify(mockConfig)));

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });
  });

  describe('file system errors', () => {
    it('ERROR: {configPath: "/nonexistent/.questmaestro"} => throws wrapped error when file read fails', async () => {
      const configPath = filePathContract.parse('/nonexistent/.questmaestro');
      const fsError = new Error('ENOENT: no such file or directory');

      mockFsReadFile.mockRejectedValueOnce(fsError);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(
        new InvalidConfigError({
          message: 'Failed to load config file: ENOENT: no such file or directory',
          configPath,
        }),
      );
    });

    it('ERROR: {configPath: "/corrupted/.questmaestro"} => throws wrapped error when JSON parse fails', async () => {
      const configPath = filePathContract.parse('/corrupted/.questmaestro');

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('{ invalid json }'));

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('ERROR: {configPath: "/project/.questmaestro"} => wraps validation errors in InvalidConfigError', async () => {
      const configPath = filePathContract.parse('/project/.questmaestro');

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('{}'));

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {configPath: "/project/.questmaestro"} => strips unknown properties during validation', async () => {
      const configPath = filePathContract.parse('/project/.questmaestro');
      const mockConfigWithExtra = {
        framework: 'react',
        schema: 'zod',
        unknownProperty: 'should be stripped',
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub(JSON.stringify(mockConfigWithExtra)));

      const result = await configFileLoadBroker({ configPath });

      // Zod validation strips unknown properties
      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'zod',
      });
    });

    it('EDGE: {configPath: "/project/.questmaestro"} => handles minimal valid config', async () => {
      const configPath = filePathContract.parse('/project/.questmaestro');
      const mockConfig = {
        framework: 'node-library',
        schema: 'zod',
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub(JSON.stringify(mockConfig)));

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
    });
  });
});
