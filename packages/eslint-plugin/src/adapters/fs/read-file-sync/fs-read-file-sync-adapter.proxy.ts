import { readFileSync } from 'fs';
import type { FilePath, FileContents } from '@dungeonmaster/shared/contracts';

// ✅ Mock declared in proxy - automatically hoisted when proxy is imported
jest.mock('fs');

export const fsReadFileSyncAdapterProxy = (): {
  returns: (args: { filePath: FilePath; contents: FileContents }) => void;
} => {
  // ✅ Mock the npm dependency (fs.readFileSync), not the adapter!
  const mock = jest.mocked(readFileSync);

  // Set up default mock behavior
  mock.mockReturnValue('');

  return {
    returns: ({ contents }: { filePath: FilePath; contents: FileContents }): void => {
      mock.mockReturnValue(contents);
    },
  };
};
