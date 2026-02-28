import type { PathLike } from 'fs';
import type { FileContents } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { fsWriteFileSyncAdapterProxy } from '../../../adapters/fs/write-file-sync/fs-write-file-sync-adapter.proxy';
import { InstallDetectConfigResponder } from './install-detect-config-responder';

export const InstallDetectConfigResponderProxy = (): {
  callResponder: typeof InstallDetectConfigResponder;
  setupNoConfigExists: () => void;
  setupConfigExists: (params: { configFileName: string; contents: FileContents }) => void;
} => {
  pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileSyncAdapterProxy();
  fsWriteFileSyncAdapterProxy();

  return {
    callResponder: InstallDetectConfigResponder,

    setupNoConfigExists: (): void => {
      existsProxy.setupFileSystem(() => false);
    },

    setupConfigExists: ({
      configFileName,
      contents,
    }: {
      configFileName: string;
      contents: FileContents;
    }): void => {
      existsProxy.setupFileSystem((path: PathLike) => String(path).endsWith(configFileName));
      const dummyPath = filePathContract.parse(`/mock/${configFileName}`);
      readProxy.returns({ filePath: dummyPath, contents });
    },
  };
};
