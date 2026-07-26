import { join } from 'path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathJoinAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const handle = registerMock({ fn: join });

  // Dozens of composing broker proxies across packages/shared build a real path through this
  // adapter, and the segments each one passes are themselves the output of another mocked call
  // (a directory search, a prior join) — there is no single caller-known segment list to key on
  // across every composing proxy. Threading a real `segments` address through every one of them
  // individually would be a much larger change than this adapter alone owns. Instead the base
  // default is a REAL passthrough via requireActual, so any call nobody explicitly staged still
  // gets a genuine joined path instead of '' or a fabricated value. `returns()` stays
  // call-order-scoped (`onceFor([])`) — a live one-shot still outranks the sticky
  // real-passthrough default, so explicit per-test staging keeps working normally.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  handle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: FilePath }): void => {
      handle.onceFor([]).returns(result);
    },
  };
};
