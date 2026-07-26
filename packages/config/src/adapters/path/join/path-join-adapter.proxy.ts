import { join } from 'path';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

export const pathJoinAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = registerMock({ fn: join });

  // configFileFindBrokerProxy, configResolveBrokerProxy, and findParentConfigsLayerBrokerProxy
  // each build a real path through this adapter where the segments are themselves the output of
  // another mocked call (dirname, or configRootFindBrokerProxy's own directory search) — there is
  // no single caller-known segment list to key on across every composing proxy. `returns()` stays
  // call-order-scoped (`onceFor([])`), matching @dungeonmaster/shared's own path-join-adapter
  // proxy. Any call nobody staged falls through to a real passthrough via requireActual, so a
  // join the test doesn't care about still computes a genuine value instead of ''.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  mock.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    // Semantic method for setting the next join() call's return value
    returns: ({ result }: { result: FilePath }): void => {
      mock.onceFor([]).returns(result);
    },
  };
};
