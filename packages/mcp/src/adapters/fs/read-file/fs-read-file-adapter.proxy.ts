import { readFile } from 'fs/promises';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapterProxy = (): {
  returns: ({ filepath, contents }: { filepath: FilePath; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  // Default: passthrough to real readFile so tests that read real files still work
  const actualFs = requireActual({ module: 'fs/promises' }) as {
    readFile: typeof readFile;
  };
  handle.mockImplementation((async (path: unknown) =>
    actualFs.readFile(path as Parameters<typeof readFile>[0], 'utf-8')) as (
    ...args: never[]
  ) => unknown);

  return {
    returns: ({ contents }: { filepath: FilePath; contents: FileContents }): void => {
      handle.mockResolvedValueOnce(contents);
    },
    throws: ({ error }: { filepath: FilePath; error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
