import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';

export const fsGlobAdapterProxy = (): {
  returns: ({ pattern, files }: { pattern: GlobPattern; files: PathSegment[] }) => void;
} => {
  const handle = registerMock({ fn: glob });

  handle.mockImplementation(async () => Promise.resolve([]));

  return {
    // fsGlobAdapter hands the pattern to glob(pattern, { cwd?, absolute }) untouched, so the
    // pattern IS the address. Staging it alone leaves the options bag unconstrained.
    returns: ({ pattern, files }: { pattern: GlobPattern; files: PathSegment[] }): void => {
      handle.calledWith([pattern]).resolves(files);
    },
  };
};
