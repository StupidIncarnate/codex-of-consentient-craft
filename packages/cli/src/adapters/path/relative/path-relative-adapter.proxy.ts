import { relative } from 'path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath, PathSegment } from '@dungeonmaster/shared/contracts';

export const pathRelativeAdapterProxy = (): {
  returns: ({ from, to, result }: { from: FilePath; to: FilePath; result: PathSegment }) => void;
} => {
  // Mock the npm package, not the adapter
  const handle = registerMock({ fn: relative });

  // `path.relative` is reachable from any module in the registry, so the base default is a REAL
  // passthrough via requireActual — an unstaged call gets a genuine relative path instead of ''.
  const realPath = requireActual<{ relative: typeof relative }>({ module: 'path' });
  handle
    .calledWith([])
    .implement((...segments: [FilePath, FilePath]) => realPath.relative(...segments));

  return {
    returns: ({
      from,
      to,
      result,
    }: {
      from: FilePath;
      to: FilePath;
      result: PathSegment;
    }): void => {
      handle.calledWith([from, to]).returns(result);
    },
  };
};
