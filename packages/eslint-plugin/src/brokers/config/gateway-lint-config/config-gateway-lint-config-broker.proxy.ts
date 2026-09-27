import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';

export const configGatewayLintConfigBrokerProxy = (): {
  setupDungeonmasterConfig: (args: { configDir: string; contents: string }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileSyncAdapterProxy();
  // Real passthrough default: no explicit staging.
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();

  // No single path to key on: the walk probes every ancestor directory, so the honest catch-all is
  // "nothing exists" and each test stages the one that does.
  existsProxy.setupFileSystem(() => false);

  return {
    setupDungeonmasterConfig: ({
      configDir,
      contents,
    }: {
      configDir: string;
      contents: string;
    }): void => {
      const configPath = FilePathStub({
        value: `${configDir}/${locationsStatics.repoRoot.config}`,
      });
      existsProxy.returns({ filePath: configPath, exists: true });
      readProxy.returns({ filePath: configPath, contents: FileContentsStub({ value: contents }) });
    },
  };
};
