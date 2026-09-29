import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';

export const barrelWrapperPathsReadBrokerProxy = (): {
  returns: (args: { path: string; contents: string }) => void;
  missing: (args: { path: string }) => void;
  throws: (args: { path: string; error: NodeJS.ErrnoException }) => void;
} => {
  const readProxy = readFileSyncIfExistsProxy();

  return {
    returns: ({ path, contents }: { path: string; contents: string }): void => {
      readProxy.returns({ path, contents });
    },
    missing: ({ path }: { path: string }): void => {
      readProxy.missing({ path });
    },
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      readProxy.throws({ path, error });
    },
  };
};
