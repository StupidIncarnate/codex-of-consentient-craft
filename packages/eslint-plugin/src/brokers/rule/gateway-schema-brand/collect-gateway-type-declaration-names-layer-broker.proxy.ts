import { fsReaddirSyncAdapterProxy } from '../../../adapters/fs/readdir-sync/fs-readdir-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';

export const collectGatewayTypeDeclarationNamesLayerBrokerProxy = (): {
  fsReaddirSync: ReturnType<typeof fsReaddirSyncAdapterProxy>;
  fsReadFileSync: ReturnType<typeof fsReadFileSyncAdapterProxy>;
} => ({
  fsReaddirSync: fsReaddirSyncAdapterProxy(),
  fsReadFileSync: fsReadFileSyncAdapterProxy(),
});
