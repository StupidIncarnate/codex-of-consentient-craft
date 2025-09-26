import { configFileFindBroker } from './config-file-find-broker';
import { ConfigNotFoundError } from '../../../errors/config-not-found/config-not-found-error';
import { access } from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  constants: {
    R_OK: 4,
  },
}));

const mockAccess = access as jest.MockedFunction<typeof access>;

describe('configFileFindBroker', () => {
  beforeEach(() => {
    mockAccess.mockReset();
  });

  describe('config file found cases', () => {
    it('VALID: {startPath: "/project/src/file.ts"} => finds config in same directory', async () => {
      const startPath = '/project/src/file.ts';
      mockAccess.mockResolvedValueOnce(undefined);

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/project/src/.questmaestro');
      expect(mockAccess).toHaveBeenCalledTimes(1);
      expect(mockAccess).toHaveBeenCalledWith('/project/src/.questmaestro', 4);
    });

    it('VALID: {startPath: "/project/sub/file.ts"} => finds config in parent directory', async () => {
      const startPath = '/project/sub/file.ts';
      mockAccess
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce(undefined);

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/project/.questmaestro');
      expect(mockAccess).toHaveBeenCalledTimes(2);
      expect(mockAccess).toHaveBeenNthCalledWith(1, '/project/sub/.questmaestro', 4);
      expect(mockAccess).toHaveBeenNthCalledWith(2, '/project/.questmaestro', 4);
    });

    it('VALID: {startPath: "/deep/nested/project/src/file.ts"} => finds config walking up multiple levels', async () => {
      const startPath = '/deep/nested/project/src/file.ts';
      mockAccess
        .mockRejectedValueOnce(new Error('File not found'))
        .mockRejectedValueOnce(new Error('File not found'))
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce(undefined);

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/deep/.questmaestro');
      expect(mockAccess).toHaveBeenCalledTimes(4);
      expect(mockAccess).toHaveBeenNthCalledWith(1, '/deep/nested/project/src/.questmaestro', 4);
      expect(mockAccess).toHaveBeenNthCalledWith(2, '/deep/nested/project/.questmaestro', 4);
      expect(mockAccess).toHaveBeenNthCalledWith(3, '/deep/nested/.questmaestro', 4);
      expect(mockAccess).toHaveBeenNthCalledWith(4, '/deep/.questmaestro', 4);
    });

    it('VALID: {startPath: "/root-config/file.ts"} => finds config at filesystem root', async () => {
      const startPath = '/root-config/file.ts';
      mockAccess
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce(undefined);

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/.questmaestro');
      expect(mockAccess).toHaveBeenCalledTimes(2);
      expect(mockAccess).toHaveBeenNthCalledWith(1, '/root-config/.questmaestro', 4);
      expect(mockAccess).toHaveBeenNthCalledWith(2, '/.questmaestro', 4);
    });
  });

  describe('config file not found cases', () => {
    it('ERROR: {startPath: "/project/file.ts"} => throws ConfigNotFoundError when no config exists', async () => {
      const startPath = '/project/file.ts';
      mockAccess.mockRejectedValue(new Error('File not found'));

      await expect(configFileFindBroker({ startPath })).rejects.toThrow(
        new ConfigNotFoundError({ startPath }),
      );

      expect(mockAccess).toHaveBeenCalledTimes(2);
      expect(mockAccess).toHaveBeenNthCalledWith(1, '/project/.questmaestro', 4);
      expect(mockAccess).toHaveBeenNthCalledWith(2, '/.questmaestro', 4);
    });

    it('ERROR: {startPath: "/deep/nested/file.ts"} => throws ConfigNotFoundError after walking entire tree', async () => {
      const startPath = '/deep/nested/file.ts';
      mockAccess.mockRejectedValue(new Error('File not found'));

      await expect(configFileFindBroker({ startPath })).rejects.toThrow(
        new ConfigNotFoundError({ startPath }),
      );

      expect(mockAccess).toHaveBeenCalledTimes(3);
      expect(mockAccess).toHaveBeenNthCalledWith(1, '/deep/nested/.questmaestro', 4);
      expect(mockAccess).toHaveBeenNthCalledWith(2, '/deep/.questmaestro', 4);
      expect(mockAccess).toHaveBeenNthCalledWith(3, '/.questmaestro', 4);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {startPath: "/file.ts"} => finds config at root or throws error', async () => {
      const startPath = '/file.ts';
      mockAccess.mockRejectedValue(new Error('File not found'));

      await expect(configFileFindBroker({ startPath })).rejects.toThrow(
        new ConfigNotFoundError({ startPath }),
      );

      expect(mockAccess).toHaveBeenCalledTimes(1);
      expect(mockAccess).toHaveBeenNthCalledWith(1, '/.questmaestro', 4);
    });

    it('EDGE: {startPath: "/single/.hidden"} => handles hidden files as start path', async () => {
      const startPath = '/single/.hidden';
      mockAccess.mockResolvedValueOnce(undefined);

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/single/.questmaestro');
      expect(mockAccess).toHaveBeenCalledTimes(1);
      expect(mockAccess).toHaveBeenCalledWith('/single/.questmaestro', 4);
    });

    it('EDGE: {startPath: "/path with spaces/file.ts"} => handles paths with spaces', async () => {
      const startPath = '/path with spaces/file.ts';
      mockAccess.mockResolvedValueOnce(undefined);

      const result = await configFileFindBroker({ startPath });

      expect(result).toBe('/path with spaces/.questmaestro');
      expect(mockAccess).toHaveBeenCalledTimes(1);
      expect(mockAccess).toHaveBeenCalledWith('/path with spaces/.questmaestro', 4);
    });
  });
});
