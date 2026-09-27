import { readFileSyncProxy } from '../read-file-sync/read-file-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

export const readFileSyncIfExistsProxy = (): {
  returns: ({ path, contents }: { path: string; contents: string }) => void;
  missing: ({ path }: { path: string }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
} => {
  const readProxy = readFileSyncProxy();

  return {
    returns: ({ path, contents }: { path: string; contents: string }): void => {
      readProxy.returns({ path, contents });
    },
    missing: ({ path }: { path: string }): void => {
      readProxy.throws({ path, error: FsErrorStub({ code: 'ENOENT', path }) });
    },
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      readProxy.throws({ path, error });
    },
  };
};
