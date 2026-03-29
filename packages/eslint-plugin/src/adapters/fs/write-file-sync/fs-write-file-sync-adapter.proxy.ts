import { writeFileSync } from 'fs';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileSyncAdapterProxy = (): {
  succeeds: ({ filePath, contents }: { filePath: FilePath; contents: FileContents }) => void;
} => {
  const mockWriteFileSync = registerMock({ fn: writeFileSync });

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
