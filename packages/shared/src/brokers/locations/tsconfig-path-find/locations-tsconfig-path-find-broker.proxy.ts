import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { dirname, join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '../../../statics/locations/locations-statics';

type FilePath = string;

export const locationsTsconfigPathFindBrokerProxy = (): {
  setupTsconfigFound: (params: { searchPath: string }) => void;
  setupTsconfigNotFound: (params: { searchPath: string }) => void;
  setupTsconfigMissingWithParent: (params: { searchPath: string; parentPath: string }) => void;
} => {
  const fsProxy = pathExistsProxy();
  // join/dirname are pure and carry no gateway proxy of their own (#gateway/node/path is a raw
  // passthrough), so they are mocked directly here — but the mock MUST be registered on `join`/
  // `dirname` as imported from '#gateway/node/path' (the same specifier the broker imports),
  // never from raw 'path' (see dungeonmaster-home-find-broker.proxy.ts for why a mismatched
  // specifier silently misses the broker's own calls). Each call is staged on a SPECIFIC
  // argument tuple, never a bare `calledWith([])` — see config-root-find-broker.proxy.ts for why
  // a bare zero-arg address is an order-dependent queue a sibling proxy's own staging can consume
  // out of turn.
  const joinHandle = registerMock({ fn: join });
  const dirnameHandle = registerMock({ fn: dirname });

  const configPathFor = ({ searchPath }: { searchPath: string }): FilePath => {
    const configPath = `${searchPath}/${locationsStatics.repoRoot.tsconfig}`;
    joinHandle.calledWith([searchPath, locationsStatics.repoRoot.tsconfig]).returns(configPath);
    return configPath;
  };

  return {
    setupTsconfigFound: ({ searchPath }: { searchPath: string }): void => {
      fsProxy.present({ path: configPathFor({ searchPath }) });
    },

    setupTsconfigNotFound: ({ searchPath }: { searchPath: string }): void => {
      fsProxy.missing({ path: configPathFor({ searchPath }) });
      dirnameHandle.calledWith([searchPath]).returns(searchPath);
    },

    setupTsconfigMissingWithParent: ({
      searchPath,
      parentPath,
    }: {
      searchPath: string;
      parentPath: string;
    }): void => {
      fsProxy.missing({ path: configPathFor({ searchPath }) });
      dirnameHandle.calledWith([searchPath]).returns(parentPath);
    },
  };
};
