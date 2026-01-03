import { pathJoinAdapterProxy } from '../adapters/path/join/path-join-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { fsWriteFileSyncAdapterProxy } from '../adapters/fs/write-file-sync/fs-write-file-sync-adapter.proxy';

export const StartInstallProxy = (): {
  pathJoin: ReturnType<typeof pathJoinAdapterProxy>;
  fsExistsSync: ReturnType<typeof fsExistsSyncAdapterProxy>;
  fsReadFileSync: ReturnType<typeof fsReadFileSyncAdapterProxy>;
  fsWriteFileSync: ReturnType<typeof fsWriteFileSyncAdapterProxy>;
} => {
  const pathJoin = pathJoinAdapterProxy();
  const fsExistsSync = fsExistsSyncAdapterProxy();
  const fsReadFileSync = fsReadFileSyncAdapterProxy();
  const fsWriteFileSync = fsWriteFileSyncAdapterProxy();

  return {
    pathJoin,
    fsExistsSync,
    fsReadFileSync,
    fsWriteFileSync,
  };
};
