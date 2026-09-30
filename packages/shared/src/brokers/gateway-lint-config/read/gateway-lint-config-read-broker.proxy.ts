import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const gatewayLintConfigReadBrokerProxy = (): {
  setupMissingConfig: ({ configPath }: { configPath: string }) => void;
  setupConfig: ({
    configPath,
    fileContent,
  }: {
    configPath: string;
    fileContent: ContentText;
  }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileSyncProxy();

  return {
    setupMissingConfig: ({ configPath }: { configPath: string }): void => {
      existsProxy.returns({ path: configPath, exists: false });
    },

    setupConfig: ({
      configPath,
      fileContent,
    }: {
      configPath: string;
      fileContent: ContentText;
    }): void => {
      existsProxy.returns({ path: configPath, exists: true });
      readProxy.returns({ path: configPath, contents: fileContent });
    },
  };
};
