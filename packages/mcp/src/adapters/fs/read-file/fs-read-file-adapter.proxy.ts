import { readFile } from 'fs/promises';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FileContents, PathSegment } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapterProxy = (): {
  returns: ({ filepath, contents }: { filepath: PathSegment; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: PathSegment; error: Error }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  // Default: passthrough to real readFile so tests that read real files still work
  const actualFs = requireActual<{ readFile: typeof readFile }>({ module: 'fs/promises' });
  handle.mockImplementation((async (path: unknown) =>
    actualFs.readFile(path as Parameters<typeof readFile>[0], 'utf-8')) as (
    ...args: never[]
  ) => unknown);

  return {
    returns: ({ contents }: { filepath: PathSegment; contents: FileContents }): void => {
      handle.mockResolvedValueOnce(contents);
    },
    throws: ({ error }: { filepath: PathSegment; error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
