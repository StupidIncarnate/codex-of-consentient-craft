import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const checkGatewayExportNameExistsLayerBrokerProxy = (): {
  setupBarrelSource: (args: { barrelPath: string; sourceText: string }) => void;
  setupRelativeTargetSource: (args: { targetPath: string; sourceText: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileSyncProxy();
  // Real passthrough default: no explicit staging.
  pathDirnameAdapterProxy();
  pathJoinAdapterProxy();

  return {
    setupBarrelSource: ({
      barrelPath,
      sourceText,
    }: {
      barrelPath: string;
      sourceText: string;
    }): void => {
      readProxy.returns({
        path: FilePathStub({ value: barrelPath }),
        contents: sourceText,
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
      existsProxy.returns({ path: filePath, exists: true });
      readProxy.returns({ path: filePath, contents: sourceText });
    },
  };
};
