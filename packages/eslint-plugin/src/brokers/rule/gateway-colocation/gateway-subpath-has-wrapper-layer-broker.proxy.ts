import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';

export const gatewaySubpathHasWrapperLayerBrokerProxy = (): {
  fsReaddirSync: ReturnType<typeof readdirEntriesSyncProxy>;
} => ({
  fsReaddirSync: readdirEntriesSyncProxy(),
});
