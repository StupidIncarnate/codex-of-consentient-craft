import { fsStatAdapter } from './fs-stat-adapter';
import { fsStatAdapterProxy } from './fs-stat-adapter.proxy';
import { filePathStub } from '../../../../contracts/file-path/file-path.stub';
import type { Stats } from 'node:fs';

describe('fsStatAdapter', () => {
  it('should return file stats', async () => {
    const mockStats = {
      isFile: () => true,
      isDirectory: () => false,
      size: 1024,
    } as Stats;
    fsStatAdapterProxy.mockResolvedValue(mockStats);

    const result = await fsStatAdapter({ filePath: filePathStub });

    expect(result).toBe(mockStats);
    expect(fsStatAdapterProxy).toHaveBeenCalledWith({ filePath: filePathStub });
  });

  it('should throw error when stat fails', async () => {
    const mockError = new Error('File not found');
    fsStatAdapterProxy.mockRejectedValue(mockError);

    await expect(fsStatAdapter({ filePath: filePathStub })).rejects.toThrow(
      `Failed to stat file at ${filePathStub}`,
    );
  });
});
