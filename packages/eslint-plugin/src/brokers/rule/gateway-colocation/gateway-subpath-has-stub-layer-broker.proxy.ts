import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';

export const gatewaySubpathHasStubLayerBrokerProxy = (): {
  fsReaddirSync: ReturnType<typeof readdirEntriesSyncProxy>;
} => ({
  fsReaddirSync: readdirEntriesSyncProxy(),
});
