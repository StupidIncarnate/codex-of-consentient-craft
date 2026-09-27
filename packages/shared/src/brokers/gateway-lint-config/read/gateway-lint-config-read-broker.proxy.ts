import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const gatewayLintConfigReadBrokerProxy = (): {
  setupMissingConfig: ({ configPath }: { configPath: AbsoluteFilePath }) => void;
  setupConfig: ({
    configPath,
    fileContent,
  }: {
    configPath: AbsoluteFilePath;
    fileContent: ContentText;
  }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileSyncAdapterProxy();

  return {
    setupMissingConfig: ({ configPath }: { configPath: AbsoluteFilePath }): void => {
      existsProxy.returns({
        filePath: FilePathStub({ value: String(configPath) }),
        result: false,
      });
    },

    setupConfig: ({
      configPath,
      fileContent,
    }: {
      configPath: AbsoluteFilePath;
      fileContent: ContentText;
    }): void => {
      existsProxy.returns({ filePath: FilePathStub({ value: String(configPath) }), result: true });
      readProxy.returns({ filePath: configPath, content: fileContent });
    },
  };
};
