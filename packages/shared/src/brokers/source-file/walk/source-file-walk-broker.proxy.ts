import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';

export const sourceFileWalkBrokerProxy = (): {
  setupWalkedFolder: ({
    dirPath,
    folders,
    files,
  }: {
    dirPath: string;
    folders: readonly string[];
    files: readonly string[];
  }) => void;
  setupMissingFolder: ({ dirPath }: { dirPath: string }) => void;
  getReaddirCallsFor: ({ dirPath }: { dirPath: string }) => readonly unknown[][];
} => {
  isFsErrorProxy();
  const readdirProxy = readdirEntriesSyncProxy();

  return {
    setupWalkedFolder: ({
      dirPath,
      folders,
      files,
    }: {
      dirPath: string;
      folders: readonly string[];
      files: readonly string[];
    }): void => {
      readdirProxy.returns({
        path: dirPath,
        entries: [
          ...folders.map((name) => ({ name, kind: 'directory' as const })),
          ...files.map((name) => ({ name, kind: 'file' as const })),
        ],
      });
    },

    setupMissingFolder: ({ dirPath }: { dirPath: string }): void => {
      readdirProxy.throws({ path: dirPath, error: FsErrorStub({ code: 'ENOENT', path: dirPath }) });
    },

    getReaddirCallsFor: ({ dirPath }: { dirPath: string }): readonly unknown[][] =>
      readdirProxy.getCallsFor({ path: dirPath }),
  };
};
