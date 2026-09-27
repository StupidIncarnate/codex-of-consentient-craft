import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

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
  const existsProxy = existsSyncProxy();
  const readProxy = readFileSyncProxy();

  return {
    setupMissingConfig: ({ configPath }: { configPath: AbsoluteFilePath }): void => {
      existsProxy.returns({ path: configPath, exists: false });
    },

    setupConfig: ({
      configPath,
      fileContent,
    }: {
      configPath: AbsoluteFilePath;
      fileContent: ContentText;
    }): void => {
      existsProxy.returns({ path: configPath, exists: true });
      readProxy.returns({ path: configPath, contents: fileContent });
    },
  };
};
