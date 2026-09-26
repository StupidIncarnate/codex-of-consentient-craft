import { join } from 'path';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

export const pathJoinAdapterProxy = (): {
  returns: ({ paths, result }: { paths: string[]; result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = registerMock({ fn: join });
  // Real passthrough default: a caller composing a path (find-ancestor-directory's own directory
  // walk, among others) needs a genuine joined value, not a fabricated one, and constructing this
  // proxy only to satisfy enforce-proxy-child-creation must not silently break that math. A
  // specific `.returns()` stays more specific than this catch-all and still wins.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  mock.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    // Semantic method for setting return value, keyed on the exact segments joined
    returns: ({ paths, result }: { paths: string[]; result: FilePath }): void => {
      mock.calledWith([...paths]).returns(result);
    },
  };
};
