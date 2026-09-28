import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';

export const configGatewayLintConfigBrokerProxy = (): {
  setupDungeonmasterConfig: (args: { configDir: string; contents: string }) => void;
  setupNoDungeonmasterConfigAt: (args: { configDir: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = fsReadFileSyncAdapterProxy();
  // Real passthrough default: no explicit staging.
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();

  return {
    setupDungeonmasterConfig: ({
      configDir,
      contents,
    }: {
      configDir: string;
      contents: string;
    }): void => {
      // Mirrors real path.join's own normalization (the broker joins via pathJoinAdapter, whose
      // default is a real passthrough): a root configDir ('/') must not double the leading slash.
      const configPath = FilePathStub({
        value: configDir.endsWith('/')
          ? `${configDir}${locationsStatics.repoRoot.config}`
          : `${configDir}/${locationsStatics.repoRoot.config}`,
      });
      existsProxy.returns({ path: configPath, exists: true });
      readProxy.returns({ filePath: configPath, contents: FileContentsStub({ value: contents }) });
    },

    // existsSyncProxy ships no address-less catch-all by design: a walk-to-root "nothing found"
    // test stages every ancestor level false, one explicit call per level.
    setupNoDungeonmasterConfigAt: ({ configDir }: { configDir: string }): void => {
      const configPath = FilePathStub({
        value: configDir.endsWith('/')
          ? `${configDir}${locationsStatics.repoRoot.config}`
          : `${configDir}/${locationsStatics.repoRoot.config}`,
      });
      existsProxy.returns({ path: configPath, exists: false });
    },
  };
};
