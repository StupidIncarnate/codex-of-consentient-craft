import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { DirEntrySync } from '#gateway/node/fs';

export const listFlowFilesLayerBrokerProxy = (): {
  returns: ({ dirPath, entries }: { dirPath: string; entries: DirEntrySync[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    returns: ({ dirPath, entries }: { dirPath: string; entries: DirEntrySync[] }): void => {
      gatewayProxy.returns({ path: dirPath, entries });
    },
  };
};
