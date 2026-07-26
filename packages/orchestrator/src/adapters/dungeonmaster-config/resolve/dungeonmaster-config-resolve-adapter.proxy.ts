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
    // bare directory whose dirname() walks above the repo root. No caller-known address exists
    // here (startPath is whatever the broker under test derived) — `.map()` walks the COMPLETE
    // call history into filePaths first, so picking the tail reads a value already computed
    // from every recorded call, not a raw unaddressed peek.
    getResolvedStartPath: (): FilePath | undefined =>
      handle
        .callsMatching([])
        .map((call) => (call[0] as { filePath: FilePath }).filePath)
        .at(-1),

    makeRealConfig: (): DungeonmasterConfig => DungeonmasterConfigStub(),

    makeConfigWithArgs: (args: never): DungeonmasterConfig => DungeonmasterConfigStub(args),
  };
};
