import { configResolveBroker, DungeonmasterConfigStub } from '@dungeonmaster/config';
import type { DungeonmasterConfig } from '@dungeonmaster/config';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

// configResolveBroker is called as configResolveBroker({ filePath: startPath }) — the
// filePath is the real, distinguishing address every caller resolves before calling in.
export const dungeonmasterConfigResolveAdapterProxy = (): {
  setupConfigResolved: (params: { startPath: FilePath; config: DungeonmasterConfig }) => void;
  setupConfigResolveError: (params: { startPath: FilePath; error: Error }) => void;
  makeRealConfig: () => DungeonmasterConfig;
  makeConfigWithArgs: (args: never) => DungeonmasterConfig;
} => {
  const handle = registerMock({ fn: configResolveBroker });

  return {
    setupConfigResolved: ({
      startPath,
      config,
    }: {
      startPath: FilePath;
      config: DungeonmasterConfig;
    }): void => {
      handle.calledWith([{ filePath: startPath }]).resolves(config);
    },

    setupConfigResolveError: ({
      startPath,
      error,
    }: {
      startPath: FilePath;
      error: Error;
    }): void => {
      handle.calledWith([{ filePath: startPath }]).rejects(error);
    },

    makeRealConfig: (): DungeonmasterConfig => DungeonmasterConfigStub(),

    makeConfigWithArgs: (args: never): DungeonmasterConfig => DungeonmasterConfigStub(args),
  };
};
