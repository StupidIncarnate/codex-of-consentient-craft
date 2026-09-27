import { readFileSyncProxy } from '../read-file-sync/read-file-sync.proxy';

export const readJsonFileSyncProxy = (): {
  returns: ({ path, json }: { path: string; json: string }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
} => {
  const readProxy = readFileSyncProxy();

  return {
    returns: ({ path, json }: { path: string; json: string }): void => {
      readProxy.returns({ path, contents: json });
    },
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      readProxy.throws({ path, error });
    },
  };
};
