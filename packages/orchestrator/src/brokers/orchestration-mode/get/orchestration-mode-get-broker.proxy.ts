import type { OrchestrationModeStub } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy, processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';

type OrchestrationMode = ReturnType<typeof OrchestrationModeStub>;

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
        config: configProxy.makeConfigWithArgs({ orchestrationMode: mode } as never),
      });
    },
    setupConfigNotFound: (): void => {
      const error = new Error('ConfigNotFoundError: .dungeonmaster.json not found');
      error.name = 'ConfigNotFoundError';
      configProxy.setupConfigResolveError({ error });
    },
    setupConfigError: ({ error }: { error: Error }): void => {
      configProxy.setupConfigResolveError({ error });
    },
  };
};
