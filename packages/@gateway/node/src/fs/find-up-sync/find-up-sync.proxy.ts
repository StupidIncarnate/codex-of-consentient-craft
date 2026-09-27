import { existsSyncProxy } from '../exists-sync/exists-sync.proxy';

export const findUpSyncProxy = (): {
  foundAt: ({ path }: { path: string }) => void;
  notFound: ({ path }: { path: string }) => void;
} => {
  const proxy = existsSyncProxy();

  return {
    foundAt: ({ path }: { path: string }): void => {
      proxy.returns({ path, exists: true });
    },
    notFound: ({ path }: { path: string }): void => {
      proxy.returns({ path, exists: false });
    },
  };
};
