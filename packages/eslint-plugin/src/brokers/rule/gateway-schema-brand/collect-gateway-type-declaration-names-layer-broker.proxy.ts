import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const collectGatewayTypeDeclarationNamesLayerBrokerProxy = (): {
  fsReaddirSync: ReturnType<typeof readdirEntriesSyncProxy>;
  fsReadFileSync: ReturnType<typeof readFileSyncProxy>;
} => ({
  fsReaddirSync: readdirEntriesSyncProxy(),
  fsReadFileSync: readFileSyncProxy(),
});
