import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const checkGatewayExportNameExistsLayerBrokerProxy = (): {
  setupBarrelSource: (args: { barrelPath: string; sourceText: string }) => void;
  setupRelativeTargetSource: (args: { targetPath: string; sourceText: string }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileSyncAdapterProxy();
  // Real passthrough default: no explicit staging.
  pathDirnameAdapterProxy();
  pathJoinAdapterProxy();

  // No single path to key on: a relative re-export target may or may not exist on disk, so the
  // honest catch-all is "nothing exists" and each test stages the one path that does.
  existsProxy.setupFileSystem(() => false);

  return {
    setupBarrelSource: ({
      barrelPath,
      sourceText,
    }: {
      barrelPath: string;
      sourceText: string;
    }): void => {
      readProxy.returns({
        filePath: FilePathStub({ value: barrelPath }),
        contents: FileContentsStub({ value: sourceText }),
      });
    },

    setupRelativeTargetSource: ({
      targetPath,
      sourceText,
    }: {
      targetPath: string;
      sourceText: string;
    }): void => {
      const filePath = FilePathStub({ value: targetPath });
      existsProxy.returns({ filePath, exists: true });
      readProxy.returns({ filePath, contents: FileContentsStub({ value: sourceText }) });
    },
  };
};
