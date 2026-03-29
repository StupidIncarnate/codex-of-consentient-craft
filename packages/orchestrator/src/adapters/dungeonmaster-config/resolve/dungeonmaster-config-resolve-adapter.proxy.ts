import { configResolveBroker } from '@dungeonmaster/config';
import type { DungeonmasterConfig } from '@dungeonmaster/config';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

type ConfigStubFn = (...args: never[]) => DungeonmasterConfig;

export const dungeonmasterConfigResolveAdapterProxy = (): {
  setupConfigResolved: (params: { config: DungeonmasterConfig }) => void;
  setupConfigResolveError: (params: { error: Error }) => void;
  makeRealConfig: () => DungeonmasterConfig;
  makeConfigWithArgs: (args: never) => DungeonmasterConfig;
} => {
  const handle = registerMock({ fn: configResolveBroker });

  handle.mockResolvedValue(undefined as never);

  const { DungeonmasterConfigStub } = requireActual({ module: '@dungeonmaster/config' }) as {
    DungeonmasterConfigStub: ConfigStubFn;
  };

  return {
    setupConfigResolved: ({ config }: { config: DungeonmasterConfig }): void => {
      handle.mockResolvedValueOnce(config);
    },

    setupConfigResolveError: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },

    makeRealConfig: (): DungeonmasterConfig => DungeonmasterConfigStub(),

    makeConfigWithArgs: (args: never): DungeonmasterConfig => DungeonmasterConfigStub(args),
  };
};
