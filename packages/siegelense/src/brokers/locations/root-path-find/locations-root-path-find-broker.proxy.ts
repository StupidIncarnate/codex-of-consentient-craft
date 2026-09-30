import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { locationsStatics } from '@dungeonmaster/shared/statics';

export const locationsRootPathFindBrokerProxy = (): {
  setupRootPath: (params: { homeDir: string; homePath: string; rootPath: string }) => void;
  // Stages ONLY the addressed homedir()/join() pair dungeonmasterHomeFindBroker reads — never the
  // outer root join. A caller composed alongside another resolver that also needs the home to
  // resolve, but does not want THIS file's own outer join staged too, reaches for this instead of
  // setupRootPath: enforce-proxy-child-creation forbids a proxy from composing a grandchild proxy
  // (dungeonmasterHomeFindBrokerProxy) its own implementation never imports directly, so a caller
  // several layers up this composition chain (instanceKillBrokerProxy's convention) can only reach
  // the home stage through its own DIRECT child's forwarded method.
  setupHomeOnly: (params: { homeDir: string; homePath: string }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports (see dungeonmaster-home-find-broker.proxy.ts for why the
  // specifier must match exactly). Shared with dungeonmasterHomeFindBrokerProxy's own join
  // handle, so its sticky real-passthrough default already covers any call this file leaves
  // unaddressed.
  const joinHandle = registerMock({ fn: join });

  return {
    setupRootPath: ({
      homeDir,
      homePath,
      rootPath,
    }: {
      homeDir: string;
      homePath: string;
      rootPath: string;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      joinHandle.calledWith([homePath, locationsStatics.siegelense.dir]).returns(rootPath);
    },

    setupHomeOnly: ({ homeDir, homePath }: { homeDir: string; homePath: string }): void => {
      dmHomeProxy.setupHomePath({ homeDir, homePath });
    },
  };
};
