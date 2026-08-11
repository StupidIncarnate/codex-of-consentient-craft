import { resolve } from 'path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const pathResolveAdapterProxy = (): {
  returns: ({ paths, result }: { paths: string[]; result: AbsoluteFilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const handle = registerMock({ fn: resolve });

  // `path.resolve` is reachable from any module in the registry, not just this adapter, so the base
  // default is a REAL passthrough via requireActual — an unstaged call gets a genuine absolute path
  // instead of ''. `returns()` addresses the exact segment list the caller passes, which outranks
  // this catch-all, so several packages can be described in one test without ordering games.
  const realPath = requireActual<{ resolve: typeof resolve }>({ module: 'path' });
  handle.calledWith([]).implement((...segments: never[]) => realPath.resolve(...segments));

  return {
    // Semantic method for setting return value
    returns: ({ paths, result }: { paths: string[]; result: AbsoluteFilePath }): void => {
      handle.calledWith(paths).returns(result);
    },
  };
};
