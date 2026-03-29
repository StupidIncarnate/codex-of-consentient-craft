import { readFileSync } from 'fs';
import type { FilePath, FileContents } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReadFileSyncAdapterProxy = (): {
  returns: (args: { filePath: FilePath; contents: FileContents }) => void;
} => {
  const mock = registerMock({ fn: readFileSync });

  // Set up default mock behavior
  mock.mockReturnValue('');

  return {
    returns: ({ contents }: { filePath: FilePath; contents: FileContents }): void => {
      mock.mockReturnValue(contents);
    },
  };
};
