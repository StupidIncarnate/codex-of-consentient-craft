import { writeFileSync } from 'fs';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';

jest.mock('fs');

export const fsWriteFileSyncAdapterProxy = (): {
  succeeds: ({ filePath, contents }: { filePath: FilePath; contents: FileContents }) => void;
} => {
  const mockWriteFileSync = jest.mocked(writeFileSync);

  // Default mock behavior - do nothing (successful write)
  mockWriteFileSync.mockImplementation(() => undefined);

  return {
    succeeds: ({
      filePath: _filePath,
      contents: _contents,
    }: {
      filePath: FilePath;
      contents: FileContents;
    }): void => {
      mockWriteFileSync.mockReturnValueOnce(undefined);
    },
  };
};
