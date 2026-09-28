import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

/**
 * Proxy for barrelCompletenessLayerBroker. Stages the three fs boundaries the broker crosses: which
 * directories hold which entries, which target files exist, and what each one's source text is.
 */
export const barrelCompletenessLayerBrokerProxy = (): {
  fsReaddirSync: ReturnType<typeof readdirEntriesSyncProxy>;
  fsExistsSync: ReturnType<typeof existsSyncProxy>;
  fsReadFileSync: ReturnType<typeof readFileSyncProxy>;
} => ({
  fsReaddirSync: readdirEntriesSyncProxy(),
  fsExistsSync: existsSyncProxy(),
  fsReadFileSync: readFileSyncProxy(),
});
