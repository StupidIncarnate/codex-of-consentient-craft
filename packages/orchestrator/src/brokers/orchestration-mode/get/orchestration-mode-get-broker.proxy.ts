import type { OrchestrationModeStub } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy, processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';

type OrchestrationMode = ReturnType<typeof OrchestrationModeStub>;

// The broker builds startPath as pathJoinAdapter([processCwdAdapter(), projectConfigFile]).
// pathJoinAdapterProxy() defaults to a real '/'-join and processCwdAdapterProxy() defaults to
// '/default/cwd' (both from @dungeonmaster/shared/testing), so this is the exact, real address
// dungeonmasterConfigResolveAdapter is called with.
const CONFIG_START_PATH = FilePathStub({
  value: `/default/cwd/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
});

export const orchestrationModeGetBrokerProxy = (): {
  setupMode: (params: { mode: OrchestrationMode }) => void;
  setupConfigNotFound: () => void;
  setupConfigError: (params: { error: Error }) => void;
} => {
  pathJoinAdapterProxy();
  processCwdAdapterProxy();
  const configProxy = dungeonmasterConfigResolveAdapterProxy();

  return {
    setupMode: ({ mode }: { mode: OrchestrationMode }): void => {
      configProxy.setupConfigResolved({
        startPath: CONFIG_START_PATH,
        config: configProxy.makeConfigWithArgs({ orchestrationMode: mode } as never),
      });
    },
    setupConfigNotFound: (): void => {
      const error = new Error('ConfigNotFoundError: .dungeonmaster.json not found');
      error.name = 'ConfigNotFoundError';
      configProxy.setupConfigResolveError({ startPath: CONFIG_START_PATH, error });
    },
    setupConfigError: ({ error }: { error: Error }): void => {
      configProxy.setupConfigResolveError({ startPath: CONFIG_START_PATH, error });
    },
  };
};
