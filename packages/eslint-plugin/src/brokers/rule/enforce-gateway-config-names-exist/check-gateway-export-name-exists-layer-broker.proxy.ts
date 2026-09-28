import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const checkGatewayExportNameExistsLayerBrokerProxy = (): {
  setupBarrelSource: (args: { barrelPath: string; sourceText: string }) => void;
  setupRelativeTargetSource: (args: { targetPath: string; sourceText: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileSyncProxy();

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
