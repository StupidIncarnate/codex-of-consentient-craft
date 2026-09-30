import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const gatewayLintConfigReadBrokerProxy = (): {
  setupMissingConfig: ({ configPath }: { configPath: string }) => void;
  setupConfig: ({ configPath, fileContent }: { configPath: string; fileContent: string }) => void;
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
      fileContent: string;
    }): void => {
      existsProxy.returns({ path: configPath, exists: true });
      readProxy.returns({ path: configPath, contents: fileContent });
    },
  };
};
