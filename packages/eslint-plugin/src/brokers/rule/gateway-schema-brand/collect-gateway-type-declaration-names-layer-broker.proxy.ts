import { fsReaddirSyncAdapterProxy } from '../../../adapters/fs/readdir-sync/fs-readdir-sync-adapter.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const collectGatewayTypeDeclarationNamesLayerBrokerProxy = (): {
  fsReaddirSync: ReturnType<typeof fsReaddirSyncAdapterProxy>;
  fsReadFileSync: ReturnType<typeof readFileSyncProxy>;
} => ({
  fsReaddirSync: fsReaddirSyncAdapterProxy(),
  fsReadFileSync: readFileSyncProxy(),
});
