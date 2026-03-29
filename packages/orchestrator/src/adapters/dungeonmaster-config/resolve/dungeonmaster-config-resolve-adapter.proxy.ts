import { configResolveBroker, DungeonmasterConfigStub } from '@dungeonmaster/config';
import type { DungeonmasterConfig } from '@dungeonmaster/config';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const dungeonmasterConfigResolveAdapterProxy = (): {
  setupConfigResolved: (params: { config: DungeonmasterConfig }) => void;
  setupConfigResolveError: (params: { error: Error }) => void;
  makeRealConfig: () => DungeonmasterConfig;
  makeConfigWithArgs: (args: never) => DungeonmasterConfig;
} => {
  const handle = registerMock({ fn: configResolveBroker });

  handle.mockResolvedValue(undefined as never);

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
