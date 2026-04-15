import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';

export const fsGlobAdapterProxy = (): {
  returns: ({ pattern, files }: { pattern: GlobPattern; files: PathSegment[] }) => void;
} => {
  const handle = registerMock({ fn: glob });

  handle.mockImplementation(async () => Promise.resolve([]));

  return {
    returns: ({ files }: { pattern: GlobPattern; files: PathSegment[] }): void => {
      handle.mockResolvedValueOnce(files);
    },
  };
};
