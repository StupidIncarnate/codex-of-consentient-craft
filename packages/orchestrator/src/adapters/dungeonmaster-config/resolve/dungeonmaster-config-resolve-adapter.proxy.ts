import { configResolveBroker, DungeonmasterConfigStub } from '@dungeonmaster/config';
import type { DungeonmasterConfig } from '@dungeonmaster/config';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

// configResolveBroker is called as configResolveBroker({ filePath: startPath }) — the
// filePath is the real, distinguishing address every caller resolves before calling in.
export const dungeonmasterConfigResolveAdapterProxy = (): {
  setupConfigResolved: (params: { startPath: FilePath; config: DungeonmasterConfig }) => void;
  setupConfigResolveError: (params: { startPath: FilePath; error: Error }) => void;
  getResolvedStartPath: () => FilePath | undefined;
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

    // Capture the `filePath` (= startPath) the adapter forwarded to configResolveBroker on its
    // most recent call. Lets callers assert the resolution origin is a resolvable file, not a
    // bare directory whose dirname() walks above the repo root.
    getResolvedStartPath: (): FilePath | undefined => {
      const calls = handle.callsMatching([]);
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
