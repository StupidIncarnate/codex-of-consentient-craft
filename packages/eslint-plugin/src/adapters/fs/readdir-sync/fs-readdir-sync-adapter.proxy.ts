import { readdirSync } from 'fs';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

export const fsReaddirSyncAdapterProxy = (): {
  returns: (args: {
    dirPath: FilePath;
    entries: { name: FileName; isDirectory: boolean }[];
  }) => void;
} => {
  const mock = registerMock({ fn: readdirSync });

  return {
    returns: ({
      dirPath,
      entries,
    }: {
      dirPath: FilePath;
      entries: { name: FileName; isDirectory: boolean }[];
    }): void => {
      mock.calledWith([dirPath, { withFileTypes: true }]).returns(
        entries.map((entry) => ({
          name: entry.name,
          isDirectory: (): boolean => entry.isDirectory,
        })),
      );
    },
  };
};
