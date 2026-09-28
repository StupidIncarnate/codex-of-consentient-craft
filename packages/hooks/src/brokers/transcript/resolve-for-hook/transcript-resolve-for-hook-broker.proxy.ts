import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';

export const transcriptResolveForHookBrokerProxy = (): {
  setupExists: ({ path, exists }: { path: string; exists: boolean }) => void;
} => {
  const fsProxy = existsSyncProxy();

  return {
    setupExists: ({ path, exists }: { path: string; exists: boolean }): void => {
      fsProxy.returns({ path, exists });
    },
  };
};
