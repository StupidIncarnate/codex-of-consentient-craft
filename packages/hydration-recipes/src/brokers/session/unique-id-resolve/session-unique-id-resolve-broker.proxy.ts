import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';

export const sessionUniqueIdResolveBrokerProxy = (): {
  setupExisting: ({ filePaths }: { filePaths: readonly string[] }) => void;
  setupFree: ({ filePaths }: { filePaths: readonly string[] }) => void;
} => {
  const existsProxy = existsSyncProxy();

  return {
    setupExisting: ({ filePaths }: { filePaths: readonly string[] }): void => {
      filePaths.forEach((path) => {
        existsProxy.returns({ path, exists: true });
      });
    },
    setupFree: ({ filePaths }: { filePaths: readonly string[] }): void => {
      filePaths.forEach((path) => {
        existsProxy.returns({ path, exists: false });
      });
    },
  };
};
