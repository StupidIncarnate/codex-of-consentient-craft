import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsDispatchStatePathFindBrokerProxy = (): {
  setupDispatchStatePath: (params: {
    homeDir: string;
    homePath: FilePath;
    dispatchStatePath: FilePath;
  }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports (see dungeonmaster-home-find-broker.proxy.ts for why the
  // specifier must match exactly).
  const joinHandle = registerMock({ fn: join });

  return {
    setupDispatchStatePath: ({
      homeDir,
      homePath,
      dispatchStatePath,
    }: {
      homeDir: string;
      homePath: FilePath;
      dispatchStatePath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      joinHandle
        .calledWith([homePath, locationsStatics.dungeonmasterHome.dispatchState])
        .returns(dispatchStatePath);
    },
  };
};
