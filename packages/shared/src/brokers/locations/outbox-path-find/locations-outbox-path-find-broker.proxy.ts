import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsOutboxPathFindBrokerProxy = (): {
  setupOutboxPath: (params: { homeDir: string; homePath: string; outboxPath: string }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle = registerMock({ fn: join });

  return {
    setupOutboxPath: ({
      homeDir,
      homePath,
      outboxPath,
    }: {
      homeDir: string;
      homePath: string;
      outboxPath: string;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      joinHandle
        .calledWith([homePath, locationsStatics.dungeonmasterHome.eventOutbox])
        .returns(outboxPath);
    },
  };
};
