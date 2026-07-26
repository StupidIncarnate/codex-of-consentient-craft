import { dirname } from 'path';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

export const pathDirnameAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = registerMock({ fn: dirname });

  // THE JOIN/DIRNAME/BASENAME TRAP (see tmp/sweep-guidance.md): configFileFindBrokerProxy,
  // configResolveBrokerProxy, and findParentConfigsLayerBrokerProxy each call dirname on a
  // path that is itself the output of a prior mocked call (the broker's own join result, or a
  // config path just loaded), so there is no fixed argument to key on across the composed
  // proxies. `returns()` stays call-order-scoped (`onceFor([])`), matching
  // @dungeonmaster/shared's own path-dirname-adapter proxy, with a real passthrough default
  // via requireActual for any call nobody staged.
  const realPath = requireActual<{ dirname: typeof dirname }>({ module: 'path' });
  mock.calledWith([]).implement((inputPath: never) => realPath.dirname(inputPath));

  return {
    // Semantic method for setting the next dirname() call's return value
    returns: ({ result }: { result: FilePath }): void => {
      mock.onceFor([]).returns(result);
    },
  };
};
