import { dirname } from 'path';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

export const pathDirnameAdapterProxy = (): {
  returns: ({ filePath, result }: { filePath: FilePath; result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = registerMock({ fn: dirname });
  // Real passthrough default: a caller walking up a directory tree (find-ancestor-directory's own
  // walk, among others) needs a genuine parent path, not a fabricated one, and constructing this
  // proxy only to satisfy enforce-proxy-child-creation must not silently break that math. A
  // specific `.returns()` stays more specific than this catch-all and still wins.
  const realPath = requireActual<{ dirname: typeof dirname }>({ module: 'path' });
  mock.calledWith([]).implement((path: never) => realPath.dirname(path));

  return {
    // Semantic method for setting return value, keyed on the exact path passed
    returns: ({ filePath, result }: { filePath: FilePath; result: FilePath }): void => {
      mock.calledWith([filePath]).returns(result);
    },
  };
};
