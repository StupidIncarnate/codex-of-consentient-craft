import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';

export const guildUniquePathResolveBrokerProxy = (): {
  setupExisting: ({ absolutePaths }: { absolutePaths: readonly string[] }) => void;
  setupFree: ({ absolutePaths }: { absolutePaths: readonly string[] }) => void;
} => {
  const existsProxy = existsSyncProxy();

  return {
    setupExisting: ({ absolutePaths }: { absolutePaths: readonly string[] }): void => {
      absolutePaths.forEach((path) => {
        existsProxy.returns({ path, exists: true });
      });
    },
    setupFree: ({ absolutePaths }: { absolutePaths: readonly string[] }): void => {
      absolutePaths.forEach((path) => {
        existsProxy.returns({ path, exists: false });
      });
    },
  };
};
