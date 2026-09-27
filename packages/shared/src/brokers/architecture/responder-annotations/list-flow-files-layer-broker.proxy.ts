import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { DirEntrySync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const listFlowFilesLayerBrokerProxy = (): {
  returns: ({ dirPath, entries }: { dirPath: AbsoluteFilePath; entries: DirEntrySync[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    returns: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: DirEntrySync[];
    }): void => {
      gatewayProxy.returns({ path: String(dirPath), entries });
    },
  };
};
