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
  setupConfigExists: (params: {
    targetProjectRoot: string;
    configFileName: string;
    contents: FileContents;
  }) => void;
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
      targetProjectRoot,
      configFileName,
      contents,
    }: {
      targetProjectRoot: string;
      configFileName: string;
      contents: FileContents;
    }): void => {
      existsProxy.setupFileSystem((path: PathLike) => String(path).endsWith(configFileName));
      // Matches pathJoinAdapterProxy's default join behavior (segments.join('/')), so the
      // staged key equals what actually reaches readFileSync via pathJoinAdapter + fsReadFileSyncAdapter.
      const filePath = filePathContract.parse(`${targetProjectRoot}/${configFileName}`);
      readProxy.returns({ filePath, contents });
    },
  };
};
