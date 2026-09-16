import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsReaddirAdapterProxy = (): {
  resolves: (params: { dirPath: AbsoluteFilePath; entries: readonly string[] }) => void;
  rejects: (params: { dirPath: AbsoluteFilePath; error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: readdir });

  return {
    resolves: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: readonly string[];
    }): void => {
      mock.calledWith([dirPath]).resolves(entries);
    },

    rejects: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([dirPath]).rejects(error);
    },
  };
};
