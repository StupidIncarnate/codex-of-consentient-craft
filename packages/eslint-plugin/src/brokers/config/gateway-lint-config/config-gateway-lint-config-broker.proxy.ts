import { locationsStatics } from '@dungeonmaster/shared/statics';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const configGatewayLintConfigBrokerProxy = (): {
  setupDungeonmasterConfig: (args: { configDir: string; contents: string }) => void;
  setupNoDungeonmasterConfigAt: (args: { configDir: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileSyncProxy();

  return {
    setupDungeonmasterConfig: ({
      configDir,
      contents,
    }: {
      configDir: string;
      contents: string;
    }): void => {
      // Mirrors real path.join's own normalization (the broker joins via the real path.join): a root configDir ('/') must not double the leading slash.
      const configPath = (configDir.endsWith('/')
          ? `${configDir}${locationsStatics.repoRoot.config}`
          : `${configDir}/${locationsStatics.repoRoot.config}`);
      existsProxy.returns({ path: configPath, exists: true });
      readProxy.returns({ path: configPath, contents });
    },

    // existsSyncProxy ships no address-less catch-all by design: a walk-to-root "nothing found"
    // test stages every ancestor level false, one explicit call per level.
    setupNoDungeonmasterConfigAt: ({ configDir }: { configDir: string }): void => {
      const configPath = (configDir.endsWith('/')
          ? `${configDir}${locationsStatics.repoRoot.config}`
          : `${configDir}/${locationsStatics.repoRoot.config}`);
      existsProxy.returns({ path: configPath, exists: false });
    },
  };
};
