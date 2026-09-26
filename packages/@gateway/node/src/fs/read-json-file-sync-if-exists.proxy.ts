import { readFileSyncIfExistsProxy } from './read-file-sync-if-exists.proxy';

export const readJsonFileSyncIfExistsProxy = (): {
  returns: ({ path, json }: { path: string; json: string }) => void;
  missing: ({ path }: { path: string }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
} => {
  const readProxy = readFileSyncIfExistsProxy();

  return {
    returns: ({ path, json }: { path: string; json: string }): void => {
      readProxy.returns({ path, contents: json });
    },
    missing: ({ path }: { path: string }): void => {
      readProxy.missing({ path });
    },
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      readProxy.throws({ path, error });
    },
  };
};
