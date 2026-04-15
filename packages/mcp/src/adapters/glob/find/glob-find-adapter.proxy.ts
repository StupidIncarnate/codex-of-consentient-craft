import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';

export const globFindAdapterProxy = (): {
  returns: (params: { pattern: GlobPattern; files: readonly PathSegment[] }) => void;
  throws: (params: { pattern: GlobPattern; error: Error }) => void;
} => {
  const handle = registerMock({ fn: glob });

  handle.mockResolvedValue([]);

  return {
    returns: ({ files }: { pattern: GlobPattern; files: readonly PathSegment[] }): void => {
      handle.mockResolvedValueOnce([...files]);
    },
    throws: ({ error }: { pattern: GlobPattern; error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
