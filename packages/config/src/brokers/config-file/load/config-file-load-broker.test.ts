import { configFileLoadBroker } from './config-file-load-broker';
import { InvalidConfigError } from '../../../errors/invalid-config/invalid-config-error';
import { fsReadFile } from '../../../adapters/fs/fs-read-file';
import { nodeRequire } from '../../../adapters/node/node-require-single';
import { nodeRequireClearCache } from '../../../adapters/node/node-require-clear-cache';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

// Mock adapters (the boundary)
jest.mock('../../../adapters/fs/fs-read-file');
jest.mock('../../../adapters/node/node-require-single');
jest.mock('../../../adapters/node/node-require-clear-cache');

const mockFsReadFile = jest.mocked(fsReadFile);
const mockNodeRequire = jest.mocked(nodeRequire);
const mockNodeRequireClearCache = jest.mocked(nodeRequireClearCache);

describe('configFileLoadBroker', () => {
  beforeEach(() => {
    mockFsReadFile.mockReset();
    mockNodeRequire.mockReset();
    mockNodeRequireClearCache.mockReset();
  });

  describe('successful config loading', () => {
    it('VALID: {configPath: "/project/.questmaestro"} => loads CommonJS export', async () => {
      const configPath = '/project/.questmaestro';
      const mockConfig = {
        framework: 'react',
        schema: 'zod',
      };

      mockFsReadFile.mockResolvedValue(FileContentsStub('module.exports = {...}'));
      mockNodeRequire.mockReturnValue(mockConfig);

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
      expect(mockNodeRequireClearCache).toHaveBeenCalledTimes(1);
      expect(mockNodeRequireClearCache).toHaveBeenCalledWith({ modulePath: configPath });
      expect(mockNodeRequire).toHaveBeenCalledTimes(1);
      expect(mockNodeRequire).toHaveBeenCalledWith({ modulePath: configPath });
      expect(mockFsReadFile).toHaveBeenCalledTimes(1);
      expect(mockFsReadFile).toHaveBeenCalledWith({ filePath: configPath });
    });

    it('VALID: {configPath: "/project/.questmaestro"} => loads ESM default export', async () => {
      const configPath = '/project/.questmaestro';
      const mockConfig = {
        framework: 'express',
        schema: 'joi',
      };
      const mockModule = {
        default: mockConfig,
        someOtherExport: 'value',
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('export default {...}'));
      mockNodeRequire.mockReturnValueOnce(mockModule);

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
      expect(mockNodeRequireClearCache).toHaveBeenCalledTimes(1);
      expect(mockNodeRequire).toHaveBeenCalledTimes(1);
      expect(mockFsReadFile).toHaveBeenCalledTimes(1);
    });

    it('VALID: {configPath: "/complex/.questmaestro"} => loads config with architecture overrides', async () => {
      const configPath = '/complex/.questmaestro';
      const mockConfig = {
        framework: 'react',
        routing: 'react-router-dom',
        schema: ['zod', 'yup'],
        architecture: {
          overrides: {
            state: { add: ['zustand'] },
          },
        },
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = {...}'));
      mockNodeRequire.mockReturnValueOnce(mockConfig);

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
    });
  });

  describe('config validation errors', () => {
    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is null', async () => {
      const configPath = '/project/.questmaestro';

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = null'));
      mockNodeRequire.mockReturnValueOnce(null);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is undefined', async () => {
      const configPath = '/project/.questmaestro';

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = undefined'));
      mockNodeRequire.mockReturnValueOnce(undefined);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is string', async () => {
      const configPath = '/project/.questmaestro';

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = "invalid"'));
      mockNodeRequire.mockReturnValueOnce('invalid');

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is number', async () => {
      const configPath = '/project/.questmaestro';

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = 123'));
      mockNodeRequire.mockReturnValueOnce(123);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_FRAMEWORK: {configPath: "/project/.questmaestro"} => throws when framework is missing', async () => {
      const configPath = '/project/.questmaestro';
      const mockConfig = {
        schema: 'zod',
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = {...}'));
      mockNodeRequire.mockReturnValueOnce(mockConfig);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_FRAMEWORK: {configPath: "/project/.questmaestro"} => throws when framework is null', async () => {
      const configPath = '/project/.questmaestro';
      const mockConfig = {
        framework: null,
        schema: 'zod',
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = {...}'));
      mockNodeRequire.mockReturnValueOnce(mockConfig);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_FRAMEWORK: {configPath: "/project/.questmaestro"} => throws when framework is undefined', async () => {
      const configPath = '/project/.questmaestro';
      const mockConfig = {
        framework: undefined,
        schema: 'zod',
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = {...}'));
      mockNodeRequire.mockReturnValueOnce(mockConfig);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });
  });

  describe('file system errors', () => {
    it('ERROR: {configPath: "/nonexistent/.questmaestro"} => throws wrapped error when file read fails', async () => {
      const configPath = '/nonexistent/.questmaestro';
      const fsError = new Error('ENOENT: no such file or directory');

      mockFsReadFile.mockRejectedValueOnce(fsError);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(
        new InvalidConfigError({
          message: 'Failed to load config file: ENOENT: no such file or directory',
          configPath,
        }),
      );

      expect(mockNodeRequire).not.toHaveBeenCalled();
    });

    it('ERROR: {configPath: "/corrupted/.questmaestro"} => throws wrapped error when require fails', async () => {
      const configPath = '/corrupted/.questmaestro';
      const requireError = new Error('Unexpected token in JSON');

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('corrupted content'));
      mockNodeRequire.mockImplementationOnce(() => {
        throw requireError;
      });

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(
        new InvalidConfigError({
          message: 'Failed to load config file: Unexpected token in JSON',
          configPath,
        }),
      );
    });

    it('ERROR: {configPath: "/project/.questmaestro"} => wraps validation errors in InvalidConfigError', async () => {
      const configPath = '/project/.questmaestro';

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = {...}'));
      mockNodeRequire.mockReturnValueOnce({});

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('ERROR: {configPath: "/project/.questmaestro"} => handles Error objects properly', async () => {
      const configPath = '/project/.questmaestro';
      const customError = new Error('Custom error message');

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = {...}'));
      mockNodeRequire.mockImplementationOnce(() => {
        throw customError;
      });

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(
        new InvalidConfigError({
          message: 'Failed to load config file: Custom error message',
          configPath,
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: {configPath: "/project/.questmaestro"} => handles ESM module with no default', async () => {
      const configPath = '/project/.questmaestro';
      const mockModule = {
        framework: 'react',
        schema: 'zod',
        notDefault: true,
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('export {...}'));
      mockNodeRequire.mockReturnValueOnce(mockModule);

      const result = await configFileLoadBroker({ configPath });

      // Zod validation strips unknown properties
      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'zod',
      });
    });

    it('EDGE: {configPath: "/project/.questmaestro"} => handles minimal valid config', async () => {
      const configPath = '/project/.questmaestro';
      const mockConfig = {
        framework: 'node-library',
        schema: 'joi',
      };

      mockFsReadFile.mockResolvedValueOnce(FileContentsStub('module.exports = {...}'));
      mockNodeRequire.mockReturnValueOnce(mockConfig);

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual(mockConfig);
    });
  });
});
