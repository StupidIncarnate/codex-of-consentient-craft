import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { DirEntrySync } from '#gateway/node/fs';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const makeDirEntry = ({ name, isDir }: { name: string; isDir: boolean }): DirEntrySync => ({
  name,
  kind: isDir ? 'directory' : 'file',
});

export const discoverPackagesLayerBrokerProxy = (): {
  setupPackages: (params: {
    dirPath: AbsoluteFilePath;
    entries: { name: string; isDirectory: boolean }[];
  }) => void;
  // A `@scope` entry staged via setupPackages triggers a SECOND readdirEntriesSync call
  // into that group's own directory, joined the same way the broker joins it — keyed here so a
  // test can describe a group's children without duplicating that join itself.
  setupGroupFolder: (params: {
    dirPath: AbsoluteFilePath;
    groupName: string;
    entries: { name: string; isDirectory: boolean }[];
  }) => void;
  setupMissingPackagesDir: (params: { dirPath: AbsoluteFilePath }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    setupPackages: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: { name: string; isDirectory: boolean }[];
    }): void => {
      gatewayProxy.returns({
        path: String(dirPath),
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
      dirPath: AbsoluteFilePath;
      groupName: string;
      entries: { name: string; isDirectory: boolean }[];
    }): void => {
      gatewayProxy.returns({
        path: String(AbsoluteFilePathStub({ value: `${String(dirPath)}/${groupName}` })),
        entries: entries.map((entry) =>
          makeDirEntry({ name: entry.name, isDir: entry.isDirectory }),
        ),
      });
    },

    setupMissingPackagesDir: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      gatewayProxy.throws({
        path: String(dirPath),
        error: FileMissingErrorStub({ path: String(dirPath) }),
      });
    },
  };
};
