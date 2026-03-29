import type { DungeonmasterConfig } from '@dungeonmaster/config';

jest.mock('@dungeonmaster/config');

export const dungeonmasterConfigResolveAdapterProxy = (): {
  setupConfigResolved: (params: { config: DungeonmasterConfig }) => void;
  setupConfigResolveError: (params: { error: Error }) => void;
  makeRealConfig: () => DungeonmasterConfig;
} => {
  const { configResolveBroker } = jest.requireMock<{
    configResolveBroker: jest.Mock;
  }>('@dungeonmaster/config');

  const { DungeonmasterConfigStub } = jest.requireActual<{
    DungeonmasterConfigStub: () => DungeonmasterConfig;
  }>('@dungeonmaster/config');

  configResolveBroker.mockResolvedValue(undefined);

  return {
    setupConfigResolved: ({ config }: { config: DungeonmasterConfig }): void => {
      configResolveBroker.mockResolvedValueOnce(config);
    },

    setupConfigResolveError: ({ error }: { error: Error }): void => {
      configResolveBroker.mockRejectedValueOnce(error);
    },

    makeRealConfig: (): DungeonmasterConfig => DungeonmasterConfigStub(),
  };
};
