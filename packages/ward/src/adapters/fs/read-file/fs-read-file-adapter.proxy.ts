import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapterProxy = (): {
  returns: (params: { content: string }) => void;
  returnsByPath: (params: { contents: Record<FilePath, FileContents> }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

  mock.mockResolvedValue('' as never);

  return {
    returns: ({ content }: { content: string }): void => {
      mock.mockResolvedValueOnce(content as never);
    },
    // Paths absent from the map resolve undefined, so the adapter's contract parse rejects them —
    // that is how a test asserts which run file the caller chose to read.
    returnsByPath: ({ contents }: { contents: Record<FilePath, FileContents> }): void => {
      mock.mockImplementation(
        (async (filePath: FilePath): Promise<FileContents | undefined> =>
          Promise.resolve(contents[filePath])) as never,
      );
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
