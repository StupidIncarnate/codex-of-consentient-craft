import { writeFileSync } from 'fs';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileSyncAdapterProxy = (): {
  succeeds: ({ filePath }: { filePath: FilePath }) => void;
  getWrittenFor: ({ filePath }: { filePath: FilePath }) => unknown;
} => {
  const mockWriteFileSync = registerMock({ fn: writeFileSync });

  return {
    succeeds: ({ filePath }: { filePath: FilePath }): void => {
      mockWriteFileSync.calledWith([filePath]).returns({ success: true as const });
    },
    getWrittenFor: ({ filePath }: { filePath: FilePath }): unknown =>
      mockWriteFileSync.callsMatching([filePath]).at(-1)?.[1],
  };
};
