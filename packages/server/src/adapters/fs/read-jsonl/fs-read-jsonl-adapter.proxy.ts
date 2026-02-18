import { readFile, readdir } from 'fs/promises';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

jest.mock('fs/promises');

export const fsReadJsonlAdapterProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; content: string }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  setupReaddir: (params: { files: string[] }) => void;
} => {
  const mockReadFile = jest.mocked(readFile);
  const mockReaddir = jest.mocked(readdir);

  mockReadFile.mockResolvedValue('');

  return {
    returns: ({ content }: { filePath: AbsoluteFilePath; content: string }): void => {
      mockReadFile.mockResolvedValueOnce(content);
    },
    throws: ({ error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mockReadFile.mockRejectedValueOnce(error);
    },
    setupReaddir: ({ files }: { files: string[] }): void => {
      (mockReaddir as jest.Mock).mockResolvedValueOnce(files);
    },
  };
};
