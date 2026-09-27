import { fsReaddirSyncAdapterProxy } from '../../../adapters/fs/readdir-sync/fs-readdir-sync-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';

/**
 * Proxy for barrelCompletenessLayerBroker. Stages the three fs boundaries the broker crosses: which
 * directories hold which entries, which target files exist, and what each one's source text is.
 */
export const barrelCompletenessLayerBrokerProxy = (): {
  fsReaddirSync: ReturnType<typeof fsReaddirSyncAdapterProxy>;
  fsExistsSync: ReturnType<typeof fsExistsSyncAdapterProxy>;
  fsReadFileSync: ReturnType<typeof fsReadFileSyncAdapterProxy>;
} => ({
  fsReaddirSync: fsReaddirSyncAdapterProxy(),
  fsExistsSync: fsExistsSyncAdapterProxy(),
  fsReadFileSync: fsReadFileSyncAdapterProxy(),
});
