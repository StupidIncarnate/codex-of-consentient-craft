import { writeFileSync } from 'fs';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileSyncAdapterProxy = (): {
  succeeds: ({ filePath, contents }: { filePath: FilePath; contents: FileContents }) => void;
  getWrittenContent: () => unknown;
} => {
  const mockWriteFileSync = registerMock({ fn: writeFileSync });

  // Default mock behavior - do nothing (successful write)
  mockWriteFileSync.mockImplementation(() => ({ success: true as const }));

  return {
    succeeds: ({
      filePath: _filePath,
      contents: _contents,
    }: {
      filePath: FilePath;
      contents: FileContents;
    }): void => {
      mockWriteFileSync.mockReturnValueOnce({ success: true as const });
    },
    getWrittenContent: (): unknown => {
      const { calls } = mockWriteFileSync.mock;
      const lastCall = calls[calls.length - 1];
      if (lastCall === undefined) return undefined;
      return lastCall[1];
    },
  };
};
