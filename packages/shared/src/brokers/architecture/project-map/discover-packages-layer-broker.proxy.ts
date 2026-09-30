import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { DirEntrySync } from '#gateway/node/fs';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const makeDirEntry = ({ name, isDir }: { name: string; isDir: boolean }): DirEntrySync => ({
  name,
  kind: isDir ? 'directory' : 'file',
});

export const discoverPackagesLayerBrokerProxy = (): {
  setupPackages: (params: {
    dirPath: string;
    entries: { name: string; isDirectory: boolean }[];
  }) => void;
  // A `@scope` entry staged via setupPackages triggers a SECOND readdirEntriesSync call
  // into that group's own directory, joined the same way the broker joins it — keyed here so a
  // test can describe a group's children without duplicating that join itself.
  setupGroupFolder: (params: {
    dirPath: string;
    groupName: string;
    entries: { name: string; isDirectory: boolean }[];
  }) => void;
  setupMissingPackagesDir: (params: { dirPath: string }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    setupPackages: ({
      dirPath,
      entries,
    }: {
      dirPath: string;
      entries: { name: string; isDirectory: boolean }[];
    }): void => {
      gatewayProxy.returns({
        path: dirPath,
        entries: entries.map((entry) =>
          makeDirEntry({ name: entry.name, isDir: entry.isDirectory }),
        ),
      });
    },

    setupGroupFolder: ({
      dirPath,
      groupName,
      entries,
    }: {
      dirPath: string;
      groupName: string;
      entries: { name: string; isDirectory: boolean }[];
    }): void => {
      gatewayProxy.returns({
        path: `${dirPath}/${groupName}`,
        entries: entries.map((entry) =>
          makeDirEntry({ name: entry.name, isDir: entry.isDirectory }),
        ),
      });
    },

    setupMissingPackagesDir: ({ dirPath }: { dirPath: string }): void => {
      gatewayProxy.throws({
        path: dirPath,
        error: FileMissingErrorStub({ path: dirPath }),
      });
    },
  };
};
