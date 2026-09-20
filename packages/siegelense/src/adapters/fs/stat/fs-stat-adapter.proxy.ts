import { stat } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsStatAdapterProxy = (): {
  resolves: (params: {
    filePath: AbsoluteFilePath;
    sizeBytes: number;
    modifiedAtMs: number;
  }) => void;
  rejects: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: stat });

  return {
    resolves: ({
      filePath,
      sizeBytes,
      modifiedAtMs,
    }: {
      filePath: AbsoluteFilePath;
      sizeBytes: number;
      modifiedAtMs: number;
    }): void => {
      mock.calledWith([filePath]).resolves({ size: sizeBytes, mtimeMs: modifiedAtMs });
    },

    rejects: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
