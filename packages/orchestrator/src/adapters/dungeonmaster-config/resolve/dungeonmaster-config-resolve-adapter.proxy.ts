import { configResolveBroker, DungeonmasterConfigStub } from '@dungeonmaster/config';
import type { DungeonmasterConfig } from '@dungeonmaster/config';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const dungeonmasterConfigResolveAdapterProxy = (): {
  setupConfigResolved: (params: { config: DungeonmasterConfig }) => void;
  setupConfigReplace: (params: { config: DungeonmasterConfig }) => void;
  setupConfigResolveError: (params: { error: Error }) => void;
  getResolvedStartPath: () => FilePath | undefined;
  makeRealConfig: () => DungeonmasterConfig;
  makeConfigWithArgs: (args: never) => DungeonmasterConfig;
} => {
  const handle = registerMock({ fn: configResolveBroker });

  handle.mockResolvedValue(undefined as never);

  return {
    setupConfigResolved: ({ config }: { config: DungeonmasterConfig }): void => {
      handle.mockResolvedValueOnce(config);
    },

    setupConfigReplace: ({ config }: { config: DungeonmasterConfig }): void => {
      handle.mockClear();
      handle.mockResolvedValueOnce(config);
    },

    setupConfigResolveError: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },

    // Capture the `filePath` (= startPath) the adapter forwarded to configResolveBroker on its
    // most recent call. Lets callers assert the resolution origin is a resolvable file, not a
    // bare directory whose dirname() walks above the repo root.
    getResolvedStartPath: (): FilePath | undefined => {
      const { calls } = handle.mock;
      const lastCall = calls[calls.length - 1];
      if (lastCall === undefined) {
        return undefined;
      }
      const [arg] = lastCall;
      return (arg as { filePath: FilePath }).filePath;
    },

    makeRealConfig: (): DungeonmasterConfig => DungeonmasterConfigStub(),

    makeConfigWithArgs: (args: never): DungeonmasterConfig => DungeonmasterConfigStub(args),
  };
};
